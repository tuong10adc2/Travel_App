import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Page transition dùng chung cho toàn app — fade + scale rất nhẹ (0.98 → 1)
/// thay cho slide-từ-phải mặc định của Material, cho cảm giác mượt/nhất quán
/// hơn giữa các route (đồng bộ tinh thần với page-transition đã làm ở
/// webapp). Chỉ áp cho các route thật sự push/pop (auth, chi tiết, tạo mới)
/// — 6 tab chính trong `MainShell` chuyển bằng `IndexedStack` nên không đi
/// qua page transition này.
CustomTransitionPage<T> fadeScalePage<T>({
  required LocalKey key,
  required Widget child,
}) {
  return CustomTransitionPage<T>(
    key: key,
    child: child,
    transitionDuration: const Duration(milliseconds: 220),
    reverseTransitionDuration: const Duration(milliseconds: 180),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final curved = CurvedAnimation(parent: animation, curve: Curves.easeOut);
      return FadeTransition(
        opacity: curved,
        child: ScaleTransition(
          scale: Tween(begin: 0.98, end: 1.0).animate(curved),
          child: child,
        ),
      );
    },
  );
}
