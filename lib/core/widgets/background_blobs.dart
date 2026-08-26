import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Bọc [child] với 1 lớp họa tiết nền — đường cong mềm + chấm nhỏ rải rác —
/// thay cho nền phẳng 1 màu trơn. Vẽ tĩnh bằng `CustomPainter` (rẻ, không
/// cần blur runtime) nên không ảnh hưởng hiệu năng cuộn trang.
class DecorativeBackground extends StatelessWidget {
  const DecorativeBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        const Positioned.fill(
          child: RepaintBoundary(child: PatternOverlay()),
        ),
        child,
      ],
    );
  }
}

/// Cùng họa tiết như [DecorativeBackground] nhưng dùng để đặt BÊN TRONG 1
/// card/khung nhỏ (promo banner, stat card...) — cùng 1 painter nên tỉ lệ
/// đường cong/chấm tự co theo kích thước khung, giữ chung 1 "họ" hoạ tiết
/// xuyên suốt app thay vì mỗi nơi 1 kiểu. `opacity` để giảm độ đậm khi nền
/// khung đã có màu (vd promo banner nền primary đậm, chấm trắng cần nhạt
/// hơn nền trang).
class PatternOverlay extends StatelessWidget {
  const PatternOverlay(
      {super.key, this.color = AppColors.primary, this.opacity = 1.0});

  final Color color;
  final double opacity;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: CustomPaint(
          painter: _PatternPainter(color: color, opacityScale: opacity)),
    );
  }
}

class _PatternPainter extends CustomPainter {
  const _PatternPainter({required this.color, this.opacityScale = 1.0});

  final Color color;
  final double opacityScale;

  @override
  void paint(Canvas canvas, Size size) {
    final linePaint = Paint()
      ..color = color.withOpacity(0.16 * opacityScale)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.8
      ..strokeCap = StrokeCap.round;

    final path1 = Path()
      ..moveTo(-20, size.height * 0.08)
      ..quadraticBezierTo(size.width * 0.35, size.height * 0.00,
          size.width * 0.62, size.height * 0.20)
      ..quadraticBezierTo(size.width * 0.86, size.height * 0.38,
          size.width + 20, size.height * 0.28);
    canvas.drawPath(path1, linePaint);

    final path2 = Path()
      ..moveTo(-20, size.height * 0.42)
      ..quadraticBezierTo(size.width * 0.28, size.height * 0.55,
          size.width * 0.55, size.height * 0.38)
      ..quadraticBezierTo(size.width * 0.80, size.height * 0.23,
          size.width + 20, size.height * 0.46);
    canvas.drawPath(path2, linePaint);

    final path3 = Path()
      ..moveTo(-20, size.height * 0.78)
      ..quadraticBezierTo(size.width * 0.30, size.height * 0.92,
          size.width * 0.58, size.height * 0.74)
      ..quadraticBezierTo(size.width * 0.82, size.height * 0.60,
          size.width + 20, size.height * 0.80);
    canvas.drawPath(path3, linePaint);

    final dotPaint = Paint()..color = color.withOpacity(0.22 * opacityScale);
    final random = math.Random(7);
    for (var i = 0; i < 26; i++) {
      final dx = random.nextDouble() * size.width;
      final dy = random.nextDouble() * size.height;
      final r = 1.0 + random.nextDouble() * 2.0;
      canvas.drawCircle(Offset(dx, dy), r, dotPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _PatternPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.opacityScale != opacityScale;
}
