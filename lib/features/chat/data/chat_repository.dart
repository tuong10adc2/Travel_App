import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/firebase_providers.dart';
import '../models/chat_message.dart';

final firebaseFunctionsProvider = Provider<FirebaseFunctions>((ref) {
  return FirebaseFunctions.instance;
});

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  return ChatRepository(
    firestore: ref.watch(firestoreProvider),
    firebaseAuth: ref.watch(firebaseAuthProvider),
    functions: ref.watch(firebaseFunctionsProvider),
  );
});

/// Đơn giản hoá: mỗi user chỉ có 1 phiên chat liên tục (doc id cố định
/// 'default') thay vì quản lý nhiều phiên — đủ cho yêu cầu "lưu lịch sử chat".
const defaultChatSessionId = 'default';

const _maxHistoryTurns = 20;

class ChatRepository {
  ChatRepository({
    required FirebaseFirestore firestore,
    required FirebaseAuth firebaseAuth,
    required FirebaseFunctions functions,
  })  : _firestore = firestore,
        _firebaseAuth = firebaseAuth,
        _functions = functions;

  final FirebaseFirestore _firestore;
  final FirebaseAuth _firebaseAuth;
  final FirebaseFunctions _functions;

  CollectionReference<Map<String, dynamic>> _messages(String uid) => _firestore
      .collection('users')
      .doc(uid)
      .collection('chat_history')
      .doc(defaultChatSessionId)
      .collection('messages');

  DocumentReference<Map<String, dynamic>> _session(String uid) =>
      _firestore.collection('users').doc(uid).collection('chat_history').doc(defaultChatSessionId);

  /// Gửi tin nhắn: ghi tin nhắn user ngay (hiển thị lạc quan qua stream), gọi
  /// Cloud Function `chatWithAssistant` kèm [priorMessages] làm lịch sử hội
  /// thoại, rồi ghi tiếp câu trả lời của trợ lý (kèm `placeSuggestionIds` nếu
  /// AI có gợi ý địa điểm) vào cùng sub-collection.
  Future<void> sendMessage({
    required String text,
    required List<ChatMessage> priorMessages,
  }) async {
    final user = _firebaseAuth.currentUser;
    if (user == null) throw StateError('Chưa đăng nhập');

    final trimmed = text.trim();
    if (trimmed.isEmpty) return;

    final messagesRef = _messages(user.uid);
    final sessionUpdate = <String, dynamic>{'updatedAt': FieldValue.serverTimestamp()};
    if (priorMessages.isEmpty) {
      // Chỉ đặt tiêu đề + createdAt 1 lần, ở tin nhắn đầu phiên.
      sessionUpdate['title'] = trimmed.length > 60 ? '${trimmed.substring(0, 60)}...' : trimmed;
      sessionUpdate['createdAt'] = FieldValue.serverTimestamp();
    }
    await _session(user.uid).set(sessionUpdate, SetOptions(merge: true));

    await messagesRef.add({
      'role': 'user',
      'content': trimmed,
      'placeSuggestionIds': <String>[],
      'createdAt': FieldValue.serverTimestamp(),
    });

    final history = priorMessages
        .take(_maxHistoryTurns)
        .map((m) => {'role': m.role, 'content': m.content})
        .toList();

    final callable = _functions.httpsCallable(
      'chatWithAssistant',
      options: HttpsCallableOptions(timeout: const Duration(seconds: 60)),
    );
    final result = await callable.call<Map<String, dynamic>>({
      'message': trimmed,
      'history': history,
    });

    final reply = (result.data['reply'] as String?) ?? '';
    final suggestedPlaceIds = List<String>.from(result.data['suggestedPlaceIds'] as List? ?? const []);

    // itineraryPlan trả về dạng [{dayIndex, placeIds}, ...] (kết quả tool plan_itinerary,
    // đã gom theo khu vực địa lý + sắp thứ tự ở server) — chuyển thành List<List<String>>
    // theo đúng thứ tự dayIndex để lưu gọn vào Firestore.
    final rawPlan = result.data['itineraryPlan'] as List? ?? const [];
    final itineraryPlan = rawPlan
        .map((day) => List<String>.from((day as Map)['placeIds'] as List? ?? const []))
        .toList();

    await messagesRef.add({
      'role': 'assistant',
      'content': reply,
      'placeSuggestionIds': suggestedPlaceIds,
      'itineraryPlan': itineraryPlan,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }
}
