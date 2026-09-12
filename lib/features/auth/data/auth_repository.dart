import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../../core/providers/firebase_providers.dart';
import 'auth_exception.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    firebaseAuth: ref.watch(firebaseAuthProvider),
    firestore: ref.watch(firestoreProvider),
    googleSignIn: ref.watch(googleSignInProvider),
  );
});

/// Trạng thái đăng nhập hiện tại, dùng cho router redirect và UI.
final authStateChangesProvider = StreamProvider<User?>((ref) {
  return ref.watch(authRepositoryProvider).authStateChanges;
});

class AuthRepository {
  final FirebaseAuth _firebaseAuth;
  final FirebaseFirestore _firestore;
  final GoogleSignIn _googleSignIn;

  AuthRepository({
    required FirebaseAuth firebaseAuth,
    required FirebaseFirestore firestore,
    required GoogleSignIn googleSignIn,
  })  : _firebaseAuth = firebaseAuth,
        _firestore = firestore,
        _googleSignIn = googleSignIn;

  Stream<User?> get authStateChanges => _firebaseAuth.authStateChanges();

  User? get currentUser => _firebaseAuth.currentUser;

  /// Trả về `null` nếu người dùng huỷ chọn tài khoản Google.
  ///
  /// Trên web dùng thẳng `signInWithPopup` của Firebase Auth thay vì package
  /// `google_sign_in` — package đó gọi trực tiếp Google Identity Services nên
  /// cần đăng ký domain thủ công vào "Authorized JavaScript origins" của OAuth
  /// Client trên Google Cloud Console (lỗi `origin_mismatch` nếu thiếu, phải
  /// làm lại mỗi khi đổi domain deploy). `signInWithPopup` đi qua trang trung
  /// gian `<project>.firebaseapp.com/__/auth/handler` của Firebase, chỉ cần
  /// domain nằm trong "Authorized domains" của Firebase Auth (đã tự thêm khi
  /// deploy qua `firebase deploy`/Console, không cần cấu hình OAuth riêng).
  Future<User?> signInWithGoogle() async {
    try {
      if (kIsWeb) {
        final userCredential =
            await _firebaseAuth.signInWithPopup(GoogleAuthProvider());
        final user = userCredential.user!;
        await _createUserDocument(user, displayName: user.displayName ?? '');
        return user;
      }

      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null;

      final googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final userCredential =
          await _firebaseAuth.signInWithCredential(credential);
      final user = userCredential.user!;
      await _createUserDocument(user,
          displayName: user.displayName ?? googleUser.displayName ?? '');
      return user;
    } on FirebaseAuthException catch (e) {
      throw AuthException.fromFirebase(e);
    }
  }

  Future<void> updateProfile({
    required String displayName,
    String? phoneNumber,
    List<String>? preferences,
    String? language,
  }) async {
    final user = _firebaseAuth.currentUser;
    if (user == null) return;

    await user.updateDisplayName(displayName);
    await _firestore.collection('users').doc(user.uid).update({
      'displayName': displayName,
      'phoneNumber': phoneNumber,
      if (preferences != null) 'preferences': preferences,
      if (language != null) 'language': language,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  Future<void> signOut() async {
    // Trên web đăng nhập qua signInWithPopup (không qua package google_sign_in),
    // nên không cần/không nên gọi _googleSignIn.signOut() ở đó.
    await Future.wait([
      _firebaseAuth.signOut(),
      if (!kIsWeb) _googleSignIn.signOut(),
    ]);
  }

  /// Tạo `users/{uid}` khớp field bắt buộc trong `firestore.rules`
  /// (role mặc định 'user', isDisabled = false) — chỉ tạo nếu chưa tồn tại,
  /// để không ghi đè khi đăng nhập lại qua provider khác (vd. Google).
  Future<void> _createUserDocument(User user,
      {required String displayName}) async {
    final docRef = _firestore.collection('users').doc(user.uid);
    final snapshot = await docRef.get();
    if (snapshot.exists) return;

    await docRef.set({
      'uid': user.uid,
      'email': user.email,
      'displayName': displayName,
      'photoURL': user.photoURL,
      'phoneNumber': user.phoneNumber,
      'role': 'user',
      'preferences': <String>[],
      'language': 'vi',
      'isDisabled': false,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }
}
