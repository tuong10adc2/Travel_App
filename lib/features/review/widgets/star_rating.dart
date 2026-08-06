import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

/// Hiển thị sao đánh giá; truyền [onChanged] để biến thành input chọn sao.
class StarRating extends StatelessWidget {
  const StarRating({
    super.key,
    required this.rating,
    this.size = 18,
    this.onChanged,
  });

  final double rating;
  final double size;
  final ValueChanged<int>? onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        final filled = index < rating.round();
        final icon = Icon(
          filled ? Icons.star : Icons.star_border,
          size: size,
          color: AppColors.secondary,
        );
        if (onChanged == null) return icon;
        return InkWell(
          onTap: () => onChanged!(index + 1),
          child: Padding(padding: const EdgeInsets.symmetric(horizontal: 2), child: icon),
        );
      }),
    );
  }
}
