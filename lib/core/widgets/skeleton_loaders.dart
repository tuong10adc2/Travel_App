import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'shimmer_box.dart';

/// Skeleton cho lưới card kiểu `PlaceCard`/`TourCard` (ảnh 16:10 + 2 dòng chữ).
class SkeletonCardGrid extends StatelessWidget {
  const SkeletonCardGrid({super.key, this.itemCount = 6, this.crossAxisCount = 2});

  final int itemCount;
  final int crossAxisCount;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(AppSpacing.md),
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      itemCount: itemCount,
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        mainAxisSpacing: AppSpacing.sm,
        crossAxisSpacing: AppSpacing.sm,
        childAspectRatio: 0.72,
      ),
      itemBuilder: (context, index) => const _CardSkeleton(),
    );
  }
}

class _CardSkeleton extends StatelessWidget {
  const _CardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AspectRatio(
          aspectRatio: 16 / 10,
          child: ShimmerBox(borderRadius: BorderRadius.circular(AppRadius.md)),
        ),
        const SizedBox(height: AppSpacing.sm),
        const ShimmerBox(height: 14, width: 120),
        const SizedBox(height: 6),
        const ShimmerBox(height: 11, width: 80),
      ],
    );
  }
}

/// Skeleton cho danh sách dạng dòng (itinerary, saved places, tours).
class SkeletonList extends StatelessWidget {
  const SkeletonList({super.key, this.itemCount = 5});

  final int itemCount;

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(AppSpacing.md),
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      itemCount: itemCount,
      separatorBuilder: (context, index) => const SizedBox(height: AppSpacing.sm),
      itemBuilder: (context, index) => const _ListTileSkeleton(),
    );
  }
}

class _ListTileSkeleton extends StatelessWidget {
  const _ListTileSkeleton();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        ShimmerBox(width: 64, height: 64, borderRadius: BorderRadius.circular(AppRadius.md)),
        const SizedBox(width: AppSpacing.sm),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ShimmerBox(height: 14, width: double.infinity),
              SizedBox(height: 8),
              ShimmerBox(height: 12, width: 160),
            ],
          ),
        ),
      ],
    );
  }
}

/// Skeleton cho trang chi tiết (ảnh cover lớn + các dòng chữ bên dưới).
class SkeletonDetailPage extends StatelessWidget {
  const SkeletonDetailPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.zero,
      physics: const NeverScrollableScrollPhysics(),
      children: const [
        ShimmerBox(height: 240, borderRadius: BorderRadius.zero),
        Padding(
          padding: EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ShimmerBox(height: 22, width: 220),
              SizedBox(height: AppSpacing.sm),
              ShimmerBox(height: 14, width: 140),
              SizedBox(height: AppSpacing.lg),
              ShimmerBox(height: 12, width: double.infinity),
              SizedBox(height: 8),
              ShimmerBox(height: 12, width: double.infinity),
              SizedBox(height: 8),
              ShimmerBox(height: 12, width: 200),
            ],
          ),
        ),
      ],
    );
  }
}
