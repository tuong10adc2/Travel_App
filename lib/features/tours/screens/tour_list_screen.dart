import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/skeleton_loaders.dart';
import '../providers/tour_providers.dart';
import '../widgets/tour_card.dart';

class TourListScreen extends ConsumerWidget {
  const TourListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final toursAsync = ref.watch(toursProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Tour gợi ý')),
      body: toursAsync.when(
        loading: () => const SkeletonList(),
        error: (error, _) => Center(child: Text('Lỗi tải tour: $error')),
        data: (tours) {
          if (tours.isEmpty) {
            return const EmptyState(
              icon: Icons.card_travel,
              illustrationAsset: 'assets/illustrations/empty_tours.svg',
              title: 'Chưa có tour nào',
              message: 'Tour gợi ý sẽ do quản trị viên thêm.',
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(AppSpacing.md),
            itemCount: tours.length,
            separatorBuilder: (context, index) => const SizedBox(height: AppSpacing.sm),
            itemBuilder: (context, index) => TourCard(tour: tours[index]),
          );
        },
      ),
    );
  }
}
