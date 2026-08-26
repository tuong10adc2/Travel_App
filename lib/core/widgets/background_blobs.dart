import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Bọc [child] với 1 lớp họa tiết nền mỏng — vài đường cong mềm + chấm nhỏ
/// rải rác, màu thương hiệu rất mờ — thay cho nền phẳng 1 màu trơn. Vẽ tĩnh
/// bằng `CustomPainter` (rẻ, không cần blur runtime) nên không ảnh hưởng
/// hiệu năng cuộn trang.
class DecorativeBackground extends StatelessWidget {
  const DecorativeBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
const Positioned.fill(
          child: IgnorePointer(
            child: RepaintBoundary(
              child: CustomPaint(painter: _PatternPainter(color: AppColors.primary)),
            ),
          ),
        ),
        child,
      ],
    );
  }
}

class _PatternPainter extends CustomPainter {
  const _PatternPainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final linePaint = Paint()
      ..color = color.withOpacity(0.07)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4
      ..strokeCap = StrokeCap.round;

    final path1 = Path()
      ..moveTo(-20, size.height * 0.10)
      ..quadraticBezierTo(size.width * 0.35, size.height * 0.02,
          size.width * 0.62, size.height * 0.22)
      ..quadraticBezierTo(size.width * 0.86, size.height * 0.40,
          size.width + 20, size.height * 0.30);
    canvas.drawPath(path1, linePaint);

    final path2 = Path()
      ..moveTo(-20, size.height * 0.46)
      ..quadraticBezierTo(size.width * 0.28, size.height * 0.58,
          size.width * 0.55, size.height * 0.42)
      ..quadraticBezierTo(size.width * 0.80, size.height * 0.27,
          size.width + 20, size.height * 0.50);
    canvas.drawPath(path2, linePaint);

    final dotPaint = Paint()..color = color.withOpacity(0.10);
    final random = math.Random(7);
    for (var i = 0; i < 16; i++) {
      final dx = random.nextDouble() * size.width;
      final dy = random.nextDouble() * size.height * 0.65;
      final r = 1.0 + random.nextDouble() * 1.8;
      canvas.drawCircle(Offset(dx, dy), r, dotPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _PatternPainter oldDelegate) =>
      oldDelegate.color != color;
}
