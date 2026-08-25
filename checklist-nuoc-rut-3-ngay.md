# CHECKLIST NƯỚC RÚT 3 NGÀY — Hoàn thiện sản phẩm + nâng cấp AI

> Nối tiếp `checklist.md` (Giai đoạn 0-8 đã xong). File này gộp: các việc Giai đoạn 9 còn dang dở,
> 2 hướng nâng cấp AI đã thống nhất (nhập địa điểm tự động + lịch trình thông minh theo địa lý),
> và các hạng mục để sản phẩm "đầy đủ hết cỡ" trước khi nộp đồ án.
> Quy ước giống file gốc: làm tới đâu tick `[x]` tới đó, commit riêng theo từng mục lớn.

## Việc BẠN cần làm trước (chặn cả Ngày 1)

Không có bước này thì AI chat + VR 360 không test end-to-end được:

- [ ] Bật gói **Blaze** cho project `travelapp-7f140` + set secret `firebase functions:secrets:set ANTHROPIC_API_KEY`
- [ ] Bật **Firebase Storage** (Console → Storage → Get Started, chọn `asia-southeast1`)
- [ ] (Nếu làm push notification) Bật **Cloud Messaging** trên Firebase Console, chuẩn bị icon app cho notification

Báo lại ngay khi xong 1 trong 2 mục để mình chạy tiếp phần phụ thuộc, không cần chờ đủ cả 2.

---

## NGÀY 1 — Thông mạch phần đang chặn + mở rộng dữ liệu

### 1.1 Hoàn tất Giai đoạn 3 (Trợ lý AI) đang dang dở
- [ ] `firebase deploy --only functions` sau khi có secret
- [ ] Test thật luồng "hỏi AI → nhận gợi ý địa điểm → bấm xem chi tiết" (Playwright, cả app + web)
- [ ] Fix bug phát sinh nếu có (log lỗi Cloud Function qua `firebase functions:log`)

### 1.2 Hoàn tất Giai đoạn 4 (VR 360°) đang dang dở
- [ ] Deploy `storage.rules`, chạy `scripts/seed_vr360/seed.mjs`, khôi phục `firestore.rules` gốc
- [ ] Test thật trên thiết bị/emulator: xoay tay, gyroscope, đổi điểm nhìn qua hotspot
- [ ] Fix bug phát sinh nếu có

### 1.3 Pipeline nhập địa điểm tự động (Hướng AI #1)
> Mục tiêu: từ 8 địa điểm hiện tại lên vài chục, không gõ tay từng field.

- [x] Viết script `scripts/import_places/import.mjs`: đọc `places.json` (đã kèm 20 địa điểm mẫu) → Bước 1 gọi Google Places API (Find Place + Place Details) lấy toạ độ thật (`GeoPoint`), địa chỉ, giờ mở cửa (chuyển sang đúng format `openingHours` trong schema), ảnh — không để AI bịa phần này; Bước 2 gọi Claude (`describe_place` tool, `tool_choice` ép buộc) sinh mô tả + tags (giới hạn đúng danh sách tag hệ thống) + `visitDurationMinutes`; Bước 3 ghi Firestore với `isActive: false`, bỏ qua nếu tên đã tồn tại. Dùng chung pattern tài khoản seed tạm như `scripts/seed_vr360/seed.mjs`. `node --check` sạch.
- [x] Thêm tab lọc trạng thái ("Tất cả / Hoạt động / Chờ duyệt (n)") ở trang Địa điểm admin (`admin/src/app/(dashboard)/places/page.tsx`) — không cần trang riêng vì form sửa (`places/[id]/page.tsx`) đã có sẵn toggle `isActive`.
- [ ] Chạy thử thật với dữ liệu — **cần bạn cung cấp `GOOGLE_PLACES_API_KEY`** (bật "Places API" trong Google Cloud Console, project liên kết với `travelapp-7f140`) + `ANTHROPIC_API_KEY` đã có, rồi tạm nới `firestore.rules` cho `places` giống các lần seed trước (mình sẽ deploy khi bạn báo có key).
- [ ] Test end-to-end: import → hiện đúng tab "Chờ duyệt" → sửa → bật `isActive` → hiện trên app/web

---

## NGÀY 2 — Nâng cấp trí tuệ AI

### 2.1 Giảm độ trễ chat AI
- [x] Bật **prompt caching** cho system prompt (`cache_control: { type: "ephemeral" }` trên block chứa danh sách địa điểm) — `functions/src/index.ts`.
- [ ] Chuyển `chatWithAssistant` sang streaming (SSE qua `onRequest`, hoặc Anthropic streaming API) — **cố ý chưa làm**: đổi từ `httpsCallable` sang streaming yêu cầu đổi cả đường truyền auth (tự quản lý ID token, CORS) trên cả Flutter lẫn webapp, mà không thể deploy/test thật ở đây (chưa có Blaze) — rủi ro phá luồng auth đang chạy tốt cao hơn lợi ích khi chưa test được. Để lại làm sau khi có Blaze, có thể test ngay sau khi đổi.
- [ ] Test: hỏi AI, quan sát chữ hiện dần thay vì đợi cả cục (phụ thuộc mục streaming ở trên)

### 2.2 Lịch trình thông minh theo địa lý (Hướng AI #2)
> LLM chỉ chọn địa điểm theo ngữ cảnh; code lo phần khoảng cách/thứ tự — không để model tự đoán toạ độ.

- [x] Thêm tool `plan_itinerary(placeIds, days)` cho Claude, song song `suggest_places` — `functions/src/index.ts`.
- [x] Viết `functions/src/itinerary-planner.ts`: k-means (seed xác định, không random) gom cụm theo `location` bằng khoảng cách Haversine, rồi nearest-neighbor sắp thứ tự trong từng ngày. (Kiểm tra `openingHours` để tránh giờ đóng cửa — **chưa làm**, ghi chú là việc mở rộng sau vì cần cả logic lên lịch theo khung giờ, không chỉ lọc.)
- [x] Vòng lặp agent thật trong `chatWithAssistant`: khi model gọi `plan_itinerary`, server tính bằng thuật toán rồi gửi `tool_result` lại cho model ở lượt gọi thứ 2 để model diễn giải bằng lời (giữ nguyên block `thinking` theo đúng yêu cầu API khi tiếp tục hội thoại có extended thinking + tool use).
- [x] Nối nút "Tạo lịch trình từ gợi ý này": thêm `ItineraryRepository.createItineraryFromPlan()` (Flutter) + ghi trực tiếp Firestore tương đương (webapp `/chat`), cả 2 hiện thẻ lịch trình theo ngày trong bong bóng chat AI kèm dialog đặt tên/ngày bắt đầu.
- [ ] Test thật: "lên lịch 3 ngày ở Sa Pa" — cần deploy (chặn bởi Blaze), `functions/` build sạch (`npm run build`), Flutter `flutter analyze` sạch, webapp `tsc --noEmit` sạch.

### 2.3 AI tiền duyệt đánh giá
- [x] Cloud Function `moderateReviewOnCreate` (trigger `onDocumentCreated` trên `reviews`): gọi Claude với `tool_choice` ép buộc tool `flag_review`, ghi `aiModeration: { flagged, reason, checkedAt }` — không tự động đổi `status`, admin vẫn quyết định cuối.
- [x] Admin `reviews/page.tsx`: badge "AI: khả nghi" (tooltip = lý do) + tự sắp review bị đánh dấu lên đầu danh sách mỗi tab.
- [ ] Test thật: viết review spam/lạc đề → xác nhận badge xuất hiện (chặn bởi Blaze).

---

## NGÀY 3 — Hoàn thiện sản phẩm & chuẩn bị nộp

### 3.1 Tính năng còn thiếu trong Giai đoạn 9 gốc
- [x] Push notification (FCM) — backend: `notifyNewPlace` (`onDocumentWritten` trên `places`, gửi topic `new_places` khi `isActive` chuyển `false → true`) + `remindUpcomingItineraries` (`onSchedule`, chạy 08:00 mỗi ngày, quét `itineraries.startDate` trong 24-48h tới, gửi trực tiếp theo `fcmToken` từng user) — `functions/src/index.ts`.
- [x] Push notification (FCM) — Flutter: thêm package `firebase_messaging`, `PushNotificationService` (`lib/core/services/push_notification_service.dart`) xin quyền + subscribe topic `new_places` + lưu/refresh `fcmToken` vào `users/{uid}`, khởi tạo ở `HomeScreen.initState()`. Thêm quyền `POST_NOTIFICATIONS` vào `AndroidManifest.xml`. `flutter analyze` sạch.
- [ ] Push notification — **cần bạn**: bật Cloud Messaging trên Firebase Console + test thật trên thiết bị Android (không giả lập được ở đây — cần thiết bị thật/emulator có Google Play Services và app đã cài).
- [ ] Đa ngôn ngữ Việt/Anh — **chưa làm, để lại nguyên vẹn cho đợt sau**: đây là thay đổi diện rộng (rút hầu hết chuỗi text hard-code tiếng Việt ra file dịch, xuyên suốt cả 3 app) — làm dở dang sẽ để lại UI lẫn lộn 2 ngôn ngữ nửa vời, rủi ro cao hơn giá trị demo trong khi các mục AI ở 2.x tạo khác biệt kỹ thuật rõ hơn cho báo cáo. Field `language` trên `users` đã có sẵn trong schema, sẵn sàng khi làm.

### 3.2 Rà soát & tối ưu
- [ ] Test hồi quy toàn bộ luồng chính (App + Web + Admin) sau các thay đổi Ngày 1-2
- [ ] Tối ưu hiệu năng: cache ảnh (`cached_network_image` nếu chưa có ở Flutter, Next.js `<Image>` đã tự tối ưu), kiểm tra thời gian tải trang Khám phá/Trang chủ

### 3.3 Đóng gói & tài liệu nộp đồ án
- [ ] Build release: APK/AAB cho app, deploy `webapp/` + `admin/` lên Firebase Hosting/Vercel
- [ ] Viết báo cáo đồ án (kiến trúc hệ thống, luồng AI — nên nhấn mạnh phần function calling + streaming + geo-planning vừa làm vì đây là điểm khác biệt kỹ thuật rõ nhất)
- [ ] Chuẩn bị slide bảo vệ
- [ ] Quay video demo dự phòng (ưu tiên quay luồng Chat AI → gợi ý lịch trình theo địa lý, vì đây là phần dễ mất mạng/lỗi demo trực tiếp nhất)

---

## Ghi chú ưu tiên nếu hết giờ

Nếu 3 ngày không đủ cho tất cả, thứ tự bỏ bớt (từ ít quan trọng nhất trở lên) là: 2.3 (AI tiền duyệt) → 3.1 đa ngôn ngữ → 3.1 push notification → 2.1 prompt caching (giữ streaming, bỏ caching cũng được). **Không bỏ**: 1.1/1.2 (đang chặn, phải xong để demo được), 2.2 (lịch trình thông minh — đây là điểm nhấn kỹ thuật chính của đợt nâng cấp này), báo cáo/slide/video (bắt buộc để nộp).

## Trạng thái sau phiên làm việc này

Đã làm hết toàn bộ phần **code** không cần bạn bật Blaze/Storage/cấp API key/test trên thiết bị thật: pipeline nhập địa điểm (1.3), prompt caching (2.1), tool `plan_itinerary` + thuật toán gom cụm địa lý + vòng lặp agent thật + UI tạo lịch trình từ gợi ý (2.2), AI tiền duyệt review (2.3), backend + code Flutter cho push notification (3.1). Tất cả đã build/analyze sạch (`tsc --noEmit`, `npm run build`, `flutter analyze`) nhưng **chưa deploy/test thật** vì cần Blaze.

Còn lại, theo đúng lý do đã ghi ở từng mục — không phải bỏ sót mà là quyết định có chủ đích:
- **Streaming chat (2.1)**: rủi ro đổi kiến trúc auth mà không test được cao hơn lợi ích.
- **Đa ngôn ngữ (3.1)**: khối lượng quá lớn để làm dở dang an toàn, để nguyên cho đợt riêng.
- **Mọi việc cần Blaze/Storage/API key/thiết bị thật/report-slide-video**: nằm ngoài khả năng thực hiện trực tiếp — cần bạn hành động hoặc làm cùng.

Bước tiếp theo hợp lý nhất: bạn bật Blaze + set 2 secret (`ANTHROPIC_API_KEY`, và cấp `GOOGLE_PLACES_API_KEY` nếu muốn chạy thử pipeline nhập địa điểm), báo lại để deploy và test thật toàn bộ những gì vừa code ở trên.
