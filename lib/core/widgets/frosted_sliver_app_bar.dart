import 'dart:ui';

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// `SliverAppBar` cho trang chi tiết có ảnh cover lớn — dải kính mờ (frosted)
/// phía sau icon back/action tăng dần độ mờ theo tiến độ cuộn thay vì hiện
/// nguyên 1 màu đặc ngay khi vừa mở màn. Sigma blur = 0 lúc mở rộng hoàn toàn
/// (không chạm vào ảnh cover) nên ảnh vẫn nét, chỉ mờ dần khi cuộn lên.
class FrostedSliverAppBar extends StatefulWidget {
  const FrostedSliverAppBar({
    super.key,
    required this.controller,
    required this.expandedHeight,
    required this.background,
    this.actions,
  });

  final ScrollController controller;
  final double expandedHeight;
  final Widget background;
  final List<Widget>? actions;

  @override
  State<FrostedSliverAppBar> createState() => _FrostedSliverAppBarState();
}

class _FrostedSliverAppBarState extends State<FrostedSliverAppBar> {
  double _progress = 0;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onScroll);
  }

  void _onScroll() {
    final collapseRange = widget.expandedHeight - kToolbarHeight;
    final next = collapseRange <= 0
        ? 1.0
        : (widget.controller.offset / collapseRange).clamp(0.0, 1.0);
    if ((next - _progress).abs() > 0.01) setState(() => _progress = next);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onScroll);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final topInset = MediaQuery.of(context).padding.top;

    return SliverAppBar(
      pinned: true,
      expandedHeight: widget.expandedHeight,
      backgroundColor: colors.surface,
      elevation: 0,
      actions: widget.actions,
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            widget.background,
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              height: kToolbarHeight + topInset,
              child: ClipRect(
                child: BackdropFilter(
                  filter: ImageFilter.blur(
                      sigmaX: 16 * _progress, sigmaY: 16 * _progress),
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                        color: colors.surface.withOpacity(0.65 * _progress)),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
