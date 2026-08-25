import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/skeleton_loaders.dart';
import '../../home/models/place.dart';
import '../data/itinerary_repository.dart';
import '../models/itinerary_item.dart';
import '../providers/itinerary_providers.dart';

class ItineraryDetailScreen extends ConsumerStatefulWidget {
  const ItineraryDetailScreen({super.key, required this.itineraryId});

  final String itineraryId;

  @override
  ConsumerState<ItineraryDetailScreen> createState() => _ItineraryDetailScreenState();
}

class _ItineraryDetailScreenState extends ConsumerState<ItineraryDetailScreen> {
  int _selectedDay = 0;

  Future<void> _addDay() async {
    final itinerary = ref.read(itineraryProvider(widget.itineraryId)).valueOrNull;
    if (itinerary == null) return;
    final currentDayCount = ref.read(itineraryDayCountProvider(widget.itineraryId));
    final newEndDate = itinerary.startDate.add(Duration(days: currentDayCount));
    await ref.read(itineraryRepositoryProvider).addDay(
          itineraryId: widget.itineraryId,
          newEndDate: newEndDate,
        );
    setState(() => _selectedDay = currentDayCount);
  }

  Future<void> _removeItem(ItineraryItem item) async {
    await ref.read(itineraryRepositoryProvider).removeItem(
          itineraryId: widget.itineraryId,
          itemId: item.id,
        );
  }

  Future<void> _reorder(List<ItineraryItem> dayItems, int oldIndex, int newIndex) async {
    if (newIndex > oldIndex) newIndex -= 1;
    final reordered = List<ItineraryItem>.from(dayItems);
    final moved = reordered.removeAt(oldIndex);
    reordered.insert(newIndex, moved);
    await ref.read(itineraryRepositoryProvider).reorderDay(
          itineraryId: widget.itineraryId,
          orderedItemIds: reordered.map((e) => e.id).toList(),
        );
  }

  @override
  Widget build(BuildContext context) {
    final itineraryAsync = ref.watch(itineraryProvider(widget.itineraryId));

    return Scaffold(
      appBar: AppBar(
        title: Text(itineraryAsync.valueOrNull?.name ?? 'Lịch trình'),
      ),
      body: itineraryAsync.when(
        loading: () => const SkeletonList(),
        error: (error, _) => Center(child: Text('Lỗi tải lịch trình: $error')),
        data: (itinerary) {
          if (itinerary == null) {
            return const Center(child: Text('Không tìm thấy lịch trình.'));
          }

          final dayCount = ref.watch(itineraryDayCountProvider(widget.itineraryId));
          final itemsByDay = ref.watch(itineraryItemsByDayProvider(widget.itineraryId));
          final placesById = ref.watch(placesByIdProvider);
          final selectedDay = _selectedDay >= dayCount ? dayCount - 1 : _selectedDay;
          final dayItems = itemsByDay[selectedDay] ?? const [];

          return Column(
            children: [
              _DaySelector(
                dayCount: dayCount,
                selectedDay: selectedDay,
                onSelect: (day) => setState(() => _selectedDay = day),
                onAddDay: _addDay,
              ),
              const Divider(height: 1),
              Expanded(
                child: dayItems.isEmpty
                    ? const _EmptyDay()
                    : ReorderableListView.builder(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        itemCount: dayItems.length,
                        buildDefaultDragHandles: false,
                        onReorder: (oldIndex, newIndex) => _reorder(dayItems, oldIndex, newIndex),
                        itemBuilder: (context, index) {
                          final item = dayItems[index];
                          final place = placesById[item.placeId];
                          return _ItineraryItemTile(
                            key: ValueKey(item.id),
                            index: index,
                            item: item,
                            place: place,
                            onRemove: () => _removeItem(item),
                          );
                        },
                      ),
              ),
              Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () => context.push('/itineraries/${widget.itineraryId}/add-place?day=$selectedDay'),
                    icon: const Icon(Icons.add_location_alt_outlined),
                    label: const Text('Thêm địa điểm'),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _DaySelector extends StatelessWidget {
  const _DaySelector({
    required this.dayCount,
    required this.selectedDay,
    required this.onSelect,
    required this.onAddDay,
  });

  final int dayCount;
  final int selectedDay;
  final ValueChanged<int> onSelect;
  final VoidCallback onAddDay;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 52,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
        children: [
          for (var day = 0; day < dayCount; day++)
            Padding(
              padding: const EdgeInsets.only(right: AppSpacing.sm),
              child: ChoiceChip(
                label: Text('Ngày ${day + 1}'),
                selected: selectedDay == day,
                onSelected: (_) => onSelect(day),
                selectedColor: AppColors.primary,
                labelStyle: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: selectedDay == day ? Colors.white : context.colors.textPrimary,
                    ),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
                showCheckmark: false,
              ),
            ),
          ActionChip(
            avatar: const Icon(Icons.add, size: 18),
            label: const Text('Thêm ngày'),
            onPressed: onAddDay,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
          ),
        ],
      ),
    );
  }
}

class _EmptyDay extends StatelessWidget {
  const _EmptyDay();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Text(
          'Chưa có địa điểm nào trong ngày này.\nBấm "Thêm địa điểm" bên dưới.',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: context.colors.textSecondary),
        ),
      ),
    );
  }
}

class _ItineraryItemTile extends StatelessWidget {
  const _ItineraryItemTile({
    super.key,
    required this.index,
    required this.item,
    required this.place,
    required this.onRemove,
  });

  final int index;
  final ItineraryItem item;
  final Place? place;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      clipBehavior: Clip.antiAlias,
      child: ListTile(
        leading: ReorderableDragStartListener(
          index: index,
          child: Icon(Icons.drag_indicator, color: context.colors.textSecondary),
        ),
        title: Text(
          place?.name ?? '(Địa điểm không còn tồn tại)',
          style: Theme.of(context).textTheme.titleSmall,
        ),
        subtitle: place != null
            ? Text(place!.address, maxLines: 1, overflow: TextOverflow.ellipsis)
            : null,
        trailing: IconButton(
          icon: const Icon(Icons.delete_outline, color: AppColors.error),
          onPressed: onRemove,
          tooltip: 'Xoá khỏi lịch trình',
        ),
        onTap: place != null ? () => context.push('/place/${place!.id}') : null,
      ),
    );
  }
}
