import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../theme/app_theme.dart';

/// Trạng thái rỗng dùng chung — illustration SVG (hoặc icon Material nếu
/// chưa có SVG riêng) đặt trên 2 lớp vòng tròn màu thương hiệu mờ dần, + tiêu
/// đề + mô tả.
class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.message,
    this.illustrationAsset,
  });

  final IconData icon;
  final String title;
  final String? message;

  /// Đường dẫn asset SVG (vd `assets/illustrations/empty_saved.svg`) — khi có
  /// thì thay cho [icon] trong vòng tròn halo. Để trống nếu chưa có SVG riêng
  /// cho trạng thái này, [icon] sẽ được dùng làm phương án dự phòng.
  final String? illustrationAsset;

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
                  illustrationAsset != null
                      ? SvgPicture.asset(illustrationAsset!, width: 56, height: 56)
                      : Icon(icon, size: 34, color: AppColors.primary),
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
