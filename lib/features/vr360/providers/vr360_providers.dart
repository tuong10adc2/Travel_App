import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/firebase_providers.dart';
import '../models/media_360.dart';

final media360ForPlaceProvider = StreamProvider.family<List<Media360>, String>((ref, placeId) {
  return ref
      .watch(firestoreProvider)
      .collection('media_360')
      .where('placeId', isEqualTo: placeId)
      .snapshots()
      .map((snapshot) {
    final items = snapshot.docs.map(Media360.fromDoc).toList();
    items.sort((a, b) => a.order.compareTo(b.order));
    return items;
  });
});
