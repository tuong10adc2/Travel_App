import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/date_format.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/frosted_sliver_app_bar.dart';
import '../../../core/widgets/skeleton_loaders.dart';
import '../../../l10n/app_localizations.dart';
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
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      body: tourAsync.when(
        loading: () => const SkeletonDetailPage(),
        error: (error, _) => Center(child: Text(l10n.toursLoadError(error))),
        data: (tour) {
          if (tour == null) {
            return Center(child: Text(l10n.tourNotFound));
          }
          return _TourDetailContent(tour: tour);
        },
      ),
    );
  }
}

class _TourDetailContent extends ConsumerStatefulWidget {
  const _TourDetailContent({required this.tour});

  final Tour tour;

  @override
  ConsumerState<_TourDetailContent> createState() => _TourDetailContentState();
}

class _TourDetailContentState extends ConsumerState<_TourDetailContent> {
  final _scrollController = ScrollController();

  String _priceLabel(AppLocalizations l10n) {
    final tour = widget.tour;
    if (tour.price <= 0) return l10n.contactForPrice;
    final s = tour.price
        .toString()
        .replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => '.');
    return '${s}đ'; // ignore: unnecessary_brace_in_string_interps -- tránh nhập nhằng với ký tự "đ" liền sau
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tour = widget.tour;
    final target = (targetType: 'tour', targetId: tour.id);
    final reviewsAsync = ref.watch(reviewsForTargetProvider(target));
    final myReview = ref.watch(myReviewForTargetProvider(target));
    final placesById = ref.watch(placesByIdProvider);
    final places =
        tour.placeIds.map((id) => placesById[id]).whereType<Place>().toList();
    final l10n = AppLocalizations.of(context)!;

    return CustomScrollView(
      controller: _scrollController,
      slivers: [
        FrostedSliverAppBar(
          controller: _scrollController,
          expandedHeight: 220,
          background: Hero(
            tag: 'tour-image-${tour.id}',
            child: tour.coverImage.isEmpty
                ? Container(
                    color: AppColors.primary,
                    child: const Center(
                        child: Icon(Icons.card_travel,
                            size: 56, color: Colors.white70)))
                : AppNetworkImage(url: tour.coverImage),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tour.name,
                    style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: AppSpacing.xs),
                Row(
                  children: [
                    StarRating(
                        rating: (reviewsAsync.valueOrNull?.isEmpty ?? true)
                            ? 0.0
                            : _avgRating(reviewsAsync.valueOrNull!)),
                    const SizedBox(width: AppSpacing.xs),
                    Text(l10n.reviewCountPlain(
                        reviewsAsync.valueOrNull?.where((r) => r.status == 'approved').length ?? 0)),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    Icon(Icons.calendar_month_outlined,
                        size: 18, color: context.colors.textSecondary),
                    const SizedBox(width: AppSpacing.sm),
                    Text(l10n.dayCount(tour.durationDays)),
                    const SizedBox(width: AppSpacing.lg),
                    Icon(Icons.place_outlined,
                        size: 18, color: context.colors.textSecondary),
                    const SizedBox(width: AppSpacing.sm),
                    Text(l10n.placeCountLabel(tour.placeIds.length)),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(_priceLabel(l10n),
                    style: Theme.of(context)
                        .textTheme
                        .titleLarge
                        ?.copyWith(color: AppColors.primary)),
                const SizedBox(height: AppSpacing.lg),
                Text(l10n.introductionHeading,
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: AppSpacing.xs),
                Text(tour.description),
                const SizedBox(height: AppSpacing.lg),
                Text(l10n.placesInTourHeading,
                    style: Theme.of(context).textTheme.titleMedium),
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
                      subtitle: Text(place.address,
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                      onTap: () => context.push('/place/${place.id}'),
                    ),
                  ),
                const SizedBox(height: AppSpacing.md),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () =>
                        _showAddToItineraryDialog(context, ref, tour),
                    icon: const Icon(Icons.playlist_add),
                    label: Text(l10n.addToMyItinerary),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                const Divider(),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  l10n.reviewsHeading(reviewsAsync.valueOrNull?.where((r) => r.status == 'approved').length ?? 0),
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: AppSpacing.md),
                ReviewForm(
                    targetType: 'tour',
                    targetId: tour.id,
                    existingReview: myReview),
                const SizedBox(height: AppSpacing.md),
                reviewsAsync.when(
                  loading: () => const SkeletonList(itemCount: 3),
                  error: (error, _) => Text(l10n.reviewsLoadError(error)),
                  data: (reviews) {
                    if (reviews.isEmpty) {
                      return Text(
                        l10n.noReviewsForTour,
                        style: Theme.of(context)
                            .textTheme
                            .bodyMedium
                            ?.copyWith(color: context.colors.textSecondary),
                      );
                    }
                    return Column(
                      children: [
                        for (final review in reviews)
                          ReviewListItem(
                              review: review,
                              isMine: review.userId == myReview?.userId),
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

  Future<void> _showAddToItineraryDialog(
      BuildContext context, WidgetRef ref, Tour tour) async {
    final l10n = AppLocalizations.of(context)!;
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
                final itineraryId = await ref
                    .read(itineraryRepositoryProvider)
                    .createItineraryFromTour(
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
                    SnackBar(
                        content: Text(l10n.createItineraryError(e)),
                        backgroundColor: AppColors.error),
                  );
                }
              } finally {
                setState(() => isSubmitting = false);
              }
            }

            return AlertDialog(
              title: Text(l10n.addToMyItinerary),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(
                    controller: nameController,
                    decoration:
                        InputDecoration(labelText: l10n.itineraryNameLabel),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: dialogContext,
                        initialDate: startDate,
                        firstDate:
                            DateTime.now().subtract(const Duration(days: 1)),
                        lastDate:
                            DateTime.now().add(const Duration(days: 365 * 2)),
                      );
                      if (picked != null) setState(() => startDate = picked);
                    },
                    child: InputDecorator(
                      decoration:
                          InputDecoration(labelText: l10n.startDateLabel),
                      child: Row(
                        children: [
                          Icon(Icons.calendar_today_outlined,
                              size: 18,
                              color: dialogContext.colors.textSecondary),
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
                  onPressed: isSubmitting
                      ? null
                      : () => Navigator.of(dialogContext).pop(),
                  child: Text(l10n.cancel),
                ),
                ElevatedButton(
                  onPressed: isSubmitting ? null : submit,
                  child: isSubmitting
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : Text(l10n.createItineraryButton),
                ),
              ],
            );
          },
        );
      },
    );
  }
}
