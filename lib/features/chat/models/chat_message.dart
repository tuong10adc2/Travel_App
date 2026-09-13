import 'package:cloud_firestore/cloud_firestore.dart';

/// 1 ngày trong lịch trình gợi ý (kết quả tool `plan_itinerary`): danh sách địa điểm đã sắp
/// theo thứ tự di chuyển hợp lý, kèm giờ đến dự kiến từng điểm (tính từ khoảng cách + giờ mở
/// cửa ở server) và cảnh báo nếu có điểm có thể bị ghé lúc đã đóng cửa.
class ItineraryDay {
  final List<String> placeIds;
  final Map<String, String> arrivalByPlaceId; // placeId -> "HH:MM"
  final List<String> warnings;

  ItineraryDay({
    required this.placeIds,
    required this.arrivalByPlaceId,
    required this.warnings,
  });

  /// Chấp nhận cả 2 dạng: `[id1, id2]` (dạng rất cũ, không còn ghi ra nhưng có thể còn sót
  /// trong lịch sử chat đã lưu) và `{dayIndex, placeIds, schedule, warnings}` (dạng hiện tại,
  /// khớp với API `/api/chat` và cách webapp lưu) — tránh lỗi ép kiểu khi tải lại hội thoại cũ.
  factory ItineraryDay._fromRaw(dynamic day) {
    if (day is List) {
      return ItineraryDay(placeIds: List<String>.from(day), arrivalByPlaceId: const {}, warnings: const []);
    }
    if (day is Map) {
      final placeIds = List<String>.from(day['placeIds'] as List? ?? const []);
      final schedule = day['schedule'] as List? ?? const [];
      final arrivalByPlaceId = <String, String>{
        for (final s in schedule)
          if (s is Map && s['placeId'] is String && s['arrival'] is String) s['placeId'] as String: s['arrival'] as String,
      };
      final warnings = List<String>.from(day['warnings'] as List? ?? const []);
      return ItineraryDay(placeIds: placeIds, arrivalByPlaceId: arrivalByPlaceId, warnings: warnings);
    }
    return ItineraryDay(placeIds: const [], arrivalByPlaceId: const {}, warnings: const []);
  }
}

class ChatMessage {
  final String id;
  final String role; // 'user' | 'assistant'
  final String content;
  final List<String> placeSuggestionIds;
  final List<ItineraryDay> itineraryPlan;
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
      itineraryPlan: rawPlan.map(ItineraryDay._fromRaw).toList(),
      createdAt: (data['createdAt'] as Timestamp?)?.toDate(),
    );
  }
}
