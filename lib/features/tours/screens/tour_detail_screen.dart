import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/date_format.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/skeleton_loaders.dart';
import '../../home/models/place.dart';
import '../../home/widgets/place_image_placeholder.dart';
import '../../itinerary/data/itinerary_repository.dart';
import '../../itinerary/providers/itinerary_providers.dart';
import '../../review/models/review.dart';
import '../../review/providers/review_providers.dart';
import '../../review/widgets/review_form.dart';
import '../../review/widgets/review_list_item.dart';
import '../../review/widgets/star_rating.dart';
import '../models/tour.dart';
import '../providers/tour_providers.dart';

class TourDetailScreen extends ConsumerWidget {
  const TourDetailScreen({super.key, required this.tourId});

  final String tourId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tourAsync = ref.watch(tourProvider(tourId));

    return Scaffold(
      body: tourAsync.when(
        loading: () => const SkeletonDetailPage(),
        error: (error, _) => Center(child: Text('Lỗi tải tour: $error')),
        data: (tour) {
          if (tour == null) {
            return const Center(child: Text('Không tìm thấy tour.'));
          }
          return _TourDetailContent(tour: tour);
        },
      ),
    );
  }
}

class _TourDetailContent extends ConsumerWidget {
  const _TourDetailContent({required this.tour});

  final Tour tour;

  String get _priceLabel {
    if (tour.price <= 0) return 'Liên hệ';
    final s = tour.price.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => '.');
    return '${s}đ'; // ignore: unnecessary_brace_in_string_interps -- tránh nhập nhằng với ký tự "đ" liền sau
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final target = (targetType: 'tour', targetId: tour.id);
    final reviewsAsync = ref.watch(reviewsForTargetProvider(target));
    final myReview = ref.watch(myReviewForTargetProvider(target));
    final placesById = ref.watch(placesByIdProvider);
    final places = tour.placeIds.map((id) => placesById[id]).whereType<Place>().toList();

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          expandedHeight: 220,
          backgroundColor: AppColors.primary,
          flexibleSpace: FlexibleSpaceBar(
            background: tour.coverImage.isEmpty
                ? Container(color: AppColors.primary, child: const Center(child: Icon(Icons.card_travel, size: 56, color: Colors.white70)))
                : AppNetworkImage(url: tour.coverImage),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tour.name, style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: AppSpacing.xs),
                Row(
                  children: [
                    StarRating(rating: (reviewsAsync.valueOrNull?.isEmpty ?? true) ? 0.0 : _avgRating(reviewsAsync.valueOrNull!)),
                    const SizedBox(width: AppSpacing.xs),
                    Text('${reviewsAsync.valueOrNull?.where((r) => r.status == 'approved').length ?? 0} đánh giá'),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    const Icon(Icons.calendar_month_outlined, size: 18, color: AppColors.textSecondary),
                    const SizedBox(width: AppSpacing.sm),
                    Text('${tour.durationDays} ngày'),
                    const SizedBox(width: AppSpacing.lg),
                    const Icon(Icons.place_outlined, size: 18, color: AppColors.textSecondary),
                    const SizedBox(width: AppSpacing.sm),
                    Text('${tour.placeIds.length} địa điểm'),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(_priceLabel, style: Theme.of(context).textTheme.titleLarge?.copyWith(color: AppColors.primary)),
                const SizedBox(height: AppSpacing.lg),
                Text('Giới thiệu', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: AppSpacing.xs),
                Text(tour.description),
                const SizedBox(height: AppSpacing.lg),
                Text('Địa điểm trong tour', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: AppSpacing.sm),
                for (final place in places)
                  Card(
                    margin: const EdgeInsets.only(bottom: AppSpacing.sm),
                    clipBehavior: Clip.antiAlias,
                    child: ListTile(
                      leading: SizedBox(
                        width: 48,
                        height: 48,
                        child: place.coverImage.isEmpty
                            ? PlaceImagePlaceholder(place: place)
                            : AppNetworkImage(url: place.coverImage),
                      ),
                      title: Text(place.name),
                      subtitle: Text(place.address, maxLines: 1, overflow: TextOverflow.ellipsis),
                      onTap: () => context.push('/place/${place.id}'),
                    ),
                  ),
                const SizedBox(height: AppSpacing.md),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => _showAddToItineraryDialog(context, ref, tour),
                    icon: const Icon(Icons.playlist_add),
                    label: const Text('Thêm vào lịch trình của tôi'),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                const Divider(),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Đánh giá (${reviewsAsync.valueOrNull?.where((r) => r.status == 'approved').length ?? 0})',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: AppSpacing.md),
                ReviewForm(targetType: 'tour', targetId: tour.id, existingReview: myReview),
                const SizedBox(height: AppSpacing.md),
                reviewsAsync.when(
                  loading: () => const SkeletonList(itemCount: 3),
                  error: (error, _) => Text('Lỗi tải đánh giá: $error'),
                  data: (reviews) {
                    if (reviews.isEmpty) {
                      return Text(
                        'Chưa có đánh giá nào cho tour này.',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
                      );
                    }
                    return Column(
                      children: [
                        for (final review in reviews)
                          ReviewListItem(review: review, isMine: review.userId == myReview?.userId),
                      ],
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  double _avgRating(List<Review> reviews) {
    final approved = reviews.where((r) => r.status == 'approved').toList();
    if (approved.isEmpty) return 0;
    final sum = approved.fold<int>(0, (total, r) => total + r.rating);
    return sum / approved.length;
  }

  Future<void> _showAddToItineraryDialog(BuildContext context, WidgetRef ref, Tour tour) async {
    final nameController = TextEditingController(text: tour.name);
    var startDate = DateTime.now();
    bool isSubmitting = false;

    await showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (dialogContext, setState) {
            Future<void> submit() async {
              if (nameController.text.trim().isEmpty) return;
              setState(() => isSubmitting = true);
              try {
                final itineraryId = await ref.read(itineraryRepositoryProvider).createItineraryFromTour(
                      name: nameController.text.trim(),
                      startDate: startDate,
                      placeIds: tour.placeIds,
                      durationDays: tour.durationDays,
                    );
                if (dialogContext.mounted) Navigator.of(dialogContext).pop();
                if (context.mounted) context.push('/itineraries/$itineraryId');
              } catch (e) {
                if (dialogContext.mounted) {
                  ScaffoldMessenger.of(dialogContext).showSnackBar(
                    SnackBar(content: Text('Không tạo được lịch trình: $e'), backgroundColor: AppColors.error),
                  );
                }
              } finally {
                setState(() => isSubmitting = false);
              }
            }

            return AlertDialog(
              title: const Text('Thêm vào lịch trình của tôi'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(
                    controller: nameController,
                    decoration: const InputDecoration(labelText: 'Tên lịch trình'),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: dialogContext,
                        initialDate: startDate,
                        firstDate: DateTime.now().subtract(const Duration(days: 1)),
                        lastDate: DateTime.now().add(const Duration(days: 365 * 2)),
                      );
                      if (picked != null) setState(() => startDate = picked);
                    },
                    child: InputDecorator(
                      decoration: const InputDecoration(labelText: 'Ngày bắt đầu'),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_today_outlined, size: 18, color: AppColors.textSecondary),
                          const SizedBox(width: AppSpacing.sm),
                          Text(formatDateVi(startDate)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: isSubmitting ? null : () => Navigator.of(dialogContext).pop(),
                  child: const Text('Huỷ'),
                ),
                ElevatedButton(
                  onPressed: isSubmitting ? null : submit,
                  child: isSubmitting
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Tạo lịch trình'),
                ),
              ],
            );
          },
        );
      },
    );
  }
}
