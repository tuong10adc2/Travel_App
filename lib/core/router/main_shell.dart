import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Khung Scaffold + `NavigationBar` dùng chung cho 6 tab chính (Khám phá,
/// Tours, Lịch trình, Trợ lý, Đã lưu, Hồ sơ). Trước đây mỗi tab là 1
/// `context.push()` riêng lẻ nên chỉ màn Home có thanh điều hướng, các màn
/// còn lại mất hẳn thanh khi mở. `StatefulShellRoute.indexedStack` giữ mỗi
/// tab 1 Navigator/stack riêng (IndexedStack) và dùng chung 1 `MainShell` nên
/// thanh điều hướng luôn hiển thị khi chuyển qua lại giữa các tab.
class MainShell extends StatelessWidget {
  const MainShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  void _onDestinationSelected(int index) {
    // Bấm lại đúng tab đang đứng thì quay về màn gốc của tab đó (reset
    // stack), giống hành vi bottom nav tiêu chuẩn.
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: _onDestinationSelected,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.explore_outlined), selectedIcon: Icon(Icons.explore), label: 'Khám phá'),
          NavigationDestination(icon: Icon(Icons.map_outlined), selectedIcon: Icon(Icons.map), label: 'Tours'),
          NavigationDestination(icon: Icon(Icons.calendar_month_outlined), selectedIcon: Icon(Icons.calendar_month), label: 'Lịch trình'),
          NavigationDestination(icon: Icon(Icons.smart_toy_outlined), selectedIcon: Icon(Icons.smart_toy), label: 'Trợ lý'),
          NavigationDestination(icon: Icon(Icons.bookmark_border), selectedIcon: Icon(Icons.bookmark), label: 'Đã lưu'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Hồ sơ'),
        ],
      ),
    );
  }
}
