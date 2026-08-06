import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/firebase_providers.dart';

final itineraryRepositoryProvider = Provider<ItineraryRepository>((ref) {
  return ItineraryRepository(
    firestore: ref.watch(firestoreProvider),
    firebaseAuth: ref.watch(firebaseAuthProvider),
  );
});

class ItineraryRepository {
  ItineraryRepository({required FirebaseFirestore firestore, required FirebaseAuth firebaseAuth})
      : _firestore = firestore,
        _firebaseAuth = firebaseAuth;

  final FirebaseFirestore _firestore;
  final FirebaseAuth _firebaseAuth;

  CollectionReference<Map<String, dynamic>> get _itineraries => _firestore.collection('itineraries');

  CollectionReference<Map<String, dynamic>> _items(String itineraryId) =>
      _itineraries.doc(itineraryId).collection('itinerary_items');

  /// Lịch trình mới mặc định 1 ngày (endDate == startDate); thêm ngày sau
  /// bằng [addDay] chỉ đẩy endDate lên, không cần lưu riêng "số ngày".
  Future<String> createItinerary({required String name, required DateTime startDate}) async {
    final user = _firebaseAuth.currentUser;
    if (user == null) throw StateError('Chưa đăng nhập');

    final docRef = await _itineraries.add({
      'userId': user.uid,
      'name': name,
      'startDate': Timestamp.fromDate(startDate),
      'endDate': Timestamp.fromDate(startDate),
      'isShared': false,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
    return docRef.id;
  }

  /// Tạo lịch trình mới từ 1 tour: chia đều [placeIds] (giữ nguyên thứ tự
  /// trong tour) cho [durationDays] ngày. Sau đó user sửa tự do bằng các hàm
  /// addItem/removeItem/reorderDay ở trên.
  ///
  /// Phải tạo doc `itineraries` xong (await riêng) rồi mới ghi
  /// `itinerary_items` — nếu gộp chung 1 WriteBatch, rule của
  /// `itinerary_items` (đọc `get()` doc cha để kiểm tra chủ sở hữu) sẽ đánh
  /// giá trên state TRƯỚC batch, tức là doc cha chưa tồn tại → permission-denied.
  Future<String> createItineraryFromTour({
    required String name,
    required DateTime startDate,
    required List<String> placeIds,
    required int durationDays,
  }) async {
    final user = _firebaseAuth.currentUser;
    if (user == null) throw StateError('Chưa đăng nhập');

    final days = durationDays < 1 ? 1 : durationDays;
    final endDate = startDate.add(Duration(days: days - 1));

    final itineraryRef = await _itineraries.add({
      'userId': user.uid,
      'name': name,
      'startDate': Timestamp.fromDate(startDate),
      'endDate': Timestamp.fromDate(endDate),
      'isShared': false,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });

    if (placeIds.isNotEmpty) {
      final itemsRef = itineraryRef.collection('itinerary_items');
      final batch = _firestore.batch();
      final orderPerDay = <int, int>{};
      for (var i = 0; i < placeIds.length; i++) {
        final dayIndex = (i * days) ~/ placeIds.length;
        final order = orderPerDay[dayIndex] ?? 0;
        orderPerDay[dayIndex] = order + 1;
        batch.set(itemsRef.doc(), {
          'placeId': placeIds[i],
          'dayIndex': dayIndex,
          'order': order,
          'note': null,
          'createdAt': FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
    }

    return itineraryRef.id;
  }

  Future<void> addDay({required String itineraryId, required DateTime newEndDate}) async {
    await _itineraries.doc(itineraryId).update({
      'endDate': Timestamp.fromDate(newEndDate),
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  /// order = số item hiện có trong đúng ngày đó (thêm vào cuối danh sách ngày).
  Future<void> addItem({
    required String itineraryId,
    required String placeId,
    required int dayIndex,
  }) async {
    final itemsRef = _items(itineraryId);
    final existing = await itemsRef.where('dayIndex', isEqualTo: dayIndex).get();
    await itemsRef.add({
      'placeId': placeId,
      'dayIndex': dayIndex,
      'order': existing.docs.length,
      'note': null,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  Future<void> removeItem({required String itineraryId, required String itemId}) async {
    await _items(itineraryId).doc(itemId).delete();
  }

  /// Ghi lại `order` (0..n-1) theo đúng thứ tự [orderedItemIds] sau khi kéo-thả.
  Future<void> reorderDay({
    required String itineraryId,
    required List<String> orderedItemIds,
  }) async {
    final batch = _firestore.batch();
    final itemsRef = _items(itineraryId);
    for (var i = 0; i < orderedItemIds.length; i++) {
      batch.update(itemsRef.doc(orderedItemIds[i]), {'order': i});
    }
    await batch.commit();
  }
}
