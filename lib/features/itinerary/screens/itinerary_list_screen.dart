import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/date_format.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/pressable_scale.dart';
import '../../../core/widgets/skeleton_loaders.dart';
import '../../../l10n/app_localizations.dart';
import '../models/itinerary.dart';
import '../providers/itinerary_providers.dart';

class ItineraryListScreen extends ConsumerWidget {
  const ItineraryListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final itinerariesAsync = ref.watch(myItinerariesProvider);
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.myItinerariesTitle)),
      floatingActionButton: PressableScale(
        child: FloatingActionButton.extended(
          onPressed: () => context.push('/itineraries/new'),
          icon: const Icon(Icons.add),
          label: Text(l10n.createItineraryButton),
        ),
      ),
      body: itinerariesAsync.when(
        loading: () => const SkeletonList(),
        error: (error, _) => Center(child: Text(l10n.itineraryLoadError(error))),
        data: (itineraries) {
          if (itineraries.isEmpty) {
            return EmptyState(
              icon: Icons.calendar_month_outlined,
              illustrationAsset: 'assets/illustrations/empty_itinerary.svg',
              title: l10n.noItinerariesYetTitle,
              message: l10n.noItinerariesYetMessage,
            );
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

class _ItineraryTile extends StatelessWidget {
  const _ItineraryTile({required this.itinerary});

  final Itinerary itinerary;

  @override
  Widget build(BuildContext context) {
    final end = itinerary.endDate ?? itinerary.startDate;
    final dayCount = end.difference(itinerary.startDate).inDays + 1;
    final l10n = AppLocalizations.of(context)!;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.xs),
        leading: const CircleAvatar(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          child: Icon(Icons.map_outlined),
        ),
        title: Text(itinerary.name, style: Theme.of(context).textTheme.titleSmall),
        subtitle: Text(
          '${formatDateVi(itinerary.startDate)} · ${l10n.dayCount(dayCount)}',
          style: Theme.of(context).textTheme.bodySmall,
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => context.push('/itineraries/${itinerary.id}'),
      ),
    );
  }
}
