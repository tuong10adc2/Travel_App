import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import '../../../core/providers/firebase_providers.dart';

/// Domain webapp (Vercel) — cùng nơi host `/api/chat`.
const _apiBaseUrl = 'https://travel-app-6rww.vercel.app';

/// Bản dịch tiếng Anh cho các trường tự do (không phải chuỗi UI tĩnh, không
/// phải tag cố định) của 1 địa điểm — do `/api/translate-place` trả về, đã
/// được cache sẵn trong Firestore (`places/{id}.translations.en`) từ lượt
/// dịch đầu tiên, các lượt sau chỉ đọc lại, không gọi AI nữa.
class PlaceTranslation {
  const PlaceTranslation({
    required this.description,
    required this.highlights,
    required this.foodToTry,
  });

  final String description;
  final List<String> highlights;
  final List<String> foodToTry;
}

final placeTranslationRepositoryProvider = Provider<PlaceTranslationRepository>((ref) {
  return PlaceTranslationRepository(firebaseAuth: ref.watch(firebaseAuthProvider));
});

class PlaceTranslationRepository {
  PlaceTranslationRepository({required FirebaseAuth firebaseAuth}) : _firebaseAuth = firebaseAuth;

  final FirebaseAuth _firebaseAuth;

  Future<PlaceTranslation> translate(String placeId) async {
    final user = _firebaseAuth.currentUser;
    if (user == null) throw StateError('Chưa đăng nhập');

    final idToken = await user.getIdToken();
    final response = await http
        .post(
          Uri.parse('$_apiBaseUrl/api/translate-place'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $idToken',
          },
          body: jsonEncode({'placeId': placeId}),
        )
        .timeout(const Duration(seconds: 30));

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode != 200) {
      throw StateError((data['error'] as String?) ?? 'Đã có lỗi khi dịch địa điểm.');
    }

    return PlaceTranslation(
      description: (data['description'] as String?) ?? '',
      highlights: List<String>.from(data['highlights'] as List? ?? const []),
      foodToTry: List<String>.from(data['foodToTry'] as List? ?? const []),
    );
  }
}
