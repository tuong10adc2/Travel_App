import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/fade_slide_in.dart';
import '../../../core/widgets/skeleton_loaders.dart';
import '../../../l10n/app_localizations.dart';
import '../providers/tour_providers.dart';
import '../widgets/tour_card.dart';

class TourListScreen extends ConsumerWidget {
  const TourListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final toursAsync = ref.watch(toursProvider);
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.suggestedToursTitle)),
      body: toursAsync.when(
        loading: () => const SkeletonList(),
        error: (error, _) => Center(child: Text(l10n.toursLoadError(error))),
        data: (tours) {
          if (tours.isEmpty) {
            return EmptyState(
              icon: Icons.card_travel,
              illustrationAsset: 'assets/illustrations/empty_tours.svg',
              title: l10n.noToursYetTitle,
              message: l10n.noToursYetMessage,
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(AppSpacing.md),
            itemCount: tours.length,
            separatorBuilder: (context, index) => const SizedBox(height: AppSpacing.sm),
            itemBuilder: (context, index) =>
                FadeSlideIn.staggered(index: index, child: TourCard(tour: tours[index])),
          );
        },
      ),
    );
  }
}
