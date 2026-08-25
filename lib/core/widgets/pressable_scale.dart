import 'package:flutter/material.dart';

/// Bọc quanh 1 nút bấm để co nhẹ (96%) khi nhấn giữ — phản hồi xúc giác rõ
/// hơn ripple mặc định của Material cho các hành động chính (gửi chat, lưu
/// địa điểm, tạo lịch trình...). Dùng `Listener` (chỉ quan sát pointer, không
/// tham gia gesture arena) thay vì `GestureDetector`/`onTap` riêng — nhờ vậy
/// bọc được quanh `IconButton`/`ElevatedButton`/`FloatingActionButton` có
/// sẵn `onPressed` mà không giành mất sự kiện chạm của chúng.
class PressableScale extends StatefulWidget {
  const PressableScale({super.key, required this.child});

  final Widget child;

  @override
  State<PressableScale> createState() => _PressableScaleState();
}

class _PressableScaleState extends State<PressableScale> {
  bool _pressed = false;

  void _setPressed(bool value) {
    if (_pressed == value) return;
    setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: (_) => _setPressed(true),
      onPointerUp: (_) => _setPressed(false),
      onPointerCancel: (_) => _setPressed(false),
      child: AnimatedScale(
        scale: _pressed ? 0.96 : 1.0,
        duration: const Duration(milliseconds: 100),
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}
