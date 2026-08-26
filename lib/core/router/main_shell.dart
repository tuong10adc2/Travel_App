import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/app_theme.dart';
import '../widgets/pressable_scale.dart';

/// Khung Scaffold + thanh điều hướng nổi dùng chung cho 6 tab chính. Cả 6 ô
/// đều là icon tròn ngang hàng nhau trong 1 pill bo tròn nổi cách đáy màn
/// hình — ô đang chọn mới "nổi" lên (dịch lên nhẹ + đổi màu đặc), không có
/// tab nào mặc định nổi cao như bản trước. `StatefulShellRoute.indexedStack`
/// vẫn giữ mỗi tab 1 Navigator/stack riêng nên thanh không biến mất khi
/// chuyển tab hay khi back trong từng tab.
class MainShell extends StatelessWidget {
  const MainShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  void _select(int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: _FloatingNavBar(
        currentIndex: navigationShell.currentIndex,
        onSelect: _select,
      ),
    );
  }
}

// Chỉ số khớp thứ tự StatefulShellBranch khai báo ở app_router.dart.
const _kHome = 0;
const _kTours = 1;
const _kItineraries = 2;
const _kChat = 3;
const _kSaved = 4;
const _kProfile = 5;

class _NavItemData {
  const _NavItemData({
    required this.index,
    required this.icon,
    required this.selectedIcon,
    required this.label,
  });

  final int index;
  final IconData icon;
  final IconData selectedIcon;
  final String label;
}

const _items = [
  _NavItemData(
      index: _kHome,
      icon: Icons.explore_outlined,
      selectedIcon: Icons.explore,
      label: 'Khám phá'),
  _NavItemData(
      index: _kTours,
      icon: Icons.map_outlined,
      selectedIcon: Icons.map,
      label: 'Tours'),
  _NavItemData(
    index: _kItineraries,
    icon: Icons.calendar_month_outlined,
    selectedIcon: Icons.calendar_month,
    label: 'Lịch trình',
  ),
  _NavItemData(
      index: _kChat,
      icon: Icons.smart_toy_outlined,
      selectedIcon: Icons.smart_toy,
      label: 'Trợ lý'),
  _NavItemData(
      index: _kSaved,
      icon: Icons.bookmark_border,
      selectedIcon: Icons.bookmark,
      label: 'Đã lưu'),
  _NavItemData(
      index: _kProfile,
      icon: Icons.person_outline,
      selectedIcon: Icons.person,
      label: 'Hồ sơ'),
];

class _FloatingNavBar extends StatelessWidget {
  const _FloatingNavBar({required this.currentIndex, required this.onSelect});

  final int currentIndex;
  final ValueChanged<int> onSelect;

  static const _barHeight = 64.0;
  static const _circleSize = 44.0;
  static const _totalHeight = 84.0;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return SafeArea(
      top: false,
      child: SizedBox(
        height: _totalHeight,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Positioned(
              left: 12,
              right: 12,
              bottom: 8,
              child: Container(
                height: _barHeight,
                decoration: BoxDecoration(
                  color: colors.surface,
                  borderRadius: BorderRadius.circular(_barHeight / 2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.10),
                      blurRadius: 18,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
              ),
            ),
            Positioned(
              left: 12,
              right: 12,
              bottom: 8,
              height: _barHeight,
              child: Row(
                children: [
                  for (final item in _items)
                    Expanded(
                      child: Center(
                        child: _NavCircle(
                          item: item,
                          selected: currentIndex == item.index,
                          onSelect: onSelect,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NavCircle extends StatelessWidget {
  const _NavCircle(
      {required this.item, required this.selected, required this.onSelect});

  final _NavItemData item;
  final bool selected;
  final ValueChanged<int> onSelect;

  static const _size = _FloatingNavBar._circleSize;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: item.label,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => onSelect(item.index),
        child: PressableScale(
          child: AnimatedSlide(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOut,
            // Chỉ ô đang chọn mới nhích lên (~12px) — không cao như bản
            // trước, các ô còn lại nằm ngang hàng trong pill.
            offset: selected ? const Offset(0, -0.28) : Offset.zero,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOut,
              width: _size,
              height: _size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: selected ? AppColors.primary : Colors.transparent,
                boxShadow: selected
                    ? [
                        BoxShadow(
                            color: AppColors.primary.withOpacity(0.35),
                            blurRadius: 12,
                            offset: const Offset(0, 4))
                      ]
                    : null,
              ),
              child: Icon(
                selected ? item.selectedIcon : item.icon,
                size: 22,
                color: selected ? Colors.white : context.colors.textSecondary,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
