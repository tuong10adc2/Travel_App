import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/firebase_providers.dart';
import '../../auth/data/auth_repository.dart';
import '../../home/models/place.dart';
import '../../home/providers/places_providers.dart';

/// Set các placeId user hiện tại đã lưu — dùng để tô trạng thái nút yêu thích.
final savedPlaceIdsProvider = StreamProvider<Set<String>>((ref) {
  final uid = ref.watch(authStateChangesProvider).valueOrNull?.uid;
  if (uid == null) return Stream.value(const <String>{});

  return ref
      .watch(firestoreProvider)
      .collection('saved_places')
      .where('userId', isEqualTo: uid)
      .snapshots()
      .map((snapshot) => snapshot.docs.map((doc) => doc.data()['placeId'] as String).toSet());
});

final isPlaceSavedProvider = Provider.family<bool, String>((ref, placeId) {
  final savedIds = ref.watch(savedPlaceIdsProvider).valueOrNull ?? const {};
  return savedIds.contains(placeId);
});

/// Join placeId đã lưu với danh sách địa điểm đã tải sẵn (không tốn thêm
/// lượt đọc Firestore) để render ra danh sách Place đầy đủ cho màn Đã lưu.
final savedPlacesProvider = Provider<AsyncValue<List<Place>>>((ref) {
  final savedIdsAsync = ref.watch(savedPlaceIdsProvider);
  final placesAsync = ref.watch(placesProvider);

  if (savedIdsAsync.isLoading || placesAsync.isLoading) return const AsyncValue.loading();
  if (savedIdsAsync.hasError) return AsyncValue.error(savedIdsAsync.error!, savedIdsAsync.stackTrace!);
  if (placesAsync.hasError) return AsyncValue.error(placesAsync.error!, placesAsync.stackTrace!);

  final savedIds = savedIdsAsync.value ?? const {};
  final places = placesAsync.value ?? const [];
  return AsyncValue.data(places.where((place) => savedIds.contains(place.id)).toList());
});
