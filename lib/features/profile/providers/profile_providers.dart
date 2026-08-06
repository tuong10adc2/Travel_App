import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/firebase_providers.dart';
import '../../auth/data/auth_repository.dart';

/// Dữ liệu document `users/{uid}` của người dùng đang đăng nhập, cập nhật realtime.
final currentUserDocProvider = StreamProvider<Map<String, dynamic>?>((ref) {
  final uid = ref.watch(authStateChangesProvider).valueOrNull?.uid;
  if (uid == null) return Stream.value(null);

  return ref
      .watch(firestoreProvider)
      .collection('users')
      .doc(uid)
      .snapshots()
      .map((snapshot) => snapshot.data());
});
