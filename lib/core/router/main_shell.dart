import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/app_theme.dart';

/// Khung Scaffold + thanh điều hướng nổi dùng chung cho 6 tab chính. Thay
/// `NavigationBar` thẳng hàng mặc định bằng 1 pill bo tròn nổi cách đáy màn
/// hình, với 2 nút tròn "nổi bật" (Khám phá, Trợ lý AI) nhô lên giữa — đối
/// xứng 2-2-2 quanh tâm thay vì lệch về 1 bên. `StatefulShellRoute.
/// indexedStack` vẫn giữ mỗi tab 1 Navigator/stack riêng nên thanh không
/// biến mất khi chuyển tab hay khi back trong từng tab.
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

const _flatLeft = [
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
];
const _flatRight = [
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
const _raised = [
  _NavItemData(
      index: _kHome,
      icon: Icons.explore_outlined,
      selectedIcon: Icons.explore,
      label: 'Khám phá'),
  _NavItemData(
      index: _kChat,
      icon: Icons.smart_toy_outlined,
      selectedIcon: Icons.smart_toy,
      label: 'Trợ lý'),
];

class _FloatingNavBar extends StatelessWidget {
  const _FloatingNavBar({required this.currentIndex, required this.onSelect});

  final int currentIndex;
  final ValueChanged<int> onSelect;

  static const _barHeight = 64.0;
  static const _raisedSize = 52.0;
  static const _totalHeight = 96.0;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return SafeArea(
      top: false,
      child: SizedBox(
        height: _totalHeight,
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.bottomCenter,
          children: [
            Positioned(
              left: 12,
              right: 12,
              bottom: 8,
              child: Container(
                height: _barHeight,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
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
                child: Row(
                  children: [
                    for (final item in _flatLeft)
                      Expanded(
                          child: _FlatTab(
                              item: item,
                              selected: currentIndex == item.index,
                              onSelect: onSelect)),
                    const SizedBox(width: 120),
                    for (final item in _flatRight)
                      Expanded(
                          child: _FlatTab(
                              item: item,
                              selected: currentIndex == item.index,
                              onSelect: onSelect)),
                  ],
                ),
              ),
            ),
            Positioned(
              bottom: 34,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  for (final item in _raised) ...[
                    _RaisedTab(
                        item: item,
                        selected: currentIndex == item.index,
                        onSelect: onSelect),
                    if (item != _raised.last) const SizedBox(width: 14),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FlatTab extends StatelessWidget {
  const _FlatTab(
      {required this.item, required this.selected, required this.onSelect});

  final _NavItemData item;
  final bool selected;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final color = selected ? AppColors.primary : colors.textSecondary;

    return InkWell(
      onTap: () => onSelect(item.index),
      customBorder: const StadiumBorder(),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(selected ? item.selectedIcon : item.icon,
              size: 22, color: color),
          const SizedBox(height: 2),
          Text(
            item.label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context)
                .textTheme
                .labelSmall
                ?.copyWith(fontSize: 10, color: color),
          ),
        ],
      ),
    );
  }
}

class _RaisedTab extends StatelessWidget {
  const _RaisedTab(
      {required this.item, required this.selected, required this.onSelect});

  final _NavItemData item;
  final bool selected;
  final ValueChanged<int> onSelect;

  static const _size = _FloatingNavBar._raisedSize;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onSelect(item.index),
      customBorder: const CircleBorder(),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        width: _size,
        height: _size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: selected
              ? AppColors.primary
              : AppColors.primary.withOpacity(0.12),
          boxShadow: selected
              ? [
                  BoxShadow(
                      color: AppColors.primary.withOpacity(0.35),
                      blurRadius: 14,
                      offset: const Offset(0, 4))
                ]
              : null,
        ),
        child: Icon(
          selected ? item.selectedIcon : item.icon,
          size: 24,
          color: selected ? Colors.white : AppColors.primary,
        ),
      ),
    );
  }
}
