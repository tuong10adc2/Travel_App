import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'profile_providers.dart';

/// Instance [SharedPreferences] đã tải sẵn ở `main()` (xem override trong
/// `ProviderScope`) — cho phép đọc đồng bộ ngay từ lần build đầu tiên thay vì
/// phải chờ 1 `FutureProvider`.
final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError(
      'sharedPreferencesProvider phải được override bằng instance thật trong main()');
});

const _languagePrefsKey = 'app_language';

/// Locale hiện tại của app: ưu tiên field `language` trên Firestore
/// `users/{uid}` (đồng bộ giữa các thiết bị, khớp giá trị webapp ghi ở
/// `/profile`) — fallback về giá trị lưu cục bộ (SharedPreferences) khi
/// chưa đăng nhập hoặc doc Firestore chưa kịp tải xong, để không bị "nháy"
/// về tiếng Việt mỗi lần mở lại app.
final localeProvider = Provider<Locale>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  final userDoc = ref.watch(currentUserDocProvider).valueOrNull;
  final firestoreLanguage = userDoc?['language'] as String?;

  // Cache lại cục bộ mỗi khi Firestore có giá trị mới, để lần mở app tiếp
  // theo (trước khi stream kịp emit) vẫn dùng đúng ngôn ngữ đã chọn.
  if (firestoreLanguage != null &&
      prefs.getString(_languagePrefsKey) != firestoreLanguage) {
    prefs.setString(_languagePrefsKey, firestoreLanguage);
  }

  final language =
      firestoreLanguage ?? prefs.getString(_languagePrefsKey) ?? 'vi';
  return Locale(language == 'en' ? 'en' : 'vi');
});
