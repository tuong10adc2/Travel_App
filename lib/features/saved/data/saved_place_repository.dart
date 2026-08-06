import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/firebase_providers.dart';

final savedPlaceRepositoryProvider = Provider<SavedPlaceRepository>((ref) {
  return SavedPlaceRepository(
    firestore: ref.watch(firestoreProvider),
    firebaseAuth: ref.watch(firebaseAuthProvider),
  );
});

class SavedPlaceRepository {
  SavedPlaceRepository({required FirebaseFirestore firestore, required FirebaseAuth firebaseAuth})
      : _firestore = firestore,
        _firebaseAuth = firebaseAuth;

  final FirebaseFirestore _firestore;
  final FirebaseAuth _firebaseAuth;

  /// Doc id `${userId}_${placeId}` (theo `docs/firestore-schema.md`) — mỗi
  /// user chỉ lưu 1 lần / địa điểm, toggle bằng exists() thay vì query.
  Future<void> toggleSave(String placeId) async {
    final user = _firebaseAuth.currentUser;
    if (user == null) throw StateError('Chưa đăng nhập');

    final docRef = _firestore.collection('saved_places').doc('${user.uid}_$placeId');
    final existing = await docRef.get();
    if (existing.exists) {
      await docRef.delete();
    } else {
      await docRef.set({
        'userId': user.uid,
        'placeId': placeId,
        'createdAt': FieldValue.serverTimestamp(),
      });
    }
  }
}
