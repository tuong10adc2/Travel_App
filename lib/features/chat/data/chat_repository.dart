import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import '../../../core/providers/firebase_providers.dart';
import '../models/chat_message.dart';

/// Domain webapp (Vercel) — nơi host `/api/chat` thay cho Cloud Function
/// `chatWithAssistant` cũ (chặn bởi Blaze). Xem `migration-vercel-ai.md`.
const _chatApiBaseUrl = 'https://travel-app-6rww.vercel.app';

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  return ChatRepository(
    firestore: ref.watch(firestoreProvider),
    firebaseAuth: ref.watch(firebaseAuthProvider),
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
  })  : _firestore = firestore,
        _firebaseAuth = firebaseAuth;

  final FirebaseFirestore _firestore;
  final FirebaseAuth _firebaseAuth;

  CollectionReference<Map<String, dynamic>> _messages(String uid) => _firestore
      .collection('users')
      .doc(uid)
      .collection('chat_history')
      .doc(defaultChatSessionId)
      .collection('messages');

  DocumentReference<Map<String, dynamic>> _session(String uid) =>
      _firestore.collection('users').doc(uid).collection('chat_history').doc(defaultChatSessionId);

  /// Gửi tin nhắn: ghi tin nhắn user ngay (hiển thị lạc quan qua stream), gọi
  /// `/api/chat` (SSE — chữ hiện dần) kèm [priorMessages] làm lịch sử hội
  /// thoại, gọi [onTextDelta] mỗi khi có đoạn chữ mới để UI hiện dần, rồi ghi
  /// câu trả lời đầy đủ (kèm `placeSuggestionIds`/`itineraryPlan` nếu có) vào
  /// Firestore đúng 1 lần khi stream kết thúc — không ghi mỗi delta.
  Future<void> sendMessage({
    required String text,
    required List<ChatMessage> priorMessages,
    void Function(String textSoFar)? onTextDelta,
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

    final idToken = await user.getIdToken();
    final request = http.Request('POST', Uri.parse('$_chatApiBaseUrl/api/chat'))
      ..headers.addAll({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $idToken',
      })
      ..body = jsonEncode({'message': trimmed, 'history': history});

    final client = http.Client();
    String reply = '';
    List<String> suggestedPlaceIds = const [];
    List itineraryPlan = const [];
    String? streamError;
    bool gotDone = false;

    try {
      final streamedResponse = await client.send(request).timeout(const Duration(seconds: 60));
      if (streamedResponse.statusCode != 200) {
        final body = await streamedResponse.stream.bytesToString();
        final data = jsonDecode(body) as Map<String, dynamic>;
        throw StateError((data['error'] as String?) ?? 'Đã có lỗi khi gọi trợ lý AI.');
      }

      var buffer = '';
      await for (final chunk in streamedResponse.stream.transform(utf8.decoder)) {
        buffer += chunk;
        final events = buffer.split('\n\n');
        buffer = events.isNotEmpty ? events.removeLast() : '';
        for (final raw in events) {
          final line = raw.trim();
          if (!line.startsWith('data:')) continue;
          final event = jsonDecode(line.substring(5).trim()) as Map<String, dynamic>;
          switch (event['type']) {
            case 'text_delta':
              reply += event['text'] as String? ?? '';
              onTextDelta?.call(reply);
            case 'done':
              gotDone = true;
              reply = (event['reply'] as String?) ?? reply;
              suggestedPlaceIds = List<String>.from(event['suggestedPlaceIds'] as List? ?? const []);
              itineraryPlan = event['itineraryPlan'] as List? ?? const [];
            case 'error':
              streamError = event['error'] as String?;
          }
        }
      }
    } finally {
      client.close();
    }

    if (streamError != null) throw StateError(streamError);
    if (!gotDone) throw StateError('Đã có lỗi khi gọi trợ lý AI.');

    // itineraryPlan trả về dạng [{dayIndex, placeIds, schedule, warnings}, ...] — lưu nguyên
    // dạng gốc, khớp đúng format webapp cũng đang lưu vào cùng collection `chat_history` (2
    // client dùng chung 1 backend/schema). `ChatMessage.fromDoc` khi đọc lại tự nhận diện đúng.
    await messagesRef.add({
      'role': 'assistant',
      'content': reply,
      'placeSuggestionIds': suggestedPlaceIds,
      'itineraryPlan': itineraryPlan,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }
}
