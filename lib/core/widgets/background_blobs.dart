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
/// card/khung nhỏ (promo banner, stat card...) — cùng 1 painter nên giữ
/// chung 1 "họ" hoạ tiết xuyên suốt app thay vì mỗi nơi 1 kiểu. `opacity` để
/// giảm độ đậm khi nền khung đã có màu (vd promo banner nền primary đậm,
/// chấm trắng cần nhạt hơn nền trang).
///
/// Vẽ theo kiểu LẶP LẠI 1 ô kích thước cố định (260x260 logic px, khớp
/// `pattern-overlay.tsx` bên webapp) thay vì co giãn theo % kích thước
/// canvas — cách co giãn theo % khiến chấm/đường bị phóng to thô trên màn
/// hình lớn (tablet, Flutter web cửa sổ rộng) vì cùng 1 hình bị stretch
/// theo tỉ lệ container. Với cách lặp ô cố định, màn rộng chỉ lặp nhiều ô
/// hơn, từng chấm vẫn giữ nguyên kích thước vật lý.
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

const _tileSize = 260.0;

// Chấm rải trong 1 ô lặp (toạ độ cố định trong hệ 260x260) — khớp danh sách
// dùng ở `pattern-overlay.tsx` bên webapp để 2 nền tảng nhất quán.
const _dots = [
  (30.0, 30.0, 2.2),
  (95.0, 55.0, 1.6),
  (150.0, 20.0, 1.9),
  (210.0, 45.0, 1.4),
  (45.0, 130.0, 1.7),
  (120.0, 150.0, 2.0),
  (190.0, 120.0, 1.5),
  (235.0, 160.0, 1.8),
  (20.0, 220.0, 1.6),
  (80.0, 235.0, 1.9),
  (160.0, 215.0, 1.4),
  (230.0, 240.0, 1.7),
];

class _PatternPainter extends CustomPainter {
  const _PatternPainter({required this.color, this.opacityScale = 1.0});

  final Color color;
  final double opacityScale;

  void _paintTile(Canvas canvas) {
    final linePaint = Paint()
      ..color = color.withOpacity(0.16 * opacityScale)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6
      ..strokeCap = StrokeCap.round;

    // M0,80 Q65,50 130,80 T260,80 — "T" phản chiếu điểm điều khiển trước đó
    // quanh điểm hiện tại để đường cong nối mượt, đồng thời khớp y ở x=0 và
    // x=260 nên khi lặp ô ngang nhau sẽ nối liền không bị đứt đoạn.
    final wave1 = Path()
      ..moveTo(0, 80)
      ..quadraticBezierTo(65, 50, 130, 80)
      ..quadraticBezierTo(195, 110, _tileSize, 80);
    canvas.drawPath(wave1, linePaint);

    final wave2 = Path()
      ..moveTo(0, 180)
      ..quadraticBezierTo(65, 205, 130, 175)
      ..quadraticBezierTo(195, 145, _tileSize, 180);
    canvas.drawPath(wave2, linePaint);

    final dotPaint = Paint()..color = color.withOpacity(0.24 * opacityScale);
    for (final (x, y, r) in _dots) {
      canvas.drawCircle(Offset(x, y), r, dotPaint);
    }
  }

  @override
  void paint(Canvas canvas, Size size) {
    for (var y = 0.0; y < size.height; y += _tileSize) {
      for (var x = 0.0; x < size.width; x += _tileSize) {
        canvas.save();
        canvas.translate(x, y);
        _paintTile(canvas);
        canvas.restore();
      }
    }
  }

  @override
  bool shouldRepaint(covariant _PatternPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.opacityScale != opacityScale;
}
