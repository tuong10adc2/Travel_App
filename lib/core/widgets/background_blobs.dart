import 'dart:ui';

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Bọc [child] với 1-2 khối màu mờ, blur nặng ("blob") đặt phía sau — cùng kỹ
/// thuật `bg-white/10 blur-3xl` đang dùng ở webapp — để nền không còn phẳng 1
/// màu trơn. Blob chỉ vẽ 1 lần (tĩnh), bọc `RepaintBoundary` để không kéo
/// theo repaint của nội dung phía trên.
class DecorativeBackground extends StatelessWidget {
  const DecorativeBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        const Positioned(
            top: -60,
            right: -70,
            child: _Blob(color: AppColors.secondary, size: 240)),
        const Positioned(
            bottom: 40,
            left: -90,
            child: _Blob(color: AppColors.primary, size: 280)),
        child,
      ],
    );
  }
}

class _Blob extends StatelessWidget {
  const _Blob({required this.color, required this.size});

  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: RepaintBoundary(
        child: ImageFiltered(
          imageFilter: ImageFilter.blur(sigmaX: 55, sigmaY: 55),
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
                shape: BoxShape.circle, color: color.withOpacity(0.16)),
          ),
        ),
      ),
    );
  }
}
