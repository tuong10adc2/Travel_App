import 'package:flutter/material.dart';

/// Fade + trượt nhẹ lên khi 1 item trong list/grid xuất hiện lần đầu — thay
/// cho việc cả list "bụp" ra cùng lúc khi data load xong. Tự chạy 1 lần khi
/// widget được tạo (không lặp lại khi rebuild vì `State` được giữ nguyên).
class FadeSlideIn extends StatefulWidget {
  const FadeSlideIn(
      {super.key, required this.child, this.delay = Duration.zero});

  final Widget child;
  final Duration delay;

  /// Tính delay theo vị trí trong list, giới hạn ở 8 bậc đầu để các item xa
  /// phía dưới không phải chờ animation quá lâu mới hiện ra.
  factory FadeSlideIn.staggered({
    Key? key,
    required int index,
    required Widget child,
    Duration step = const Duration(milliseconds: 40),
  }) {
    final cappedIndex = index > 8 ? 8 : index;
    return FadeSlideIn(key: key, delay: step * cappedIndex, child: child);
  }

  @override
  State<FadeSlideIn> createState() => _FadeSlideInState();
}

class _FadeSlideInState extends State<FadeSlideIn>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fade;
  late final Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 320));
    final curved = CurvedAnimation(parent: _controller, curve: Curves.easeOut);
    _fade = curved;
    _slide =
        Tween(begin: const Offset(0, 0.06), end: Offset.zero).animate(curved);
    Future.delayed(widget.delay, () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fade,
      child: SlideTransition(position: _slide, child: widget.child),
    );
  }
}
