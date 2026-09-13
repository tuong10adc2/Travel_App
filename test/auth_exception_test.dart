import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:travelai/features/auth/data/auth_exception.dart';

void main() {
  group('AuthException.fromFirebase', () {
    test('map đúng message tiếng Việt cho các mã lỗi đã biết', () {
      expect(
        AuthException.fromFirebase(FirebaseAuthException(code: 'user-disabled')).message,
        'Tài khoản này đã bị khoá.',
      );
      expect(
        AuthException.fromFirebase(FirebaseAuthException(code: 'operation-not-allowed')).message,
        'Phương thức đăng nhập này chưa được bật.',
      );
      expect(
        AuthException.fromFirebase(FirebaseAuthException(code: 'network-request-failed')).message,
        'Lỗi kết nối mạng, vui lòng thử lại.',
      );
    });

    test('mã lỗi lạ rơi vào message mặc định kèm đúng code', () {
      final result = AuthException.fromFirebase(FirebaseAuthException(code: 'some-unknown-code'));
      expect(result.message, contains('some-unknown-code'));
    });
  });
}
