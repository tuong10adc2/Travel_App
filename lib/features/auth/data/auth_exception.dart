import 'package:firebase_auth/firebase_auth.dart';

import '../../../l10n/app_localizations.dart';

/// Bọc lỗi [FirebaseAuthException] thành message tiếng Việt cho log/`toString()`
/// (khi không có `context`/[AppLocalizations] sẵn) — UI hiển thị nên dùng
/// [localizedMessage] để lấy message đúng theo ngôn ngữ đang chọn.
class AuthException implements Exception {
  final String code;
  final String message;

  AuthException(this.code, this.message);

  factory AuthException.fromFirebase(FirebaseAuthException e) {
    switch (e.code) {
      case 'user-disabled':
        return AuthException(e.code, 'Tài khoản này đã bị khoá.');
      case 'operation-not-allowed':
        return AuthException(e.code, 'Phương thức đăng nhập này chưa được bật.');
      case 'too-many-requests':
        return AuthException(e.code, 'Bạn thao tác quá nhiều lần, vui lòng thử lại sau.');
      case 'network-request-failed':
        return AuthException(e.code, 'Lỗi kết nối mạng, vui lòng thử lại.');
      default:
        return AuthException(e.code, 'Đã có lỗi xảy ra (${e.code}), vui lòng thử lại.');
    }
  }

  /// Message đúng theo ngôn ngữ hiện tại — dùng cái này trong UI (SnackBar...)
  /// thay vì [message] (luôn là tiếng Việt).
  String localizedMessage(AppLocalizations l10n) {
    switch (code) {
      case 'user-disabled':
        return l10n.authErrorUserDisabled;
      case 'operation-not-allowed':
        return l10n.authErrorOperationNotAllowed;
      case 'too-many-requests':
        return l10n.authErrorTooManyRequests;
      case 'network-request-failed':
        return l10n.authErrorNetworkFailed;
      default:
        return l10n.authErrorGeneric(code);
    }
  }

  @override
  String toString() => message;
}
