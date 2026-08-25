import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/firebase_providers.dart';

final pushNotificationServiceProvider = Provider<PushNotificationService>((ref) {
  return PushNotificationService(
    firestore: ref.watch(firestoreProvider),
    firebaseAuth: ref.watch(firebaseAuthProvider),
  );
});

/// Đăng ký thiết bị nhận push notification (FCM) cho 2 loại sự kiện ở Giai đoạn 9:
/// gợi ý địa điểm mới (topic `new_places`, xem Cloud Function `notifyNewPlace`) và nhắc
/// lịch trình sắp tới (gửi trực tiếp tới token đã lưu, xem Cloud Function
/// `remindUpcomingItineraries`). Chỉ gọi [init] sau khi user đã đăng nhập.
class PushNotificationService {
  PushNotificationService({required FirebaseFirestore firestore, required FirebaseAuth firebaseAuth})
      : _firestore = firestore,
        _firebaseAuth = firebaseAuth;

  final FirebaseFirestore _firestore;
  final FirebaseAuth _firebaseAuth;
  bool _initialized = false;

  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;

    final messaging = FirebaseMessaging.instance;
    try {
      await messaging.requestPermission(alert: true, badge: true, sound: true);
      await messaging.subscribeToTopic('new_places');

      final token = await messaging.getToken();
      if (token != null) await _saveToken(token);
      messaging.onTokenRefresh.listen(_saveToken);
    } catch (e) {
      // Không chặn luồng app nếu thiết bị/emulator không hỗ trợ push (vd emulator không có
      // Google Play Services, hoặc chạy trên web chưa cấu hình VAPID key).
      debugPrint('PushNotificationService: không đăng ký được FCM ($e)');
    }
  }

  Future<void> _saveToken(String token) async {
    final uid = _firebaseAuth.currentUser?.uid;
    if (uid == null) return;
    await _firestore.collection('users').doc(uid).set(
      {
        'fcmToken': token,
        'updatedAt': FieldValue.serverTimestamp(),
      },
      SetOptions(merge: true),
    );
  }
}
