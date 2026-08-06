import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../models/review.dart';
import 'star_rating.dart';

class ReviewListItem extends StatelessWidget {
  const ReviewListItem({super.key, required this.review, required this.isMine});

  final Review review;
  final bool isMine;

  String _formatDate(DateTime date) {
    final d = date.day.toString().padLeft(2, '0');
    final m = date.month.toString().padLeft(2, '0');
    return '$d/$m/${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: AppColors.primary.withOpacity(0.12),
            child: Text(
              review.userName.isNotEmpty ? review.userName[0].toUpperCase() : '?',
              style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(review.userName, style: const TextStyle(fontWeight: FontWeight.w600)),
                    if (review.createdAt != null) ...[
                      const SizedBox(width: AppSpacing.sm),
                      Text(
                        _formatDate(review.createdAt!),
                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 2),
                StarRating(rating: review.rating.toDouble(), size: 14),
                if (review.comment.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(review.comment),
                ],
                if (isMine && review.isPending) ...[
                  const SizedBox(height: 4),
                  const Text(
                    'Đang chờ duyệt — chỉ bạn thấy đánh giá này',
                    style: TextStyle(fontSize: 11, color: AppColors.textSecondary, fontStyle: FontStyle.italic),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
