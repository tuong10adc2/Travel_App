import 'package:cloud_firestore/cloud_firestore.dart';

/// Đánh giá dùng chung cho cả địa điểm (`targetType: 'place'`) và tour
/// (`targetType: 'tour'`) — `targetId` là id của place/tour tương ứng.
class Review {
  final String id;
  final String targetType;
  final String targetId;
  final String userId;
  final String userName;
  final int rating;
  final String comment;
  final String status;
  final DateTime? createdAt;

  Review({
    required this.id,
    required this.targetType,
    required this.targetId,
    required this.userId,
    required this.userName,
    required this.rating,
    required this.comment,
    required this.status,
    required this.createdAt,
  });

  bool get isPending => status == 'pending';

  factory Review.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? {};
    return Review(
      id: doc.id,
      targetType: (data['targetType'] as String?) ?? 'place',
      targetId: (data['targetId'] as String?) ?? '',
      userId: (data['userId'] as String?) ?? '',
      userName: (data['userName'] as String?) ?? 'Người dùng',
      rating: ((data['rating'] as num?) ?? 0).toInt(),
      comment: (data['comment'] as String?) ?? '',
      status: (data['status'] as String?) ?? 'pending',
      createdAt: (data['createdAt'] as Timestamp?)?.toDate(),
    );
  }
}
