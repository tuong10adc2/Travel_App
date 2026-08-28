import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/firebase_providers.dart';

final reviewRepositoryProvider = Provider<ReviewRepository>((ref) {
  return ReviewRepository(
    firestore: ref.watch(firestoreProvider),
    firebaseAuth: ref.watch(firebaseAuthProvider),
  );
});

class ReviewRepository {
  ReviewRepository({required FirebaseFirestore firestore, required FirebaseAuth firebaseAuth})
      : _firestore = firestore,
        _firebaseAuth = firebaseAuth;

  final FirebaseFirestore _firestore;
  final FirebaseAuth _firebaseAuth;

  /// 1 review / user / mục tiêu (place hoặc tour) — doc id cố định để lần
  /// sau sửa thì ghi đè đúng review cũ. Rule chỉ cho tạo với status 'pending'
  /// và không cho tự đổi status khi sửa, nên giữ nguyên status hiện có nếu
  /// review đã tồn tại.
  Future<void> submitReview({
    required String targetType,
    required String targetId,
    required int rating,
    required String comment,
  }) async {
    final user = _firebaseAuth.currentUser;
    if (user == null) return;

    final docRef = _firestore.collection('reviews').doc('${targetType}_${targetId}_${user.uid}');
    final existing = await docRef.get();
    final status = existing.data()?['status'] as String? ?? 'pending';

    await docRef.set({
      'targetType': targetType,
      'targetId': targetId,
      'userId': user.uid,
      'userName': user.displayName ?? 'Người dùng',
      'rating': rating,
      'comment': comment,
      'images': <String>[],
      'status': status,
      // Luôn reset về null khi tạo mới hoặc sửa — để route /api/moderate-review (Vercel Cron)
      // quét đúng bằng where('aiModeration', '==', null); Firestore không match được field
      // hoàn toàn vắng mặt, nên phải ghi tường minh null thay vì bỏ qua field.
      'aiModeration': null,
      'createdAt': existing.exists ? existing.data()!['createdAt'] : FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }
}
