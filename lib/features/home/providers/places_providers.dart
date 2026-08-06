import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/firebase_providers.dart';
import '../models/place.dart';

/// Toàn bộ địa điểm đang active, sort client-side (không cần thêm composite
/// index Firestore) — nổi bật trước, còn lại theo tên.
final placesProvider = StreamProvider<List<Place>>((ref) {
  return ref
      .watch(firestoreProvider)
      .collection('places')
      .where('isActive', isEqualTo: true)
      .snapshots()
      .map((snapshot) {
    final places = snapshot.docs.map(Place.fromDoc).toList();
    places.sort((a, b) {
      if (a.isFeatured != b.isFeatured) return a.isFeatured ? -1 : 1;
      return a.name.compareTo(b.name);
    });
    return places;
  });
});

final placeSearchQueryProvider = StateProvider<String>((ref) => '');

final selectedTagProvider = StateProvider<String?>((ref) => null);

final filteredPlacesProvider = Provider<AsyncValue<List<Place>>>((ref) {
  final query = ref.watch(placeSearchQueryProvider).trim().toLowerCase();
  final tag = ref.watch(selectedTagProvider);

  return ref.watch(placesProvider).whenData((places) {
    return places.where((place) {
      final matchesQuery = query.isEmpty || place.name.toLowerCase().contains(query);
      final matchesTag = tag == null || place.tags.contains(tag);
      return matchesQuery && matchesTag;
    }).toList();
  });
});
