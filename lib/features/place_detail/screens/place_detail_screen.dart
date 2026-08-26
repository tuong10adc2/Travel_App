import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/tag_labels.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/frosted_sliver_app_bar.dart';
import '../../../core/widgets/skeleton_loaders.dart';
import '../../../l10n/app_localizations.dart';
import '../../home/models/place.dart';
import '../../home/widgets/place_image_placeholder.dart';
import '../../review/providers/review_providers.dart';
import '../../review/widgets/review_form.dart';
import '../../review/widgets/review_list_item.dart';
import '../../review/widgets/star_rating.dart';
import '../../saved/widgets/save_toggle_button.dart';
import '../providers/place_detail_providers.dart';

const _weekdayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

String _weekdayLabel(AppLocalizations l10n, String key) {
  switch (key) {
    case 'mon':
      return l10n.weekdayMon;
    case 'tue':
      return l10n.weekdayTue;
    case 'wed':
      return l10n.weekdayWed;
    case 'thu':
      return l10n.weekdayThu;
    case 'fri':
      return l10n.weekdayFri;
    case 'sat':
      return l10n.weekdaySat;
    case 'sun':
      return l10n.weekdaySun;
    default:
      return key;
  }
}

class PlaceDetailScreen extends ConsumerWidget {
  const PlaceDetailScreen({super.key, required this.placeId});

  final String placeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final placeAsync = ref.watch(placeDetailProvider(placeId));
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      body: placeAsync.when(
        loading: () => const SkeletonDetailPage(),
        error: (error, _) => Center(child: Text(l10n.placesLoadError(error))),
        data: (place) {
          if (place == null) {
            return Center(child: Text(l10n.placeNotFound));
          }
          return _PlaceDetailContent(place: place);
        },
      ),
    );
  }
}

class _PlaceDetailContent extends ConsumerStatefulWidget {
  const _PlaceDetailContent({required this.place});

  final Place place;

  @override
  ConsumerState<_PlaceDetailContent> createState() =>
      _PlaceDetailContentState();
}

class _PlaceDetailContentState extends ConsumerState<_PlaceDetailContent> {
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final place = widget.place;
    final target = (targetType: 'place', targetId: place.id);
    final reviewsAsync = ref.watch(reviewsForTargetProvider(target));
    final myReview = ref.watch(myReviewForTargetProvider(target));
    final l10n = AppLocalizations.of(context)!;

    return CustomScrollView(
      controller: _scrollController,
      slivers: [
        FrostedSliverAppBar(
          controller: _scrollController,
          expandedHeight: 240,
          actions: [SaveToggleButton(placeId: place.id)],
          background: Hero(
            tag: 'place-image-${place.id}',
            child: place.coverImage.isEmpty
                ? PlaceImagePlaceholder(place: place)
                : AppNetworkImage(url: place.coverImage),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(place.name,
                          style: Theme.of(context).textTheme.headlineSmall),
                    ),
                    if (place.has360)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.sm, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(AppRadius.sm),
                        ),
                        child: Text(
                          l10n.vr360Badge,
                          style: Theme.of(context)
                              .textTheme
                              .labelSmall
                              ?.copyWith(color: Colors.white),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xs),
                Row(
                  children: [
                    StarRating(rating: place.ratingAvg),
                    const SizedBox(width: AppSpacing.xs),
                    Text(
                      '${place.ratingAvg.toStringAsFixed(1)} ${l10n.reviewCountParen(place.ratingCount)}',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Wrap(
                  spacing: AppSpacing.xs,
                  children: place.tags
                      .map((tag) => Chip(
                            label: Text(tagLabel(context, tag),
                                style: Theme.of(context).textTheme.bodySmall),
                            backgroundColor:
                                AppColors.primary.withOpacity(0.08),
                            side: BorderSide.none,
                            visualDensity: VisualDensity.compact,
                          ))
                      .toList(),
                ),
                const SizedBox(height: AppSpacing.lg),
                _InfoRow(icon: Icons.place_outlined, text: place.address),
                _InfoRow(
                    icon: Icons.access_time,
                    text: _durationLabel(l10n, place.visitDurationMinutes)),
                _InfoRow(
                    icon: Icons.confirmation_number_outlined,
                    text: _priceLabel(l10n, place.ticketPrice)),
                if (place.openingHours.isNotEmpty)
                  _OpeningHours(openingHours: place.openingHours),
                if (place.has360) ...[
                  const SizedBox(height: AppSpacing.sm),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => context.push('/place/${place.id}/vr360'),
                      icon: const Icon(Icons.threed_rotation),
                      label: Text(l10n.experienceVr360Button),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        side: const BorderSide(color: AppColors.primary),
                        padding:
                            const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: AppSpacing.lg),
                Text(l10n.introductionHeading,
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: AppSpacing.xs),
                Text(place.description,
                    style: Theme.of(context).textTheme.bodyLarge),
                const SizedBox(height: AppSpacing.lg),
                const Divider(),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  l10n.reviewsHeading(reviewsAsync.valueOrNull?.where((r) => r.status == 'approved').length ?? 0),
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: AppSpacing.md),
                ReviewForm(
                    targetType: 'place',
                    targetId: place.id,
                    existingReview: myReview),
                const SizedBox(height: AppSpacing.md),
                reviewsAsync.when(
                  loading: () => const SkeletonList(itemCount: 2),
                  error: (error, _) => Text(l10n.reviewsLoadError(error)),
                  data: (reviews) {
                    if (reviews.isEmpty) {
                      return Text(
                        l10n.noReviewsForPlace,
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

  String _durationLabel(AppLocalizations l10n, int minutes) {
    if (minutes <= 0) return l10n.visitDurationUnknown;
    final hours = minutes / 60;
    final label = hours >= 1
        ? l10n.durationHours(
            hours.toStringAsFixed(hours.truncateToDouble() == hours ? 0 : 1))
        : l10n.durationMinutes(minutes);
    return l10n.visitDurationLabel(label);
  }

  String _priceLabel(AppLocalizations l10n, int price) {
    if (price <= 0) return l10n.ticketPriceLabel(l10n.free);
    final s = price
        .toString()
        .replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => '.');
    return l10n.ticketPriceLabel('$sđ');
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: context.colors.textSecondary),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
              child: Text(text, style: Theme.of(context).textTheme.bodyMedium)),
        ],
      ),
    );
  }
}

class _OpeningHours extends StatelessWidget {
  const _OpeningHours({required this.openingHours});

  final Map<String, String> openingHours;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final values = openingHours.values.toSet();
    final sameAllWeek = values.length == 1;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.schedule, size: 18, color: context.colors.textSecondary),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: sameAllWeek
                ? Text(l10n.openingHoursAllWeek(values.first),
                    style: Theme.of(context).textTheme.bodyMedium)
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(l10n.openingHoursLabel,
                          style: Theme.of(context).textTheme.bodyMedium),
                      for (final day in _weekdayOrder)
                        if (openingHours[day] != null)
                          Text(
                            '${_weekdayLabel(l10n, day)}: ${openingHours[day]}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}
