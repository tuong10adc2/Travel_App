# MIGRATION — Chuyển phần AI/Cloud Functions từ Firebase sang Vercel

> **Lý do**: Cloud Functions (Firebase) bắt buộc phải bật gói Blaze mới deploy được. Đã thử nâng cấp
> Blaze bằng nhiều ngân hàng khác nhau, đều bị từ chối cùng lỗi (`OR_BACR2_31`) — không phải lỗi thẻ
> cụ thể mà có vẻ hồ sơ thanh toán Google đang bị chặn ở tầng khác, tiếp tục đổi ngân hàng khó có khả
> năng thành công. Hướng đi: **chuyển đúng 4 chức năng đang cần Cloud Functions sang Vercel** (Next.js
> API Routes, miễn phí, không cần thẻ) — **giữ nguyên toàn bộ Firestore/Firebase Auth/schema/rules
> hiện có**, vì các phần đó không cần Blaze và đang chạy tốt, không đụng vào.
>
> **Cập nhật 2026-09-12**: Firebase Storage (từng cần cho VR 360°, Giai đoạn 4) cũng không bật được
> vì cùng nguyên nhân Blaze — nhưng khác với AI, không có hướng né tương đương (Vercel không thay
> được chỗ lưu file lớn của Firebase). Thay vì di chuyển Storage sang dịch vụ khác, chủ đồ án quyết
> định bỏ hẳn tính năng VR 360° khỏi đồ án — xem `checklist.md` Giai đoạn 4.

## Việc BẠN cần làm trước (chặn bước deploy cuối)

- [x] Tạo tài khoản Vercel tại https://vercel.com (đăng ký bằng GitHub, không cần thẻ)
- [x] Kết nối repo GitHub `tuong10adc2/Travel_App` với Vercel (import project, root directory
  `webapp/`) — đã deploy thành công lần đầu, domain thật: **https://travel-app-6rww.vercel.app**
  (đã set đủ 7 biến `NEXT_PUBLIC_FIREBASE_*` copy từ `webapp/.env.local`)

## Các bước thực hiện (theo đúng thứ tự)

### 1. Chuẩn bị quyền truy cập Firestore từ Vercel
- [ ] **Đang chờ bạn**: Tải service account key: Firebase Console → project `travelapp-7f140` →
  ⚙️ Project Settings → Service Accounts → "Generate new private key" (file JSON, miễn phí, không
  cần Blaze), rồi dán toàn bộ nội dung file làm giá trị biến `FIREBASE_SERVICE_ACCOUNT_KEY` trên
  Vercel (Settings → Environment Variables) — không commit vào Git, không dán vào chat
- [x] Code đọc biến này đã viết sẵn ở `webapp/src/lib/firebase-admin.ts` (khởi tạo Admin SDK lười —
  lazy, để không làm `next build` fail lúc chưa có biến môi trường cục bộ) + hàm
  `verifyRequestAuth()` verify Firebase ID token từ header `Authorization`

### 2. Port logic chat AI sang Next.js API Route — ĐÃ XONG
- [x] `webapp/src/app/api/chat/route.ts`: verify token, đọc `places` qua Admin SDK, system prompt +
  2 tool `suggest_places`/`plan_itinerary`, agent loop 2 lượt + `thinking` — port 1:1 từ
  `functions/src/index.ts`, giữ nguyên contract JSON trả về (`reply`/`suggestedPlaceIds`/`itineraryPlan`)
- [x] Port `functions/src/itinerary-planner.ts` → `webapp/src/lib/itinerary-planner.ts` nguyên xi

### 3. Port kiểm duyệt review bằng AI — ĐÃ XONG
- [x] `webapp/src/app/api/moderate-review/route.ts`: quét review `aiModeration == null`, gọi Claude
  với `tool_choice` ép buộc `flag_review`, ghi lại `aiModeration`
- [x] `webapp/vercel.json`: Cron gọi route này mỗi 5 phút
- [x] **Phát hiện + sửa 1 bug thật lúc code**: review mới tạo trước giờ không hề ghi field
  `aiModeration` (kể cả rỗng) — Firestore không match được `where('aiModeration', '==', null)` với
  field hoàn toàn vắng mặt, nên cron sẽ không bao giờ quét ra gì cả. Sửa cả `review_repository.dart`
  (Flutter) và `review-section.tsx` (webapp) để luôn ghi tường minh `aiModeration: null` khi tạo/sửa
  review

### 4. Port push notification — ĐÃ XONG
- [x] `webapp/src/app/api/remind-itineraries/route.ts` (port `remindUpcomingItineraries`) + Cron
  chạy 1 lần/ngày lúc 08:00 trong `vercel.json`
- [x] `webapp/src/app/api/notify-new-place/route.ts` (port `notifyNewPlace`, có CORS vì gọi cross-
  origin từ domain admin) — gọi trực tiếp từ **cả 3 chỗ** admin có thể bật `isActive: true`:
  danh sách địa điểm (toggle nhanh), trang sửa, trang tạo mới

### 5. Đổi client gọi API mới thay vì `httpsCallable` — ĐÃ XONG
- [x] Flutter: `chat_repository.dart` đổi sang HTTP POST (`package:http`) tới
  `https://travel-app-6rww.vercel.app/api/chat` + `Authorization: Bearer <idToken>`; gỡ hẳn
  dependency `cloud_functions` khỏi `pubspec.yaml` (không còn nơi nào dùng); sửa `chat_screen.dart`
  bắt `StateError` thay vì `FirebaseFunctionsException`
- [x] Webapp: `chat/page.tsx` đổi sang `fetch('/api/chat', ...)`
- [x] `flutter analyze`, `tsc --noEmit`, `npm run build`, `npm run lint` sạch ở cả 3 project
  (webapp/admin/Flutter) sau toàn bộ thay đổi trên

### 6. Set biến môi trường & deploy — ĐÃ XONG
- [x] Set `ANTHROPIC_API_KEY` (key thật, loại "Workspace scope: Default" — key "Personal"/identity-
  linked ban đầu cần thêm header `anthropic-workspace-id` phức tạp hơn không cần thiết) và
  `FIREBASE_SERVICE_ACCOUNT_KEY` trên Vercel
- [x] Deploy qua Vercel CLI trực tiếp (`vercel --prod`) sau khi phát hiện webhook GitHub → Vercel bị
  lỗi không tự trigger deploy (nguyên nhân không rõ, không phải do cấu hình repo/Root Directory — dùng
  CLI để không phụ thuộc webhook nữa)
- [x] Nạp credit cho tài khoản Anthropic (trước đó ở gói đánh giá $0 credit)

### 7. Test lại toàn bộ — ĐÃ XONG, TẤT CẢ PASS
- [x] Test chat AI thật trên webapp production: hỏi → nhận gợi ý địa điểm dạng card đúng dữ liệu thật
- [x] Test lịch trình thông minh: "lên lịch 2 ngày Hội An + Huế" → đúng thuật toán geo-clustering
  (Huế ngày 1, Hội An ngày 2), model diễn giải bằng lời tự nhiên dựa trên kết quả server tính
- [x] Test kiểm duyệt review: tạo review spam qua Firestore REST API → gọi `/api/moderate-review` →
  `{"processed":1,"flagged":1}`, AI nhận diện đúng
- [x] Test push notification routes: `/api/remind-itineraries` và `/api/notify-new-place` đều
  `200 OK` (chưa test push thật trên thiết bị vì cần dữ liệu itinerary sắp tới ngày khởi hành)
- [x] Build lại APK Flutter, cài trên emulator Android thật (Pixel 6), test chat AI trực tiếp trên
  app — gửi "Gợi ý Đà Lạt" → nhận đúng card địa điểm Đà Lạt trong bong bóng chat

**3 bug thật phát hiện + sửa trong lúc làm bước 6-7** (xem chi tiết trong commit `182d3a9`):
1. `review_repository.dart`/`review-section.tsx` không ghi field `aiModeration` khi tạo review mới
   → Firestore không match được `where('aiModeration', '==', null)` với field vắng mặt hoàn toàn
   → cron kiểm duyệt sẽ không bao giờ quét ra gì — sửa ghi tường minh `aiModeration: null`.
2. `firebase-admin@14` kéo theo `jwks-rsa@4.x` cần `jose@6.x` (ESM-only) → lỗi `ERR_REQUIRE_ESM` khi
   Next.js externalize package này trên Vercel — hạ xuống `firebase-admin@^13.5` (dùng `jwks-rsa@3.x`
   + `jose@4.x`, có bản CJS).
3. Vercel Hobby chỉ cho cron chạy tối đa 1 lần/ngày — cron kiểm duyệt review đổi từ mỗi 5 phút sang
   1 lần/ngày (`0 1 * * *`).

### 8. Dọn dẹp — ĐÃ XONG
- [x] Cập nhật `checklist.md` phản ánh đúng trạng thái mới (Giai đoạn 3 + push notification đánh dấu
  hoàn thành, không còn ghi "chặn bởi Blaze")
- [x] Giữ nguyên `functions/` (không đụng tới) — phòng trường hợp sau này Blaze được bật thì vẫn có
  sẵn bản gốc để quay lại nếu muốn, không mất công viết lại
