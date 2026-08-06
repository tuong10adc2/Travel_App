import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
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
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Lỗi tải tour: $error')),
        data: (tours) {
          if (tours.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(AppSpacing.lg),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.card_travel, size: 56, color: AppColors.textSecondary),
                    SizedBox(height: AppSpacing.md),
                    Text('Chưa có tour nào', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    SizedBox(height: AppSpacing.xs),
                    Text('Tour gợi ý sẽ do quản trị viên thêm.', style: TextStyle(color: AppColors.textSecondary)),
                  ],
                ),
              ),
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
