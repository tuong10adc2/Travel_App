import 'package:flutter/material.dart';

import '../models/place.dart';

/// Placeholder ảnh khi địa điểm chưa có `coverImage` thật — gradient theo
/// theme app + icon theo tag đầu tiên, để không bị 1 màu xám nhàn nhạt lặp
/// lại cho cả 8 địa điểm. Bỏ đi ngay khi `coverImage` có URL thật.
class PlaceImagePlaceholder extends StatelessWidget {
  const PlaceImagePlaceholder({super.key, required this.place});

  final Place place;

  static const _gradients = [
    [Color(0xFF0E7C66), Color(0xFF16A085)],
    [Color(0xFF0A5C4A), Color(0xFF0E7C66)],
    [Color(0xFFF2A93B), Color(0xFFE08B1E)],
    [Color(0xFF2C7A7B), Color(0xFF0E7C66)],
    [Color(0xFF1A6B5C), Color(0xFF3EAE8C)],
  ];

  static const _tagIcons = {
    'Lịch sử': Icons.account_balance,
    'Thiên nhiên': Icons.landscape,
    'Ẩm thực': Icons.restaurant,
    'Văn hoá': Icons.theater_comedy,
  };

  @override
  Widget build(BuildContext context) {
    final index = place.name.hashCode.abs() % _gradients.length;
    final colors = _gradients[index];
    final icon = _tagIcons[place.tags.isNotEmpty ? place.tags.first : ''] ?? Icons.image_outlined;

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: colors),
      ),
      child: Center(child: Icon(icon, size: 40, color: Colors.white.withOpacity(0.85))),
    );
  }
}
