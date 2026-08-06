import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:panorama/panorama.dart' as pano;

import '../../../core/theme/app_theme.dart';
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

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: mediaAsync.valueOrNull?.isNotEmpty == true ? _titleFor(mediaAsync.valueOrNull!) : const Text('VR 360°'),
        actions: [
          IconButton(
            onPressed: kIsWeb
                ? () => ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Xoay theo cảm biến chỉ hỗ trợ trên thiết bị di động thật.')),
                    )
                : () => setState(() => _gyroOn = !_gyroOn),
            icon: Icon(_gyroOn && !kIsWeb ? Icons.screen_rotation : Icons.screen_rotation_alt_outlined),
            tooltip: _gyroOn && !kIsWeb ? 'Tắt xoay theo cảm biến' : 'Bật xoay theo cảm biến',
          ),
        ],
      ),
      body: mediaAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: Colors.white)),
        error: (error, _) => Center(
          child: Text('Lỗi tải dữ liệu 360°: $error', style: const TextStyle(color: Colors.white)),
        ),
        data: (mediaList) {
          if (mediaList.isEmpty) {
            return const Center(
              child: Text('Chưa có ảnh 360° cho địa điểm này.', style: TextStyle(color: Colors.white70)),
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

  Widget _titleFor(List<Media360> mediaList) {
    final current = mediaList.firstWhere(
      (m) => m.id == (_currentMediaId ?? widget.initialMediaId),
      orElse: () => mediaList.first,
    );
    return Text(current.title.isNotEmpty ? current.title : 'VR 360°');
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
      message: label.isNotEmpty ? label : 'Xem điểm nhìn khác',
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
      child: const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: Colors.white),
            SizedBox(height: AppSpacing.md),
            Text('Đang tải ảnh 360°...', style: TextStyle(color: Colors.white70)),
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
      child: const Text(
        'Vuốt hoặc nghiêng thiết bị để xoay 360°',
        style: TextStyle(color: Colors.white, fontSize: 12),
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
            label: Text(media.title.isNotEmpty ? media.title : 'Điểm nhìn ${index + 1}'),
            selected: selected,
            onSelected: (_) => onSelect(media.id),
            selectedColor: AppColors.primary,
            backgroundColor: Colors.black.withOpacity(0.5),
            labelStyle: TextStyle(color: selected ? Colors.white : Colors.white70, fontSize: 12),
            side: BorderSide.none,
            showCheckmark: false,
          );
        },
      ),
    );
  }
}
