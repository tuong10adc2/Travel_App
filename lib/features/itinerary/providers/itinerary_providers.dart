import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/firebase_providers.dart';
import '../../auth/data/auth_repository.dart';
import '../../home/models/place.dart';
import '../../home/providers/places_providers.dart';
import '../models/itinerary.dart';
import '../models/itinerary_item.dart';

final myItinerariesProvider = StreamProvider<List<Itinerary>>((ref) {
  final uid = ref.watch(authStateChangesProvider).valueOrNull?.uid;
  if (uid == null) return Stream.value(const []);

  return ref
      .watch(firestoreProvider)
      .collection('itineraries')
      .where('userId', isEqualTo: uid)
      .snapshots()
      .map((snapshot) {
    final list = snapshot.docs.map(Itinerary.fromDoc).toList();
    list.sort((a, b) => b.startDate.compareTo(a.startDate));
    return list;
  });
});

final itineraryProvider = StreamProvider.family<Itinerary?, String>((ref, itineraryId) {
  return ref
      .watch(firestoreProvider)
      .collection('itineraries')
      .doc(itineraryId)
      .snapshots()
      .map((doc) => doc.exists ? Itinerary.fromDoc(doc) : null);
});

final itineraryItemsProvider = StreamProvider.family<List<ItineraryItem>, String>((ref, itineraryId) {
  return ref
      .watch(firestoreProvider)
      .collection('itineraries')
      .doc(itineraryId)
      .collection('itinerary_items')
      .snapshots()
      .map((snapshot) => snapshot.docs.map(ItineraryItem.fromDoc).toList());
});

/// Số ngày = khoảng cách startDate→endDate + 1 (ít nhất 1 ngày).
final itineraryDayCountProvider = Provider.family<int, String>((ref, itineraryId) {
  final itinerary = ref.watch(itineraryProvider(itineraryId)).valueOrNull;
  if (itinerary == null) return 1;
  final end = itinerary.endDate ?? itinerary.startDate;
  final days = end.difference(itinerary.startDate).inDays + 1;
  return days < 1 ? 1 : days;
});

/// Gom item theo ngày + sắp theo `order`, để màn chi tiết render thẳng ra
/// từng danh sách ReorderableListView theo ngày mà không cần lọc lại nhiều lần.
final itineraryItemsByDayProvider = Provider.family<Map<int, List<ItineraryItem>>, String>((ref, itineraryId) {
  final items = ref.watch(itineraryItemsProvider(itineraryId)).valueOrNull ?? const [];
  final byDay = <int, List<ItineraryItem>>{};
  for (final item in items) {
    byDay.putIfAbsent(item.dayIndex, () => []).add(item);
  }
  for (final list in byDay.values) {
    list.sort((a, b) => a.order.compareTo(b.order));
  }
  return byDay;
});

/// Tra cứu Place theo id từ danh sách địa điểm đã tải sẵn (không tốn thêm
/// lượt đọc Firestore vì `placesProvider` đã load toàn bộ 8 địa điểm).
final placesByIdProvider = Provider<Map<String, Place>>((ref) {
  final places = ref.watch(placesProvider).valueOrNull ?? const [];
  return {for (final place in places) place.id: place};
});
