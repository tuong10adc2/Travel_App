import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/firebase_providers.dart';
import '../../auth/data/auth_repository.dart';
import '../data/chat_repository.dart';
import '../models/chat_message.dart';

final chatMessagesProvider = StreamProvider<List<ChatMessage>>((ref) {
  final uid = ref.watch(authStateChangesProvider).valueOrNull?.uid;
  if (uid == null) return Stream.value(const []);

  return ref
      .watch(firestoreProvider)
      .collection('users')
      .doc(uid)
      .collection('chat_history')
      .doc(defaultChatSessionId)
      .collection('messages')
      .orderBy('createdAt')
      .snapshots()
      .map((snapshot) => snapshot.docs.map(ChatMessage.fromDoc).toList());
});

/// true khi đang chờ Cloud Function trả lời (đợi tin nhắn assistant tiếp theo).
final isChatWaitingForReplyProvider = StateProvider<bool>((ref) => false);
