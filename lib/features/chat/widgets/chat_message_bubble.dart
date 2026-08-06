import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../home/models/place.dart';
import '../../home/widgets/place_card.dart';
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
                  style: TextStyle(color: isUser ? Colors.white : AppColors.textPrimary),
                ),
              ),
            ),
          if (!isUser && message.placeSuggestionIds.isNotEmpty) _PlaceSuggestions(placeIds: message.placeSuggestionIds),
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
