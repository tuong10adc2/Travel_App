import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/firebase_providers.dart';
import '../../home/models/place.dart';
import '../../profile/providers/locale_provider.dart';
import '../data/place_translation_repository.dart';

final placeDetailProvider = StreamProvider.family<Place?, String>((ref, placeId) {
  return ref.watch(firestoreProvider).collection('places').doc(placeId).snapshots().map((doc) {
    if (!doc.exists) return null;
    return Place.fromDoc(doc);
  });
});

/// Bản dịch tiếng Anh của địa điểm — chỉ gọi khi app đang ở locale `en`.
/// Trả `null` ở locale `vi` (dùng thẳng dữ liệu gốc) hoặc trong lúc đang tải,
/// để UI tự fallback về tiếng Việt thay vì chờ trắng màn hình.
final placeTranslationProvider = FutureProvider.family<PlaceTranslation?, String>((ref, placeId) async {
  final locale = ref.watch(localeProvider);
  if (locale.languageCode != 'en') return null;
  return ref.watch(placeTranslationRepositoryProvider).translate(placeId);
});
