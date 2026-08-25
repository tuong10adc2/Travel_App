import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Trạng thái rỗng dùng chung — icon đặt trên 2 lớp vòng tròn màu thương
/// hiệu mờ dần (thay vì 1 icon xám trơ) cho cảm giác "có thiết kế" hơn khi
/// chưa có illustration SVG riêng, + tiêu đề + mô tả.
class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.icon, required this.title, this.message});

  final IconData icon;
  final String title;
  final String? message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 108,
              height: 108,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Container(
                    width: 108,
                    height: 108,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.secondary.withOpacity(0.12),
                    ),
                  ),
                  Container(
                    width: 76,
                    height: 76,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.primary.withOpacity(0.14),
                    ),
                  ),
                  Icon(icon, size: 34, color: AppColors.primary),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(title, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
            if (message != null) ...[
              const SizedBox(height: AppSpacing.xs),
              Text(
                message!,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: context.colors.textSecondary),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
