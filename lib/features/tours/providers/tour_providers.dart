import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/firebase_providers.dart';
import '../models/tour.dart';

final toursProvider = StreamProvider<List<Tour>>((ref) {
  return ref
      .watch(firestoreProvider)
      .collection('tours')
      .where('isActive', isEqualTo: true)
      .snapshots()
      .map((snapshot) {
    final tours = snapshot.docs.map(Tour.fromDoc).toList();
    tours.sort((a, b) => a.name.compareTo(b.name));
    return tours;
  });
});

final tourProvider = StreamProvider.family<Tour?, String>((ref, tourId) {
  return ref
      .watch(firestoreProvider)
      .collection('tours')
      .doc(tourId)
      .snapshots()
      .map((doc) => doc.exists ? Tour.fromDoc(doc) : null);
});
