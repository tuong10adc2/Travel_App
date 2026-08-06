import 'package:firebase_auth/firebase_auth.dart';

/// Bọc lỗi [FirebaseAuthException] thành message tiếng Việt cho UI hiển thị.
class AuthException implements Exception {
  final String message;

  AuthException(this.message);

  factory AuthException.fromFirebase(FirebaseAuthException e) {
    switch (e.code) {
      case 'invalid-email':
        return AuthException('Email không hợp lệ.');
      case 'user-disabled':
        return AuthException('Tài khoản này đã bị khoá.');
      case 'user-not-found':
        return AuthException('Không tìm thấy tài khoản với email này.');
      case 'wrong-password':
      case 'invalid-credential':
        return AuthException('Email hoặc mật khẩu không đúng.');
      case 'email-already-in-use':
        return AuthException('Email này đã được đăng ký.');
      case 'weak-password':
        return AuthException('Mật khẩu quá yếu, cần ít nhất 6 ký tự.');
      case 'operation-not-allowed':
        return AuthException('Phương thức đăng nhập này chưa được bật.');
      case 'too-many-requests':
        return AuthException('Bạn thao tác quá nhiều lần, vui lòng thử lại sau.');
      case 'network-request-failed':
        return AuthException('Lỗi kết nối mạng, vui lòng thử lại.');
      default:
        return AuthException('Đã có lỗi xảy ra (${e.code}), vui lòng thử lại.');
    }
  }

  @override
  String toString() => message;
}
