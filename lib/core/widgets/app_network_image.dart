import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import 'shimmer_box.dart';

/// Ảnh mạng dùng chung: cache + fade-in khi tải xong, shimmer khi đang tải,
/// icon lỗi khi tải thất bại — thay cho `Image.network` trần (không cache,
/// không placeholder, mạng chậm ra khoảng trắng).
///
/// Giải mã ảnh theo đúng kích thước hiển thị thực tế (nhân devicePixelRatio,
/// qua `memCacheWidth`) thay vì giải mã full-size rồi co lại — ảnh nét hơn ở
/// khung nhỏ (card 100-160px) và nhẹ RAM hơn vì không giữ bitmap gốc quá to.
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
    return LayoutBuilder(
      builder: (context, constraints) {
        final dpr = MediaQuery.of(context).devicePixelRatio;
        final cacheWidth = constraints.maxWidth.isFinite
            ? (constraints.maxWidth * dpr).round()
            : null;

        final image = CachedNetworkImage(
          imageUrl: url,
          fit: fit,
          filterQuality: FilterQuality.high,
          memCacheWidth: cacheWidth,
          fadeInDuration: const Duration(milliseconds: 250),
          placeholder: (context, url) => const ShimmerBox(),
          errorWidget: (context, url, error) => const ColoredBox(
            color: Color(0xFFEDEDEA),
            child: Center(
              child: Icon(Icons.image_not_supported_outlined,
                  color: Color(0xFFB5B5B0)),
            ),
          ),
        );

        if (borderRadius == null) return image;
        return ClipRRect(borderRadius: borderRadius!, child: image);
      },
    );
  }
}
