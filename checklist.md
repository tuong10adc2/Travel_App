# CHECKLIST ĐỒ ÁN TỐT NGHIỆP
## Trợ lý du lịch AI — App (Flutter) + Web (Next.js) + Admin Dashboard (Next.js)
 
> Backend dùng chung: Firebase (Cloud Firestore + Authentication + Storage + Cloud Functions)
> Cách dùng: làm tới đâu tick `[x]` tới đó, không nhảy cóc giai đoạn.
 
---
 
## GIAI ĐOẠN 0 — Chuẩn bị & khung project
 
- [x] Tạo tài khoản/project Firebase mới (Firebase Console)
- [x] Tạo Flutter project (`flutter create`)
- [x] Setup cấu trúc thư mục theo feature (`lib/features/...`, `lib/core/...`) — đã có sẵn khung cho auth, home, chat, itinerary, place_detail, profile, review, saved, settings, vr360
- [x] Cài `flutterfire_cli`, chạy `flutterfire configure` để sinh `firebase_options.dart` — project `travelapp-7f140`, đã cấu hình android + ios + web
- [x] Cài package chính: `firebase_core`, `firebase_auth`, `cloud_firestore`, `firebase_storage`, `go_router`, state management (Riverpod hoặc Bloc) — đã thêm vào `pubspec.yaml` (kèm `google_sign_in`, `flutter_dotenv`)
- [x] Setup theme (màu, font, spacing dùng chung) — `lib/core/theme/app_theme.dart`
- [x] Kết nối Flutter app với Firebase (test connection thành công) — đã bật `Firebase.initializeApp()` trong `main.dart`, `flutter build web` chạy sạch không lỗi
- [x] Khởi tạo Git repo, commit lần đầu — commit `42fdd95`

> Đã làm thêm (chưa thuộc giai đoạn 0 nhưng dựng khung sẵn): `app_router.dart` (go_router) với 2 route `/` (Splash) và `/home`, `SplashScreen` và `HomeScreen` mới là UI placeholder tĩnh, chưa có logic/dữ liệu thật.
## GIAI ĐOẠN 1 — Database & Auth
 
- [ ] Từ file ERD, thiết kế collection Firestore: `users`, `places`, `media_360`, `tours`, `itineraries` (với sub-collection `itinerary_items`), `reviews`, `saved_places`, `chat_history`
- [ ] Viết Firestore Security Rules cơ bản cho từng collection (đọc/ghi theo `request.auth.uid`, role admin)
- [ ] Setup Firebase Authentication (Email/password)
- [ ] Setup đăng nhập Google (OAuth) qua Firebase Auth
- [ ] Màn hình Splash
- [ ] Màn hình Đăng ký
- [ ] Màn hình Đăng nhập
- [ ] Màn hình Quên mật khẩu
- [ ] Màn hình Hồ sơ cá nhân (xem/sửa thông tin)
- [ ] Test luồng đăng ký → đăng nhập → đăng xuất hoàn chỉnh
## GIAI ĐOẠN 2 — Trang chủ & Khám phá
 
- [ ] Seed dữ liệu mẫu cho collection `places` (5-10 địa điểm)
- [ ] Màn Trang chủ: danh sách địa điểm dạng card (ảnh, tên, rating, thời gian)
- [ ] Chức năng tìm kiếm địa điểm theo tên
- [ ] Chức năng lọc theo tag (Lịch sử / Thiên nhiên / Ẩm thực...)
- [ ] Màn Chi tiết địa điểm (ảnh, mô tả, rating, giờ mở cửa)
- [ ] Nối API thật (bỏ mock data)
- [ ] Test luồng: mở app → xem trang chủ → tìm kiếm → xem chi tiết
## GIAI ĐOẠN 3 — Trợ lý AI (Chat)
 
- [ ] Viết Cloud Function (Firebase Functions, callable hoặc HTTPS) gọi Claude API (giấu API key bằng `firebase functions:secrets:set`, không gọi từ client)
- [ ] Thiết kế system prompt cho trợ lý du lịch
- [ ] Lưu lịch sử chat vào collection `chat_history` (sub-collection theo `userId`)
- [ ] Màn hình Chat (UI hội thoại)
- [ ] AI trả về gợi ý địa điểm dạng card (không chỉ text thuần)
- [ ] Test: hỏi AI về địa điểm → nhận gợi ý → bấm vào xem chi tiết
## GIAI ĐOẠN 4 — VR 360°
 
- [ ] Chuẩn bị ảnh 360° (equirectangular, tỷ lệ 2:1) cho 3-5 địa điểm demo
- [ ] Upload ảnh lên Firebase Storage, tạo document trong collection `media_360`
- [ ] Cài package `panorama`
- [ ] Màn `Vr360ViewerScreen`: render ảnh 360°, xoay bằng tay (gesture)
- [ ] Bật xoay theo gyroscope (`SensorControl.Orientation`)
- [ ] Thêm loading/skeleton khi ảnh đang tải
- [ ] Nối nút "Trải nghiệm ngay" từ màn Chi tiết địa điểm → mở VR viewer với dữ liệu thật
- [ ] (Tuỳ chọn) Thêm hotspot liên kết nhiều điểm nhìn trong cùng địa điểm
- [ ] Test trên thiết bị thật (Android + iOS nếu có)
## GIAI ĐOẠN 5 — Lịch trình & tương tác
 
- [ ] Màn tạo lịch trình mới (chọn ngày bắt đầu, đặt tên)
- [ ] Thêm địa điểm vào lịch trình theo ngày
- [ ] Sắp xếp lại thứ tự điểm đến (kéo-thả)
- [ ] Xoá địa điểm khỏi lịch trình
- [ ] Chức năng Lưu/Yêu thích địa điểm
- [ ] Chức năng viết đánh giá (rating + comment)
- [ ] Hiển thị danh sách đánh giá ở màn Chi tiết địa điểm
- [ ] Test toàn bộ luồng: tạo lịch trình → thêm điểm → sắp xếp → lưu
## GIAI ĐOẠN 6 — Admin Dashboard (Next.js)
 
- [ ] Tạo project Next.js riêng cho Admin
- [ ] Setup Auth riêng cho admin (kiểm tra custom claim hoặc field `role` trong document `users`, dùng Firebase Admin SDK trong Next.js)
- [ ] Trang quản lý người dùng (danh sách, khoá/mở tài khoản)
- [ ] Trang CRUD địa điểm/tour (thêm/sửa/xoá, upload ảnh)
- [ ] Trang upload & gắn ảnh 360° vào địa điểm
- [ ] Trang duyệt/ẩn/xoá đánh giá
- [ ] Trang chọn nội dung nổi bật hiển thị trang chủ app
- [ ] Trang thống kê cơ bản (số user mới, lượt xem, địa điểm hot)
- [ ] Test luồng: đăng nhập admin → thêm địa điểm mới → kiểm tra hiện trên app
## GIAI ĐOẠN 7 — Web (Next.js)
 
- [ ] Tạo project Next.js cho Web người dùng
- [ ] Landing page giới thiệu (theo tham khảo VietGuide AI)
- [ ] Trang Khám phá (list + tìm kiếm + filter) — tái dùng API đã có
- [ ] Trang Chi tiết địa điểm
- [ ] Trang Chat AI
- [ ] Trang VR 360° (dùng thư viện panorama viewer cho web, ví dụ Pannellum hoặc Three.js)
- [ ] Trang Lịch trình
- [ ] Responsive kiểm tra trên mobile/tablet/desktop
- [ ] Test đăng nhập/đăng ký trên web hoạt động đúng, dùng chung tài khoản với app
## GIAI ĐOẠN 8 — Hoàn thiện & nộp đồ án
 
- [ ] Push notification (FCM) cho các sự kiện: gợi ý mới, nhắc lịch trình
- [ ] Đa ngôn ngữ (ít nhất Việt + Anh)
- [ ] Rà soát và fix bug toàn bộ luồng chính (App + Web + Admin)
- [ ] Tối ưu hiệu năng (cache ảnh, giảm thời gian tải)
- [ ] Viết báo cáo đồ án (mô tả kiến trúc, chức năng, công nghệ dùng)
- [ ] Chuẩn bị slide bảo vệ đồ án
- [ ] Quay video demo dự phòng (phòng khi demo trực tiếp lỗi mạng/thiết bị)
- [ ] Đóng gói/build bản release (APK/AAB cho app, deploy web + admin lên hosting)
---
 
## Ghi chú
- Sau mỗi giai đoạn: **commit Git riêng**, đặt tên rõ ràng (vd: `feat: hoan thanh giai doan 2 - trang chu`)
- Nếu thiếu thời gian: có thể bỏ Giai đoạn 4 (VR 360°) và phần Push notification ở Giai đoạn 8 để rút gọn — vẫn đủ chức năng cốt lõi cho 1 đồ án hoàn chỉnh
- Luôn tự chạy thử app thật sau khi vibe code xong mỗi mục, không chỉ tin AI báo "xong"