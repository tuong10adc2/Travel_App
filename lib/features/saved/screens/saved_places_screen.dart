import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/fade_slide_in.dart';
import '../../../core/widgets/skeleton_loaders.dart';
import '../../home/widgets/place_card.dart';
import '../providers/saved_providers.dart';

class SavedPlacesScreen extends ConsumerWidget {
  const SavedPlacesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final savedAsync = ref.watch(savedPlacesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Đã lưu')),
      body: savedAsync.when(
        loading: () => const SkeletonCardGrid(),
        error: (error, _) => Center(child: Text('Lỗi tải danh sách đã lưu: $error')),
        data: (places) {
          if (places.isEmpty) {
            return const EmptyState(
              icon: Icons.bookmark_border,
              illustrationAsset: 'assets/illustrations/empty_saved.svg',
              title: 'Chưa lưu địa điểm nào',
              message: 'Bấm biểu tượng trái tim ở màn Chi tiết địa điểm để lưu vào đây.',
            );
          }
          return GridView.builder(
            padding: const EdgeInsets.all(AppSpacing.md),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: AppSpacing.sm,
              crossAxisSpacing: AppSpacing.sm,
              childAspectRatio: 0.72,
            ),
            itemCount: places.length,
            itemBuilder: (context, index) =>
                FadeSlideIn.staggered(index: index, child: PlaceCard(place: places[index])),
          );
        },
      ),
    );
  }
}
