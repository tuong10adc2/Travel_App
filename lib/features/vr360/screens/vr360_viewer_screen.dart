import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:panorama/panorama.dart' as pano;

import '../../../core/theme/app_theme.dart';
import '../../../l10n/app_localizations.dart';
import '../models/media_360.dart';
import '../providers/vr360_providers.dart';

class Vr360ViewerScreen extends ConsumerStatefulWidget {
  const Vr360ViewerScreen({super.key, required this.placeId, this.initialMediaId});

  final String placeId;
  final String? initialMediaId;

  @override
  ConsumerState<Vr360ViewerScreen> createState() => _Vr360ViewerScreenState();
}

class _Vr360ViewerScreenState extends ConsumerState<Vr360ViewerScreen> {
  String? _currentMediaId;
  bool _gyroOn = !kIsWeb;

  @override
  Widget build(BuildContext context) {
    final mediaAsync = ref.watch(media360ForPlaceProvider(widget.placeId));
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: mediaAsync.valueOrNull?.isNotEmpty == true ? _titleFor(mediaAsync.valueOrNull!, l10n) : Text(l10n.vr360FallbackTitle),
        actions: [
          IconButton(
            onPressed: kIsWeb
                ? () => ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(l10n.gyroMobileOnlyMessage)),
                    )
                : () => setState(() => _gyroOn = !_gyroOn),
            icon: Icon(_gyroOn && !kIsWeb ? Icons.screen_rotation : Icons.screen_rotation_alt_outlined),
            tooltip: _gyroOn && !kIsWeb ? l10n.gyroOffTooltip : l10n.gyroOnTooltip,
          ),
        ],
      ),
      body: mediaAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: Colors.white)),
        error: (error, _) => Center(
          child: Text(
            l10n.media360LoadError(error),
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.white),
          ),
        ),
        data: (mediaList) {
          if (mediaList.isEmpty) {
            return Center(
              child: Text(
                l10n.no360ForPlace,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.white70),
              ),
            );
          }
          final current = mediaList.firstWhere(
            (m) => m.id == (_currentMediaId ?? widget.initialMediaId),
            orElse: () => mediaList.first,
          );
          return Stack(
            children: [
              Positioned.fill(
                child: _PanoramaImage(
                  key: ValueKey(current.id),
                  media: current,
                  gyroOn: _gyroOn && !kIsWeb,
                  onHotspotTap: (targetMediaId) {
                    if (mediaList.any((m) => m.id == targetMediaId)) {
                      setState(() => _currentMediaId = targetMediaId);
                    }
                  },
                ),
              ),
              Positioned(
                left: 0,
                right: 0,
                bottom: AppSpacing.md,
                child: Column(
                  children: [
                    const _RotateHint(),
                    if (mediaList.length > 1) ...[
                      const SizedBox(height: AppSpacing.sm),
                      _ViewpointSelector(
                        mediaList: mediaList,
                        currentId: current.id,
                        onSelect: (id) => setState(() => _currentMediaId = id),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _titleFor(List<Media360> mediaList, AppLocalizations l10n) {
    final current = mediaList.firstWhere(
      (m) => m.id == (_currentMediaId ?? widget.initialMediaId),
      orElse: () => mediaList.first,
    );
    return Text(current.title.isNotEmpty ? current.title : l10n.vr360FallbackTitle);
  }
}

class _PanoramaImage extends StatefulWidget {
  const _PanoramaImage({super.key, required this.media, required this.gyroOn, required this.onHotspotTap});

  final Media360 media;
  final bool gyroOn;
  final ValueChanged<String> onHotspotTap;

  @override
  State<_PanoramaImage> createState() => _PanoramaImageState();
}

class _PanoramaImageState extends State<_PanoramaImage> {
  late Future<void> _precacheFuture;

  @override
  void initState() {
    super.initState();
    _precacheFuture = precacheImage(NetworkImage(widget.media.url), context);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<void>(
      future: _precacheFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const _LoadingSkeleton();
        }
        return pano.Panorama(
          sensorControl: widget.gyroOn ? pano.SensorControl.Orientation : pano.SensorControl.None,
          hotspots: widget.media.hotspots
              .map(
                (hotspot) => pano.Hotspot(
                  latitude: hotspot.pitch,
                  longitude: hotspot.yaw,
                  width: 44,
                  height: 44,
                  widget: _HotspotMarker(label: hotspot.label, onTap: () => widget.onHotspotTap(hotspot.targetMediaId)),
                ),
              )
              .toList(),
          child: Image.network(widget.media.url),
        );
      },
    );
  }
}

class _HotspotMarker extends StatelessWidget {
  const _HotspotMarker({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: label.isNotEmpty ? label : AppLocalizations.of(context)!.viewOtherHotspotTooltip,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.55),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
          ),
          child: const Icon(Icons.explore, color: Colors.white, size: 24),
        ),
      ),
    );
  }
}

class _LoadingSkeleton extends StatelessWidget {
  const _LoadingSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFF1A1A1A),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: Colors.white),
            const SizedBox(height: AppSpacing.md),
            Text(
              AppLocalizations.of(context)!.loading360Message,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.white70),
            ),
          ],
        ),
      ),
    );
  }
}

class _RotateHint extends StatelessWidget {
  const _RotateHint();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.xs),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.5),
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Text(
        AppLocalizations.of(context)!.rotateHint360,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(color: Colors.white),
      ),
    );
  }
}

class _ViewpointSelector extends StatelessWidget {
  const _ViewpointSelector({required this.mediaList, required this.currentId, required this.onSelect});

  final List<Media360> mediaList;
  final String currentId;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 36,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        itemCount: mediaList.length,
        separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.xs),
        itemBuilder: (context, index) {
          final media = mediaList[index];
          final selected = media.id == currentId;
          return ChoiceChip(
            label: Text(media.title.isNotEmpty ? media.title : AppLocalizations.of(context)!.viewpointLabel(index + 1)),
            selected: selected,
            onSelected: (_) => onSelect(media.id),
            selectedColor: AppColors.primary,
            backgroundColor: Colors.black.withOpacity(0.5),
            labelStyle: Theme.of(context)
                .textTheme
                .labelMedium
                ?.copyWith(color: selected ? Colors.white : Colors.white70),
            side: BorderSide.none,
            showCheckmark: false,
          );
        },
      ),
    );
  }
}
