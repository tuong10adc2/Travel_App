import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/app_network_image.dart';
import '../models/tour.dart';

class TourCard extends StatelessWidget {
  const TourCard({super.key, required this.tour});

  final Tour tour;

  static const _gradients = [
    [Color(0xFF0E7C66), Color(0xFF16A085)],
    [Color(0xFFF2A93B), Color(0xFFE08B1E)],
    [Color(0xFF2C7A7B), Color(0xFF0E7C66)],
    [Color(0xFF1A6B5C), Color(0xFF3EAE8C)],
  ];

  String get _priceLabel {
    if (tour.price <= 0) return 'Liên hệ';
    final s = tour.price.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => '.');
    return '${s}đ'; // ignore: unnecessary_brace_in_string_interps -- tránh nhập nhằng với ký tự "đ" liền sau
  }

  @override
  Widget build(BuildContext context) {
    final colors = _gradients[tour.name.hashCode.abs() % _gradients.length];

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/tours/${tour.id}'),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 100,
              height: 100,
              child: tour.coverImage.isEmpty
                  ? Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: colors,
                        ),
                      ),
                      child: const Center(
                        child: Icon(Icons.card_travel, size: 32, color: Colors.white70),
                      ),
                    )
                  : AppNetworkImage(url: tour.coverImage),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tour.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      tour.description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Row(
                      children: [
                        const Icon(Icons.calendar_month_outlined, size: 14, color: AppColors.textSecondary),
                        const SizedBox(width: 4),
                        Text('${tour.durationDays} ngày', style: Theme.of(context).textTheme.bodySmall),
                        const SizedBox(width: AppSpacing.sm),
                        const Icon(Icons.place_outlined, size: 14, color: AppColors.textSecondary),
                        const SizedBox(width: 4),
                        Text('${tour.placeIds.length} điểm', style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      _priceLabel,
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(color: AppColors.primary),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
