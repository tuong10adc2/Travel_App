import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import 'shimmer_box.dart';

/// Ảnh mạng dùng chung: cache + fade-in khi tải xong, shimmer khi đang tải,
/// icon lỗi khi tải thất bại — thay cho `Image.network` trần (không cache,
/// không placeholder, mạng chậm ra khoảng trắng).
class AppNetworkImage extends StatelessWidget {
  const AppNetworkImage({
    super.key,
    required this.url,
    this.fit = BoxFit.cover,
    this.borderRadius,
  });

  final String url;
  final BoxFit fit;
  final BorderRadius? borderRadius;

  @override
  Widget build(BuildContext context) {
    final image = CachedNetworkImage(
      imageUrl: url,
      fit: fit,
      fadeInDuration: const Duration(milliseconds: 250),
      placeholder: (context, url) => const ShimmerBox(),
      errorWidget: (context, url, error) => const ColoredBox(
        color: Color(0xFFEDEDEA),
        child: Center(
          child: Icon(Icons.image_not_supported_outlined, color: Color(0xFFB5B5B0)),
        ),
      ),
    );

    if (borderRadius == null) return image;
    return ClipRRect(borderRadius: borderRadius!, child: image);
  }
}
