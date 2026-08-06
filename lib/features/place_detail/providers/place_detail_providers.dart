import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/firebase_providers.dart';
import '../../home/models/place.dart';

final placeDetailProvider = StreamProvider.family<Place?, String>((ref, placeId) {
  return ref.watch(firestoreProvider).collection('places').doc(placeId).snapshots().map((doc) {
    if (!doc.exists) return null;
    return Place.fromDoc(doc);
  });
});
