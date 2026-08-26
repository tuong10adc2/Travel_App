import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/services/push_notification_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/tag_labels.dart';
import '../../../core/widgets/background_blobs.dart';
import '../../../core/widgets/fade_slide_in.dart';
import '../../../core/widgets/skeleton_loaders.dart';
import '../../../l10n/app_localizations.dart';
import '../providers/places_providers.dart';
import '../widgets/place_card.dart';

const _tags = ['Lịch sử', 'Ẩm thực', 'Thiên nhiên', 'Văn hoá'];

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  void initState() {
    super.initState();
    // Home là màn đầu tiên sau khi đăng nhập (app_router redirect) — điểm hợp lý nhất để
    // đăng ký nhận push notification 1 lần cho cả phiên.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(pushNotificationServiceProvider).init();
    });
  }

  @override
  Widget build(BuildContext context) {
    final placesAsync = ref.watch(filteredPlacesProvider);
    final selectedTag = ref.watch(selectedTagProvider);
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      body: DecorativeBackground(
        child: SafeArea(
          child: CustomScrollView(
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(
                    AppSpacing.lg, AppSpacing.md, AppSpacing.lg, 0),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _Header(onProfileTap: () => context.go('/profile')),
                      const SizedBox(height: AppSpacing.lg),
                      _SearchField(
                        onChanged: (value) => ref
                            .read(placeSearchQueryProvider.notifier)
                            .state = value,
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      const _PromoBanner(),
                      const SizedBox(height: AppSpacing.lg),
                      _TagFilterRow(
                        selectedTag: selectedTag,
                        onSelect: (tag) =>
                            ref.read(selectedTagProvider.notifier).state = tag,
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      Text(l10n.recommendedForYou,
                          style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: AppSpacing.sm),
                    ],
                  ),
                ),
              ),
              placesAsync.when(
                loading: () =>
                    const SliverToBoxAdapter(child: SkeletonCardGrid()),
                error: (error, _) => SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(child: Text(l10n.placesLoadError(error))),
                ),
                data: (places) {
                  if (places.isEmpty) {
                    return SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                          child: Text(l10n.noMatchingPlacesFound)),
                    );
                  }
                  return SliverPadding(
                    padding: const EdgeInsets.fromLTRB(
                        AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.lg),
                    sliver: SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        mainAxisSpacing: AppSpacing.sm,
                        crossAxisSpacing: AppSpacing.sm,
                        childAspectRatio: 0.72,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (context, index) => FadeSlideIn.staggered(
                          index: index,
                          child: PlaceCard(place: places[index]),
                        ),
                        childCount: places.length,
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.onProfileTap});

  final VoidCallback onProfileTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const ClipOval(
          child: Image(
            image: AssetImage('assets/images/logo.png'),
            width: 40,
            height: 40,
            fit: BoxFit.cover,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child:
              Text('TngGuide', style: Theme.of(context).textTheme.titleLarge),
        ),
        IconButton(
          onPressed: onProfileTap,
          icon: const Icon(Icons.person_outline),
          tooltip: AppLocalizations.of(context)!.profileTitle,
        ),
      ],
    );
  }
}

class _SearchField extends StatelessWidget {
  const _SearchField({required this.onChanged});

  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return TextField(
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: AppLocalizations.of(context)!.searchPlacesHint,
        prefixIcon: const Icon(Icons.search),
        filled: true,
        fillColor: context.colors.surface,
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppRadius.lg),
            borderSide: BorderSide.none),
        contentPadding:
            const EdgeInsets.symmetric(vertical: 14, horizontal: AppSpacing.md),
      ),
    );
  }
}

class _PromoBanner extends StatelessWidget {
  const _PromoBanner();

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return ClipRRect(
      borderRadius: BorderRadius.circular(AppRadius.lg),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppColors.primary, AppColors.primaryDark],
          ),
        ),
        child: Stack(
          children: [
            const Positioned.fill(
                child: PatternOverlay(color: Colors.white, opacity: 1.4)),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.discoverNewJourney,
                  style: Theme.of(context)
                      .textTheme
                      .titleLarge
                      ?.copyWith(color: Colors.white),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  l10n.suggestedPlacesForYou,
                  style: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.copyWith(color: Colors.white70),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _TagFilterRow extends StatelessWidget {
  const _TagFilterRow({required this.selectedTag, required this.onSelect});

  final String? selectedTag;
  final ValueChanged<String?> onSelect;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _TagChip(
              label: AppLocalizations.of(context)!.filterAll,
              selected: selectedTag == null,
              onTap: () => onSelect(null)),
          for (final tag in _tags)
            Padding(
              padding: const EdgeInsets.only(left: AppSpacing.sm),
              child: _TagChip(
                  label: tagLabel(context, tag),
                  selected: selectedTag == tag,
                  onTap: () => onSelect(tag)),
            ),
        ],
      ),
    );
  }
}

class _TagChip extends StatelessWidget {
  const _TagChip(
      {required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      selectedColor: AppColors.primary,
      backgroundColor: context.colors.surface,
      labelStyle: Theme.of(context).textTheme.labelLarge?.copyWith(
            color: selected ? Colors.white : context.colors.textPrimary,
          ),
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          side: BorderSide.none),
      showCheckmark: false,
    );
  }
}
