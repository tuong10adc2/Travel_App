import 'package:cloud_firestore/cloud_firestore.dart';

class ChatMessage {
  final String id;
  final String role; // 'user' | 'assistant'
  final String content;
  final List<String> placeSuggestionIds;
  final DateTime? createdAt;

  ChatMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.placeSuggestionIds,
    required this.createdAt,
  });

  bool get isUser => role == 'user';

  factory ChatMessage.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? {};
    return ChatMessage(
      id: doc.id,
      role: (data['role'] as String?) ?? 'assistant',
      content: (data['content'] as String?) ?? '',
      placeSuggestionIds: List<String>.from(data['placeSuggestionIds'] as List? ?? const []),
      createdAt: (data['createdAt'] as Timestamp?)?.toDate(),
    );
  }
}
