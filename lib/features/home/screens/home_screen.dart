import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/services/push_notification_service.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/places_providers.dart';
import '../widgets/place_card.dart';

const _tags = ['Lịch sử', 'Ẩm thực', 'Thiên nhiên', 'Văn hoá'];

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  int _navIndex = 0;

  @override
  void initState() {
    super.initState();
    // Home là màn đầu tiên sau khi đăng nhập (app_router redirect) — điểm hợp lý nhất để
    // đăng ký nhận push notification 1 lần cho cả phiên.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(pushNotificationServiceProvider).init();
    });
  }

  void _onNavTap(int index) {
    if (index == _navIndex) return;
    switch (index) {
      case 1:
        context.push('/tours');
        return;
      case 2:
        context.push('/itineraries');
        return;
      case 3:
        context.push('/chat');
        return;
      case 4:
        context.push('/saved');
        return;
      case 5:
        context.push('/profile');
        return;
    }
    if (index != 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Chức năng đang phát triển, sẽ có ở giai đoạn sau.')),
      );
      return;
    }
    setState(() => _navIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final placesAsync = ref.watch(filteredPlacesProvider);
    final selectedTag = ref.watch(selectedTagProvider);

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, AppSpacing.lg, 0),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _Header(onProfileTap: () => context.push('/profile')),
                    const SizedBox(height: AppSpacing.lg),
                    _SearchField(
                      onChanged: (value) => ref.read(placeSearchQueryProvider.notifier).state = value,
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    const _PromoBanner(),
                    const SizedBox(height: AppSpacing.lg),
                    _TagFilterRow(
                      selectedTag: selectedTag,
                      onSelect: (tag) => ref.read(selectedTagProvider.notifier).state = tag,
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    const Text(
                      'Đề xuất cho bạn',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                  ],
                ),
              ),
            ),
            placesAsync.when(
              loading: () => const SliverFillRemaining(
                hasScrollBody: false,
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (error, _) => SliverFillRemaining(
                hasScrollBody: false,
                child: Center(child: Text('Lỗi tải địa điểm: $error')),
              ),
              data: (places) {
                if (places.isEmpty) {
                  return const SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(child: Text('Không tìm thấy địa điểm phù hợp')),
                  );
                }
                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.lg),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: AppSpacing.sm,
                      crossAxisSpacing: AppSpacing.sm,
                      childAspectRatio: 0.72,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => PlaceCard(place: places[index]),
                      childCount: places.length,
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _navIndex,
        onDestinationSelected: _onNavTap,
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

class _Header extends StatelessWidget {
  const _Header({required this.onProfileTap});

  final VoidCallback onProfileTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const ClipOval(
          child: Image(
            image: AssetImage('assets/images/logo.png'),
            width: 40,
            height: 40,
            fit: BoxFit.cover,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        const Expanded(
          child: Text('TngGuide', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        ),
        IconButton(
          onPressed: onProfileTap,
          icon: const Icon(Icons.person_outline),
          tooltip: 'Hồ sơ cá nhân',
        ),
      ],
    );
  }
}

class _SearchField extends StatelessWidget {
  const _SearchField({required this.onChanged});

  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return TextField(
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: 'Tìm địa điểm...',
        prefixIcon: const Icon(Icons.search),
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.lg), borderSide: BorderSide.none),
        contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: AppSpacing.md),
      ),
    );
  }
}

class _PromoBanner extends StatelessWidget {
  const _PromoBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.primary, Color(0xFF0A5C4A)],
        ),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Khám phá hành trình mới',
            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700),
          ),
          SizedBox(height: AppSpacing.xs),
          Text(
            'Những địa điểm được gợi ý riêng cho chuyến đi của bạn',
            style: TextStyle(color: Colors.white70, fontSize: 13),
          ),
        ],
      ),
    );
  }
}

class _TagFilterRow extends StatelessWidget {
  const _TagFilterRow({required this.selectedTag, required this.onSelect});

  final String? selectedTag;
  final ValueChanged<String?> onSelect;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _TagChip(label: 'Tất cả', selected: selectedTag == null, onTap: () => onSelect(null)),
          for (final tag in _tags)
            Padding(
              padding: const EdgeInsets.only(left: AppSpacing.sm),
              child: _TagChip(label: tag, selected: selectedTag == tag, onTap: () => onSelect(tag)),
            ),
        ],
      ),
    );
  }
}

class _TagChip extends StatelessWidget {
  const _TagChip({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      selectedColor: AppColors.primary,
      backgroundColor: AppColors.surface,
      labelStyle: TextStyle(color: selected ? Colors.white : AppColors.textPrimary, fontWeight: FontWeight.w600),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg), side: BorderSide.none),
      showCheckmark: false,
    );
  }
}
