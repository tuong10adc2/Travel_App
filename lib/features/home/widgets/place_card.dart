import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../l10n/app_localizations.dart';
import '../models/place.dart';
import 'place_image_placeholder.dart';

class PlaceCard extends StatelessWidget {
  const PlaceCard({super.key, required this.place});

  final Place place;

  String _durationLabel(AppLocalizations l10n) {
    if (place.visitDurationMinutes <= 0) return '';
    final hours = place.visitDurationMinutes / 60;
    return hours >= 1
        ? l10n.durationHours(
            hours.toStringAsFixed(hours.truncateToDouble() == hours ? 0 : 1))
        : l10n.durationMinutes(place.visitDurationMinutes);
  }

  String _priceLabel(AppLocalizations l10n) {
    if (place.ticketPrice <= 0) return l10n.free;
    final s = place.ticketPrice.toString();
    final withDots = s.replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => '.');
    return '${withDots}đ'; // ignore: unnecessary_brace_in_string_interps -- tránh nhập nhằng với ký tự "đ" liền sau
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/place/${place.id}'),
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 16 / 10,
            child: Stack(
              fit: StackFit.expand,
              children: [
                Hero(
                  tag: 'place-image-${place.id}',
                  child: place.coverImage.isEmpty
                      ? PlaceImagePlaceholder(place: place)
                      : AppNetworkImage(url: place.coverImage),
                ),
                if (place.ratingAvg > 0)
                  Positioned(
                    top: AppSpacing.sm,
                    left: AppSpacing.sm,
                    child: _Badge(
                      color: Colors.black.withOpacity(0.65),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star, size: 12, color: AppColors.secondary),
                          const SizedBox(width: 2),
                          Text(
                            place.ratingAvg.toStringAsFixed(1),
                            style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Colors.white),
                          ),
                        ],
                      ),
                    ),
                  ),
                if (place.has360)
                  Positioned(
                    top: AppSpacing.sm,
                    right: AppSpacing.sm,
                    child: _Badge(
                      color: AppColors.primary,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.threed_rotation, size: 12, color: Colors.white),
                          const SizedBox(width: 2),
                          Text(
                            l10n.vr360Badge,
                            style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Colors.white, fontSize: 10),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.sm),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  place.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(height: 2),
                Text(
                  place.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: AppSpacing.xs),
                Row(
                  children: [
                    Icon(Icons.access_time, size: 12, color: context.colors.textSecondary),
                    const SizedBox(width: 4),
                    Text(_durationLabel(l10n), style: Theme.of(context).textTheme.labelSmall),
                    const Spacer(),
                    Text(
                      _priceLabel(l10n),
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.primary),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.color, required this.child});

  final Color color;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(AppRadius.sm)),
      child: child,
    );
  }
}
