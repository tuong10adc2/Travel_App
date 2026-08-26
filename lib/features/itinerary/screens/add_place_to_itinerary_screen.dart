import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/skeleton_loaders.dart';
import '../../../l10n/app_localizations.dart';
import '../../home/models/place.dart';
import '../../home/providers/places_providers.dart';
import '../../home/widgets/place_image_placeholder.dart';
import '../data/itinerary_repository.dart';

class AddPlaceToItineraryScreen extends ConsumerStatefulWidget {
  const AddPlaceToItineraryScreen({super.key, required this.itineraryId, required this.dayIndex});

  final String itineraryId;
  final int dayIndex;

  @override
  ConsumerState<AddPlaceToItineraryScreen> createState() => _AddPlaceToItineraryScreenState();
}

class _AddPlaceToItineraryScreenState extends ConsumerState<AddPlaceToItineraryScreen> {
  final _searchController = TextEditingController();
  String _query = '';
  String? _addingPlaceId;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _add(Place place) async {
    setState(() => _addingPlaceId = place.id);
    try {
      await ref.read(itineraryRepositoryProvider).addItem(
            itineraryId: widget.itineraryId,
            placeId: place.id,
            dayIndex: widget.dayIndex,
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(AppLocalizations.of(context)!.placeAddedToDay(place.name, widget.dayIndex + 1))),
        );
        context.pop();
      }
    } finally {
      if (mounted) setState(() => _addingPlaceId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final placesAsync = ref.watch(placesProvider);
    final query = _query.trim().toLowerCase();
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.addPlaceToDayTitle(widget.dayIndex + 1))),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: TextField(
              controller: _searchController,
              onChanged: (value) => setState(() => _query = value),
              decoration: InputDecoration(
                hintText: l10n.searchPlacesHint,
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: context.colors.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          Expanded(
            child: placesAsync.when(
              loading: () => const SkeletonList(),
              error: (error, _) => Center(child: Text(l10n.placesLoadError(error))),
              data: (places) {
                final filtered = query.isEmpty
                    ? places
                    : places.where((p) => p.name.toLowerCase().contains(query)).toList();
                if (filtered.isEmpty) {
                  return Center(
                    child: Text(
                      l10n.noMatchingPlacesFound,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: context.colors.textSecondary),
                    ),
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                  itemCount: filtered.length,
                  separatorBuilder: (context, index) => const SizedBox(height: AppSpacing.sm),
                  itemBuilder: (context, index) {
                    final place = filtered[index];
                    final isAdding = _addingPlaceId == place.id;
                    return Card(
                      clipBehavior: Clip.antiAlias,
                      child: ListTile(
                        leading: SizedBox(
                          width: 48,
                          height: 48,
                          child: place.coverImage.isEmpty
                              ? PlaceImagePlaceholder(place: place)
                              : AppNetworkImage(url: place.coverImage),
                        ),
                        title: Text(place.name, style: Theme.of(context).textTheme.titleSmall),
                        subtitle: Text(place.address, maxLines: 1, overflow: TextOverflow.ellipsis),
                        trailing: isAdding
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : IconButton(
                                icon: const Icon(Icons.add_circle_outline, color: AppColors.primary),
                                onPressed: () => _add(place),
                              ),
                        onTap: isAdding ? null : () => _add(place),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
