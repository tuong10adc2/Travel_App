import 'package:cloud_firestore/cloud_firestore.dart';

class ChatMessage {
  final String id;
  final String role; // 'user' | 'assistant'
  final String content;
  final List<String> placeSuggestionIds;
  // Lịch trình gợi ý theo ngày (kết quả tool plan_itinerary): mỗi phần tử là danh sách
  // placeId của 1 ngày, đã sắp theo thứ tự di chuyển hợp lý — rỗng nếu không có gợi ý.
  final List<List<String>> itineraryPlan;
  final DateTime? createdAt;

  ChatMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.placeSuggestionIds,
    required this.itineraryPlan,
    required this.createdAt,
  });

  bool get isUser => role == 'user';

  factory ChatMessage.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? {};
    final rawPlan = data['itineraryPlan'] as List? ?? const [];
    return ChatMessage(
      id: doc.id,
      role: (data['role'] as String?) ?? 'assistant',
      content: (data['content'] as String?) ?? '',
      placeSuggestionIds: List<String>.from(data['placeSuggestionIds'] as List? ?? const []),
      itineraryPlan: rawPlan.map((day) => List<String>.from(day as List? ?? const [])).toList(),
      createdAt: (data['createdAt'] as Timestamp?)?.toDate(),
    );
  }
}
