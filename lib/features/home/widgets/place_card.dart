import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../models/place.dart';
import 'place_image_placeholder.dart';

class PlaceCard extends StatelessWidget {
  const PlaceCard({super.key, required this.place});

  final Place place;

  String get _durationLabel {
    if (place.visitDurationMinutes <= 0) return '';
    final hours = place.visitDurationMinutes / 60;
    return hours >= 1 ? '${hours.toStringAsFixed(hours.truncateToDouble() == hours ? 0 : 1)} giờ' : '${place.visitDurationMinutes} phút';
  }

  String get _priceLabel {
    if (place.ticketPrice <= 0) return 'Miễn phí';
    final s = place.ticketPrice.toString();
    final withDots = s.replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => '.');
    return '${withDots}đ'; // ignore: unnecessary_brace_in_string_interps -- tránh nhập nhằng với ký tự "đ" liền sau
  }

  @override
  Widget build(BuildContext context) {
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
                place.coverImage.isEmpty
                    ? PlaceImagePlaceholder(place: place)
                    : Image.network(place.coverImage, fit: BoxFit.cover),
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
                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ),
                if (place.has360)
                  const Positioned(
                    top: AppSpacing.sm,
                    right: AppSpacing.sm,
                    child: _Badge(
                      color: AppColors.primary,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.threed_rotation, size: 12, color: Colors.white),
                          SizedBox(width: 2),
                          Text('360° VR', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600)),
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
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                ),
                const SizedBox(height: 2),
                Text(
                  place.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
                const SizedBox(height: AppSpacing.xs),
                Row(
                  children: [
                    const Icon(Icons.access_time, size: 12, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text(_durationLabel, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                    const Spacer(),
                    Text(
                      _priceLabel,
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.primary),
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
