// ignore_for_file: avoid_web_libraries_in_flutter
// File này chỉ được compile khi build target web (qua conditional export ở
// place_map_view.dart), nên dùng dart:html trực tiếp là an toàn ở đây.
import 'dart:html' as html;
import 'dart:ui_web' as ui_web;

import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

/// Bản Flutter Web của [PlaceMapView] — `webview_flutter` không có platform
/// implementation cho web (crash toàn app nếu build vào web), nên nhúng iframe
/// thẳng qua `HtmlElementView` (cách chuẩn của Flutter Web để chèn DOM element).
class PlaceMapView extends StatefulWidget {
  const PlaceMapView({super.key, required this.latitude, required this.longitude});

  final double latitude;
  final double longitude;

  @override
  State<PlaceMapView> createState() => _PlaceMapViewState();
}

class _PlaceMapViewState extends State<PlaceMapView> {
  // registerViewFactory ném lỗi nếu gọi lại 2 lần cùng viewType — theo dõi
  // toàn cục để build() lại (rebuild/mở lại màn) không bị lỗi.
  static final Set<String> _registeredViewTypes = {};

  late final String _viewType;

  @override
  void initState() {
    super.initState();
    _viewType = 'place-map-${widget.latitude}-${widget.longitude}';
    if (_registeredViewTypes.add(_viewType)) {
      ui_web.platformViewRegistry.registerViewFactory(_viewType, (int viewId) {
        return html.IFrameElement()
          ..src = 'https://maps.google.com/maps?q=${widget.latitude},${widget.longitude}&z=15&output=embed'
          ..style.border = 'none'
          ..style.width = '100%'
          ..style.height = '100%';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(AppRadius.md),
      child: SizedBox(
        height: 200,
        child: HtmlElementView(viewType: _viewType),
      ),
    );
  }
}
