import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/firebase_providers.dart';
import '../../auth/data/auth_repository.dart';
import '../models/review.dart';

typedef ReviewTarget = ({String targetType, String targetId});

/// Firestore CHỈ cho list-query khi rule chứng minh được TĨNH là mọi doc trả
/// về đều thoả — không lọc từng document như get(). Rule reviews có 2 nhánh
/// (status=='approved' HOẶC isOwner) nên phải tách làm 2 query equality-only
/// riêng biệt, mỗi query khớp đúng 1 nhánh, rồi merge ở client.
final _approvedReviewsProvider = StreamProvider.family<List<Review>, ReviewTarget>((ref, target) {
  return ref
      .watch(firestoreProvider)
      .collection('reviews')
      .where('targetType', isEqualTo: target.targetType)
      .where('targetId', isEqualTo: target.targetId)
      .where('status', isEqualTo: 'approved')
      .snapshots()
      .map((snapshot) => snapshot.docs.map(Review.fromDoc).toList());
});

final _myReviewsRawProvider = StreamProvider.family<List<Review>, ReviewTarget>((ref, target) {
  final uid = ref.watch(authStateChangesProvider).valueOrNull?.uid;
  if (uid == null) return Stream.value(const []);
  return ref
      .watch(firestoreProvider)
      .collection('reviews')
      .where('targetType', isEqualTo: target.targetType)
      .where('targetId', isEqualTo: target.targetId)
      .where('userId', isEqualTo: uid)
      .snapshots()
      .map((snapshot) => snapshot.docs.map(Review.fromDoc).toList());
});

final reviewsForTargetProvider = Provider.family<AsyncValue<List<Review>>, ReviewTarget>((ref, target) {
  final approved = ref.watch(_approvedReviewsProvider(target));
  final mine = ref.watch(_myReviewsRawProvider(target));

  if (approved.isLoading || mine.isLoading) return const AsyncValue.loading();
  if (approved.hasError) return AsyncValue.error(approved.error!, approved.stackTrace!);
  if (mine.hasError) return AsyncValue.error(mine.error!, mine.stackTrace!);

  final byId = <String, Review>{};
  for (final review in approved.value ?? const []) {
    byId[review.id] = review;
  }
  for (final review in mine.value ?? const []) {
    byId[review.id] = review;
  }
  final reviews = byId.values.toList()
    ..sort((a, b) => (b.createdAt ?? DateTime(0)).compareTo(a.createdAt ?? DateTime(0)));
  return AsyncValue.data(reviews);
});

final myReviewForTargetProvider = Provider.family<Review?, ReviewTarget>((ref, target) {
  final uid = ref.watch(authStateChangesProvider).valueOrNull?.uid;
  if (uid == null) return null;
  final reviews = ref.watch(reviewsForTargetProvider(target)).valueOrNull ?? const [];
  for (final review in reviews) {
    if (review.userId == uid) return review;
  }
  return null;
});
