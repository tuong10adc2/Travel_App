# MIGRATION — Chuyển phần AI/Cloud Functions từ Firebase sang Vercel

> **Lý do**: Cloud Functions (Firebase) bắt buộc phải bật gói Blaze mới deploy được. Đã thử nâng cấp
> Blaze bằng nhiều ngân hàng khác nhau, đều bị từ chối cùng lỗi (`OR_BACR2_31`) — không phải lỗi thẻ
> cụ thể mà có vẻ hồ sơ thanh toán Google đang bị chặn ở tầng khác, tiếp tục đổi ngân hàng khó có khả
> năng thành công. Hướng đi: **chuyển đúng 4 chức năng đang cần Cloud Functions sang Vercel** (Next.js
> API Routes, miễn phí, không cần thẻ) — **giữ nguyên toàn bộ Firestore/Firebase Auth/schema/rules
> hiện có**, vì các phần đó không cần Blaze và đang chạy tốt, không đụng vào.
>
> **Không giải quyết được bằng cách này**: Firebase Storage (VR 360°, Giai đoạn 4) nhiều khả năng
> cũng yêu cầu Blaze để tạo bucket mới — đây là vấn đề riêng, chưa nằm trong phạm vi file này. Nếu
> muốn né luôn cả phần đó, sẽ cần thêm 1 bước di chuyển Storage sang dịch vụ khác (Supabase Storage /
> Cloudflare R2) — bàn sau nếu cần.

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

### 6. Set biến môi trường & deploy — ĐANG CHỜ BẠN
- [ ] Set trên Vercel dashboard: `ANTHROPIC_API_KEY` (key Claude thật) và
  `FIREBASE_SERVICE_ACCOUNT_KEY` (xem bước 1) — **cần bạn tự làm**, không đưa secret qua chat
- [ ] Redeploy thủ công sau khi thêm biến (Vercel không tự áp dụng env mới vào bản đã deploy trước
  đó — tab Deployments → "..." ở bản mới nhất → Redeploy)
- [ ] Commit + push code (đang chờ, sẽ làm ngay khi bạn xác nhận 2 biến trên đã set xong)

### 7. Test lại toàn bộ — CHƯA LÀM (chặn bởi bước 6)
- [ ] Test chat AI thật: hỏi → nhận gợi ý địa điểm → bấm xem chi tiết (Playwright, cả app + web)
- [ ] Test lịch trình thông minh: "lên lịch 3 ngày ở Sa Pa" → xác nhận đúng thuật toán geo-clustering
- [ ] Test kiểm duyệt review: viết review spam → xác nhận badge "AI: khả nghi" xuất hiện sau tối đa 5 phút
- [ ] Test push notification: cần thiết bị Android thật/emulator có Google Play Services
- [ ] Build lại APK Flutter với `chat_repository.dart` mới, cài lại trên emulator để test

### 8. Dọn dẹp — CHƯA LÀM
- [ ] Cập nhật `checklist.md` phản ánh đúng trạng thái mới (bỏ ghi chú "chặn bởi Blaze", thay bằng
  "đã chuyển sang Vercel")
- [x] Giữ nguyên `functions/` (không đụng tới) — phòng trường hợp sau này Blaze được bật thì vẫn có
  sẵn bản gốc để quay lại nếu muốn, không mất công viết lại
