import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/date_format.dart';
import '../models/itinerary.dart';
import '../providers/itinerary_providers.dart';

class ItineraryListScreen extends ConsumerWidget {
  const ItineraryListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final itinerariesAsync = ref.watch(myItinerariesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Lịch trình của tôi')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/itineraries/new'),
        icon: const Icon(Icons.add),
        label: const Text('Tạo lịch trình'),
      ),
      body: itinerariesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Lỗi tải lịch trình: $error')),
        data: (itineraries) {
          if (itineraries.isEmpty) {
            return const _EmptyState();
          }
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.md,
              AppSpacing.md,
              AppSpacing.md,
              AppSpacing.xl * 2,
            ),
            itemCount: itineraries.length,
            separatorBuilder: (context, index) => const SizedBox(height: AppSpacing.sm),
            itemBuilder: (context, index) => _ItineraryTile(itinerary: itineraries[index]),
          );
        },
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.calendar_month_outlined, size: 56, color: AppColors.textSecondary),
            SizedBox(height: AppSpacing.md),
            Text(
              'Chưa có lịch trình nào',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            SizedBox(height: AppSpacing.xs),
            Text(
              'Bấm "Tạo lịch trình" để bắt đầu lên kế hoạch chuyến đi.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}

class _ItineraryTile extends StatelessWidget {
  const _ItineraryTile({required this.itinerary});

  final Itinerary itinerary;

  @override
  Widget build(BuildContext context) {
    final end = itinerary.endDate ?? itinerary.startDate;
    final dayCount = end.difference(itinerary.startDate).inDays + 1;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.xs),
        leading: const CircleAvatar(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          child: Icon(Icons.map_outlined),
        ),
        title: Text(itinerary.name, style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text(
          '${formatDateVi(itinerary.startDate)} · $dayCount ngày',
          style: const TextStyle(color: AppColors.textSecondary),
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => context.push('/itineraries/${itinerary.id}'),
      ),
    );
  }
}
