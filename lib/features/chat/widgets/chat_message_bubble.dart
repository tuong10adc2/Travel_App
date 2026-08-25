import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/date_format.dart';
import '../../home/models/place.dart';
import '../../home/widgets/place_card.dart';
import '../../itinerary/data/itinerary_repository.dart';
import '../../itinerary/providers/itinerary_providers.dart';
import '../models/chat_message.dart';

class ChatMessageBubble extends ConsumerWidget {
  const ChatMessageBubble({super.key, required this.message});

  final ChatMessage message;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isUser = message.isUser;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Column(
        crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          if (message.content.isNotEmpty)
            Align(
              alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
              child: Container(
                constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
                decoration: BoxDecoration(
                  color: isUser ? AppColors.primary : AppColors.surface,
                  borderRadius: BorderRadius.only(
                    topLeft: const Radius.circular(AppRadius.md),
                    topRight: const Radius.circular(AppRadius.md),
                    bottomLeft: Radius.circular(isUser ? AppRadius.md : 4),
                    bottomRight: Radius.circular(isUser ? 4 : AppRadius.md),
                  ),
                  border: isUser ? null : Border.all(color: AppColors.textSecondary.withOpacity(0.15)),
                ),
                child: Text(
                  message.content,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: isUser ? Colors.white : AppColors.textPrimary,
                      ),
                ),
              ),
            ),
          if (!isUser && message.placeSuggestionIds.isNotEmpty) _PlaceSuggestions(placeIds: message.placeSuggestionIds),
          if (!isUser && message.itineraryPlan.isNotEmpty) _ItineraryPlanCard(itineraryPlan: message.itineraryPlan),
        ],
      ),
    );
  }
}

class _PlaceSuggestions extends ConsumerWidget {
  const _PlaceSuggestions({required this.placeIds});

  final List<String> placeIds;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final placesById = ref.watch(placesByIdProvider);
    final places = placeIds.map((id) => placesById[id]).whereType<Place>().toList();
    if (places.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(top: AppSpacing.xs),
      child: SizedBox(
        height: 210,
        width: double.infinity,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: places.length,
          separatorBuilder: (context, index) => const SizedBox(width: AppSpacing.sm),
          itemBuilder: (context, index) => SizedBox(width: 160, child: PlaceCard(place: places[index])),
        ),
      ),
    );
  }
}

/// Hiển thị kết quả tool `plan_itinerary` (mỗi phần tử là 1 ngày, đã gom theo khu vực địa lý
/// + sắp thứ tự di chuyển hợp lý ở server) kèm nút tạo lịch trình thật từ gợi ý này.
class _ItineraryPlanCard extends ConsumerWidget {
  const _ItineraryPlanCard({required this.itineraryPlan});

  final List<List<String>> itineraryPlan;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final placesById = ref.watch(placesByIdProvider);
    final nonEmptyDays = itineraryPlan.where((day) => day.isNotEmpty).toList();
    if (nonEmptyDays.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(top: AppSpacing.sm),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: AppColors.textSecondary.withOpacity(0.15)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (var i = 0; i < nonEmptyDays.length; i++)
              Padding(
                padding: EdgeInsets.only(bottom: i == nonEmptyDays.length - 1 ? 0 : AppSpacing.sm),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Ngày ${i + 1}', style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: AppSpacing.xs),
                    Wrap(
                      spacing: AppSpacing.xs,
                      runSpacing: AppSpacing.xs,
                      children: nonEmptyDays[i]
                          .map((id) => placesById[id])
                          .whereType<Place>()
                          .map((p) => Chip(label: Text(p.name), visualDensity: VisualDensity.compact))
                          .toList(),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: AppSpacing.xs),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _showCreateItineraryDialog(context, ref, nonEmptyDays),
                icon: const Icon(Icons.map_outlined, size: 18),
                label: const Text('Tạo lịch trình từ gợi ý này'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showCreateItineraryDialog(
    BuildContext context,
    WidgetRef ref,
    List<List<String>> placeIdsByDay,
  ) async {
    final nameController = TextEditingController(text: 'Lịch trình gợi ý từ AI');
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
                final itineraryId = await ref.read(itineraryRepositoryProvider).createItineraryFromPlan(
                      name: nameController.text.trim(),
                      startDate: startDate,
                      placeIdsByDay: placeIdsByDay,
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
              title: const Text('Tạo lịch trình từ gợi ý này'),
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
