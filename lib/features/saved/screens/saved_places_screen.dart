import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
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
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Lỗi tải danh sách đã lưu: $error')),
        data: (places) {
          if (places.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(AppSpacing.lg),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.bookmark_border, size: 56, color: AppColors.textSecondary),
                    SizedBox(height: AppSpacing.md),
                    Text('Chưa lưu địa điểm nào', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    SizedBox(height: AppSpacing.xs),
                    Text(
                      'Bấm biểu tượng trái tim ở màn Chi tiết địa điểm để lưu vào đây.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
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
            itemBuilder: (context, index) => PlaceCard(place: places[index]),
          );
        },
      ),
    );
  }
}
