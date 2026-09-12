# CHECKLIST ĐỒ ÁN TỐT NGHIỆP
## Trợ lý du lịch AI — App (Flutter) + Web (Next.js) + Admin Dashboard (Next.js)
 
> Backend dùng chung: Firebase (Cloud Firestore + Authentication + Storage + Cloud Functions)
> Cách dùng: làm tới đâu tick `[x]` tới đó, không nhảy cóc giai đoạn.
 
---
 
## GIAI ĐOẠN 0 — Chuẩn bị & khung project
 
- [x] Tạo tài khoản/project Firebase mới (Firebase Console)
- [x] Tạo Flutter project (`flutter create`)
- [x] Setup cấu trúc thư mục theo feature (`lib/features/...`, `lib/core/...`) — đã có sẵn khung cho auth, home, chat, itinerary, place_detail, profile, review, saved, settings
- [x] Cài `flutterfire_cli`, chạy `flutterfire configure` để sinh `firebase_options.dart` — project `travelapp-7f140`, đã cấu hình android + ios + web
- [x] Cài package chính: `firebase_core`, `firebase_auth`, `cloud_firestore`, `firebase_storage`, `go_router`, state management (Riverpod hoặc Bloc) — đã thêm vào `pubspec.yaml` (kèm `google_sign_in`, `flutter_dotenv`)
- [x] Setup theme (màu, font, spacing dùng chung) — `lib/core/theme/app_theme.dart`
- [x] Kết nối Flutter app với Firebase (test connection thành công) — đã bật `Firebase.initializeApp()` trong `main.dart`, `flutter build web` chạy sạch không lỗi
- [x] Khởi tạo Git repo, commit lần đầu — commit `42fdd95`

> Đã làm thêm (chưa thuộc giai đoạn 0 nhưng dựng khung sẵn): `app_router.dart` (go_router) với 2 route `/` (Splash) và `/home`, `SplashScreen` và `HomeScreen` mới là UI placeholder tĩnh, chưa có logic/dữ liệu thật.
## GIAI ĐOẠN 1 — Database & Auth
 
- [x] Từ file ERD, thiết kế collection Firestore: `users`, `places`, `tours`, `itineraries` (với sub-collection `itinerary_items`), `reviews`, `saved_places`, `chat_history` — xem `docs/erd-database.mermaid` và `docs/firestore-schema.md`
- [x] Viết Firestore Security Rules cơ bản cho từng collection (đọc/ghi theo `request.auth.uid`, role admin) — `firestore.rules` (đã validate compile thành công), index đề xuất tại `firestore.indexes.json`
- [x] Setup Firebase Authentication (Email/password) — code: `lib/features/auth/data/auth_repository.dart` (+ `firebase_providers.dart`, `auth_exception.dart`); provider Email/Password đã bật trên Firebase Console (xác nhận bằng screenshot)
- [x] Setup đăng nhập Google (OAuth) qua Firebase Auth (Android — dự án chỉ target Android, bỏ iOS/Web) — code `AuthRepository.signInWithGoogle()` đã xong; provider Google đã bật trên Console; đã tạo debug keystore + đăng ký SHA-1 debug (`CB:6C:C8:49:84:4B:85:C6:CC:98:86:CA:BC:81:BA:46:23:C4:61:5F`) qua `firebase apps:android:sha:create`, tải lại `android/app/google-services.json` (đã có `oauth_client`)
**Còn thiếu**: cài app lên thiết bị/emulator thật và bấm nút đăng nhập Google để test luồng thật (chưa test tương tác UI, chỉ xác nhận build+config đúng)
- [x] Màn hình Splash — `splash_screen.dart`, chỉ hiển thị loading; điều hướng thật xử lý ở `app_router.dart` (redirect theo `authStateChangesProvider`)
- [x] Màn hình Đăng ký — `register_screen.dart` (họ tên, email, mật khẩu, xác nhận mật khẩu) → gọi `AuthRepository.signUpWithEmail`
- [x] Màn hình Đăng nhập — `login_screen.dart` (email/mật khẩu + nút Google) → gọi `signInWithEmail` / `signInWithGoogle`
- [x] Màn hình Quên mật khẩu — `forgot_password_screen.dart` → gọi `sendPasswordResetEmail`
- [x] Màn hình Hồ sơ cá nhân (xem/sửa thông tin) — `profile_screen.dart` đọc realtime từ `users/{uid}` qua `currentUserDocProvider`; sửa họ tên/số điện thoại → `AuthRepository.updateProfile()` (cập nhật cả `FirebaseAuth.displayName` và Firestore); nút đăng xuất chuyển từ Home vào đây; route `/profile`, vào từ icon trên AppBar Home
- [x] Test luồng đăng ký → đăng nhập → đăng xuất hoàn chỉnh — chạy app thật (`flutter run -d web-server`) + script Playwright tự động bấm UI thật, nối Firebase project thật (`travelapp-7f140`), không mock: Đăng ký → tự đăng nhập → vào Home → mở Profile xác nhận `displayName` đọc đúng từ Firestore (ảnh chụp) → Đăng xuất → Đăng nhập lại đúng tài khoản → Đăng xuất lần 2. Không còn lỗi console. **Phát hiện + đã sửa bug thật**: `firestore.rules` viết từ Giai đoạn 1 chưa từng được deploy lên project thật (chỉ mới `--dry-run`) → gây `permission-denied` khi đọc/ghi `users/{uid}`; đã `firebase deploy --only firestore:rules,firestore:indexes` (đã sửa luôn 1 index sai — single-field index cho `itinerary_items.placeId` không hợp lệ trong composite indexes, Firestore tự tạo single-field index nên bỏ luôn). **Lưu ý**: còn vài tài khoản test (`qa.test.*@travelai-test.local`) tạo ra trong lúc test, có thể xoá trong Firebase Console > Authentication nếu muốn dọn sạch; test bằng browser (web-server) nên vẫn chưa test tay trên emulator/thiết bị Android thật

> **Cập nhật 2026-09-12 — Chuyển hẳn sang chỉ đăng nhập Google (bỏ email/password)**: theo
> yêu cầu chỉ dùng Gmail thật, đã gỡ toàn bộ luồng email/password khỏi cả 3 client.
> - **Flutter**: xoá `register_screen.dart`/`forgot_password_screen.dart`, `login_screen.dart` giờ chỉ còn
>   nút "Đăng nhập với Google"; `AuthRepository` bỏ `signUpWithEmail`/`signInWithEmail`/
>   `sendPasswordResetEmail`, giữ nguyên `signInWithGoogle()` (đã có sẵn từ trước).
> - **Webapp**: xoá `/register`, `/forgot-password`; `/login` viết lại dùng
>   `signInWithPopup(auth, new GoogleAuthProvider())`; thêm `lib/ensure-user-doc.ts` để tự tạo
>   `users/{uid}` (role mặc định `user`) ở lần đăng nhập Google đầu tiên — thay cho việc màn Đăng ký cũ
>   làm việc này.
> - **Admin**: `/login` cũng đổi sang Google-only + `ensure-user-doc.ts` tương tự webapp. **Lưu ý quan
>   trọng**: vì admin trước giờ gán quyền (`role: admin/content_editor/support`) thủ công theo UID của
>   tài khoản email/password cũ, nên UID sẽ đổi khi đăng nhập lại bằng Google — sau khi 1 nhân viên đăng
>   nhập Google lần đầu (sẽ thấy "không có quyền truy cập" vì role mặc định là `user`), cần vào Firestore
>   Console sửa field `role` của đúng document `users/{uid mới}` đó thành quyền phù hợp.
> - Build/lint/analyze sạch cả 3 project sau khi sửa; đã test trực tiếp trên production
>   (`travel-app-6rww.vercel.app/login` chỉ còn nút Google, không còn form email/password).

## GIAI ĐOẠN 2 — Trang chủ & Khám phá
 
- [x] Seed dữ liệu mẫu cho collection `places` (5-10 địa điểm) — đã tạo 8 địa điểm thật (Vịnh Hạ Long, Hội An, Đà Lạt, Sa Pa, Phú Quốc, Huế, Tràng An, Phong Nha) qua script Node + Firebase SDK, ký bằng tài khoản test; `images`/`coverImage` để trống (chưa có ảnh thật, sẽ nối ở bước "Nối API thật"); đã tạm nới rule `places` để seed rồi deploy lại rule gốc (isContentEditor()-only) ngay sau
- [x] Màn Trang chủ: danh sách địa điểm dạng card (ảnh, tên, rating, thời gian) — `home_screen.dart` + `place_card.dart`, layout dạng grid 2 cột theo phong cách tham khảo (search bar, banner gradient, chip lọc tag, bottom nav 6 tab — chỉ Khám phá + Hồ sơ hoạt động, còn lại hiện "đang phát triển"), đọc realtime từ `placesProvider` (Firestore, sort client-side isFeatured trước). Đã test trên máy ảo Android thật (đăng ký tài khoản mới → vào Home → hiện đúng 8 địa điểm đã seed)
- [x] Chức năng tìm kiếm địa điểm theo tên — `placeSearchQueryProvider`, filter substring không phân biệt hoa/thường (client-side); đã test trên emulator (gõ "Sa" → lọc đúng "Sa Pa"). **Hạn chế đã biết**: chưa bỏ dấu tiếng Việt khi so khớp (gõ không dấu sẽ không ra kết quả có dấu)
- [x] Chức năng lọc theo tag (Lịch sử / Thiên nhiên / Ẩm thực...) — `selectedTagProvider` + `ChoiceChip`, kết hợp được với tìm kiếm cùng lúc; đã test trên emulator
- [x] Màn Chi tiết địa điểm (ảnh, mô tả, rating, giờ mở cửa) — `place_detail_screen.dart`: ảnh cover (SliverAppBar), tên, rating trung bình + số lượt đánh giá, tags, địa chỉ, thời gian tham quan, giá vé, giờ mở cửa (rút gọn nếu cả tuần giống nhau), mô tả, bản đồ vị trí (xem ghi chú 2026-09-12 bên dưới). **Làm sớm luôn phần đánh giá theo sao + bình luận** (đúng ra thuộc Giai đoạn 5, gộp vào đây theo yêu cầu): `review_form.dart` (chọn sao + viết bình luận, 1 review/user/địa điểm, sửa được), `review_list_item.dart` (hiển thị review đã duyệt + review pending của chính mình kèm nhãn "Đang chờ duyệt"). Đã test thật trên máy ảo Android: bấm địa điểm → xem đủ thông tin → chọn 5 sao + viết bình luận → gửi → xác nhận trực tiếp trong Firestore đúng dữ liệu (rating, comment, status: pending). **Phát hiện + sửa 2 bug rule Firestore thật khi test**: (1) list-query `reviews` bị permission-denied vì Firestore chặn tĩnh cả query nếu rule có nhánh `||` không đảm bảo được cho mọi doc — sửa bằng cách tách 2 query equality-only (status=='approved' và userId==uid) rồi merge ở client; (2) `docRef.get()` để check review đã tồn tại chưa (trước khi tạo mới) bị permission-denied vì rule truy cập `resource.data` trên document chưa tồn tại (`resource == null`) — sửa rule thêm `resource == null ||` ở đầu điều kiện đọc
- [x] Nối API thật (bỏ mock data) — đã dùng Firestore thật từ đầu (không có mock); ảnh: `place_image_placeholder.dart` — gradient theo theme (teal/cam) + icon theo tag khi `coverImage` trống, thay ảnh thật tự động ngay khi field có URL. **Còn thiếu**: bạn sẽ up ảnh thật sau, lúc đó cần cập nhật field `coverImage`/`images` cho từng document `places`
- [x] Test luồng: mở app → xem trang chủ → tìm kiếm → xem chi tiết — chạy app thật (`flutter run -d web-server`) + script Playwright tự động bấm UI thật, nối Firebase project thật (`travelapp-7f140`), không mock: đăng ký tài khoản test mới → tự động đăng nhập → vào Trang chủ (hiện đúng dữ liệu Firestore thật: card Phố cổ Hội An, Vịnh Hạ Long, Đà Lạt, Kinh thành Huế...) → gõ "Sa" vào ô tìm kiếm → lọc đúng còn 1 kết quả "Sa Pa" → bấm vào card → sang đúng màn Chi tiết địa điểm hiển thị đủ tên, rating, tag, địa chỉ, giờ mở cửa, mô tả, khung viết đánh giá. Không có lỗi console/page liên quan tới app (chỉ có 1 cảnh báo benign của trình duyệt về VideoFrame GC, không phải bug). **Lưu ý**: test qua trình duyệt (web-server), chưa test tay trên emulator/thiết bị Android thật cho riêng luồng tổng hợp này (từng bước riêng lẻ đã test trên emulator ở các mục phía trên)

> **Cập nhật 2026-09-12 — Thêm bản đồ vị trí cho địa điểm**: dùng Google Maps Embed qua URL tĩnh
> `https://maps.google.com/maps?q=<lat>,<lng>&z=15&output=embed` — **không cần API key/billing**
> (khác Google Maps SDK/JS API thật, tránh vì dự án từng gặp khó với billing Google).
> - **Flutter**: thêm package `webview_flutter`, model `Place` bổ sung `latitude`/`longitude` (đọc từ
>   field `location` GeoPoint sẵn có), widget mới `PlaceMapView` nhúng WebView hiển thị bản đồ trong
>   `place_detail_screen.dart` (chỉ hiện khi địa điểm có toạ độ).
> - **Webapp**: `/places/[id]` thêm khối "Vị trí trên bản đồ" bằng `<iframe>` trỏ tới cùng URL embed
>   (dùng `place.location` đã có sẵn trong schema, không cần đổi Firestore).
> - Đã build/analyze sạch, test thật trên production webapp (Đà Lạt hiện đúng bản đồ với pin vị trí).
> - **Chưa làm cho Admin**: form CRUD địa điểm đã có ô nhập toạ độ nhưng chưa có preview bản đồ —
>   không nằm trong phạm vi yêu cầu lần này (chỉ 2 trang người dùng cuối xem địa điểm), có thể làm sau.

> **Cập nhật 2026-09-12 — Thêm "Đặc điểm nổi bật" + "Món ăn nên thử" cho từng địa điểm**: 2 field mới
> trên `places`: `highlights` và `foodToTry` (đều `array<string>`, mỗi phần tử 1 dòng hiển thị).
> - **Admin**: `place-form.tsx` thêm 2 ô textarea (mỗi dòng = 1 mục), dùng chung cho tạo/sửa.
> - **Flutter & Webapp**: 2 khối mới trên màn/trang Chi tiết địa điểm, đặt sau phần Giới thiệu, trước
>   Giờ mở cửa — chỉ hiện khi có dữ liệu.
> - **Nội dung cho 18 địa điểm hiện có**: sinh bằng Claude (`tool_choice` ép buộc tool
>   `set_place_content`), yêu cầu chỉ dùng kiến thức thật đã biết về địa điểm, phần món ăn **chỉ nêu
>   tên món, không nêu tên quán cụ thể** (tránh sai lệch/lỗi thời) — đã kiểm tra chất lượng nội dung
>   sinh ra, chính xác và tự nhiên. Script sinh nội dung chỉ chạy 1 lần qua route API tạm (đã xoá sau
>   khi dùng xong, không nằm trong code base).
> - Build/analyze/lint sạch cả 3 project, đã deploy + test thật trên production webapp (Vịnh Hạ Long
>   hiện đúng 4 đặc điểm nổi bật + 4 món ăn nên thử).

## GIAI ĐOẠN 3 — Trợ lý AI (Chat)
 
- [x] Viết Cloud Function (Firebase Functions, callable hoặc HTTPS) gọi Claude API (giấu API key bằng `firebase functions:secrets:set`, không gọi từ client) — tạo project `functions/` (TypeScript, Firebase Functions v2 + `firebase-admin` + `@anthropic-ai/sdk`), khai báo secret `ANTHROPIC_API_KEY` bằng `defineSecret` (không hardcode key). Callable function `chatWithAssistant` (`functions/src/index.ts`): bắt buộc `request.auth`, nhận `{ message, history? }`, validate độ dài + giới hạn 20 lượt sử history gần nhất, trả về `{ reply, suggestedPlaceIds }`. `npx tsc --noEmit` + `npm run build` sạch.
- [x] Thiết kế system prompt cho trợ lý du lịch — `buildSystemPrompt()` trong `functions/src/index.ts`: định nghĩa vai trò, chỉ tư vấn chủ đề du lịch (từ chối lịch sự nếu lạc đề), luôn nhét kèm danh sách địa điểm thật hiện có (id, tên, tags, mô tả ngắn — lấy trực tiếp từ Firestore `places` mỗi lần gọi nên luôn khớp dữ liệu thật) để model chỉ được gợi ý đúng địa điểm có trong hệ thống, không bịa
- [x] Lưu lịch sử chat vào collection `chat_history` (sub-collection theo `userId`) — `lib/features/chat/data/chat_repository.dart`: đơn giản hoá dùng 1 phiên cố định `users/{uid}/chat_history/default/messages/{messageId}` (đúng theo `docs/firestore-schema.md`, rule đã có sẵn từ Giai đoạn 1), ghi cả tin nhắn user lẫn assistant, tự đặt `title` phiên ở tin đầu tiên
- [x] Màn hình Chat (UI hội thoại) — `chat_screen.dart`: bong bóng chat trái/phải, ô nhập + nút gửi, chỉ báo "đang gõ" khi chờ AI trả lời, tự cuộn xuống tin mới, empty state khi chưa có hội thoại; nối tab "Trợ lý" trên bottom nav (trước đó "đang phát triển")
- [x] AI trả về gợi ý địa điểm dạng card (không chỉ text thuần) — dùng **tool use** của Claude: tool `suggest_places(placeIds: string[])`, model tự quyết định gọi khi muốn giới thiệu địa điểm cụ thể thay vì liệt kê tên suông trong văn bản; server lọc lại `placeIds` theo đúng danh sách địa điểm thật (chặn model "bịa" id) rồi trả về client; `chat_message_bubble.dart` render `suggestedPlaceIds` thành dải `PlaceCard` cuộn ngang ngay dưới tin nhắn, bấm vào điều hướng sang `/place/:id` (tái dùng nguyên `PlaceCard` + `placesByIdProvider` đã có từ Giai đoạn 5/6, không thêm code hiển thị mới)
- [x] Test: hỏi AI về địa điểm → nhận gợi ý → bấm vào xem chi tiết — **Blaze không bật được** (Google từ chối thanh toán nhiều ngân hàng khác nhau, lỗi hồ sơ chứ không phải thẻ) nên đã chuyển toàn bộ logic từ Cloud Function sang Next.js API Route trong `webapp/` (deploy Vercel, miễn phí, không cần Blaze) — xem `migration-vercel-ai.md`. Đã test thật đầu-cuối trên cả webapp và app Flutter thật: hỏi AI → nhận gợi ý địa điểm dạng card → hiển thị đúng dữ liệu thật. `functions/` gốc vẫn giữ nguyên không xoá, phòng khi Blaze bật được thì quay lại dùng.
## GIAI ĐOẠN 4 — VR 360° (ĐÃ BỎ KHỎI ĐỒ ÁN — 2026-09-12)

> **Quyết định**: Sau khi Firebase Storage không bật được (cùng nguyên nhân Blaze bị chặn như Giai
> đoạn 3, không có hướng né tương đương như Vercel cho Cloud Functions), chủ đồ án quyết định bỏ hẳn
> tính năng VR 360° thay vì tiếp tục tìm giải pháp thay thế (vd Cloudflare R2/Supabase Storage). Toàn
> bộ code liên quan đã được gỡ khỏi 3 client (Flutter: `lib/features/vr360/`, package `panorama` +
> `motion_sensors`; Web: `/places/[id]/vr360`, `@photo-sphere-viewer/*`; Admin:
> `places/[id]/media360`), field `has360`/collection `media_360`, rule Firestore/Storage liên quan, và
> script seed `scripts/seed_vr360/`. Các mục bên dưới giữ nguyên làm hồ sơ những gì đã từng làm được
> trước khi gỡ (đóng góp cho phần "quá trình phát triển" của báo cáo đồ án nếu cần).


## GIAI ĐOẠN 5 — Lịch trình & tương tác
 
- [x] Màn tạo lịch trình mới (chọn ngày bắt đầu, đặt tên) — `lib/features/itinerary/screens/create_itinerary_screen.dart`, form tên + `showDatePicker` chọn ngày bắt đầu; `ItineraryRepository.createItinerary()` tạo doc `itineraries/{id}` với `endDate` mặc định = `startDate` (lịch trình 1 ngày), tự điều hướng sang màn chi tiết sau khi tạo
- [x] Thêm địa điểm vào lịch trình theo ngày — `add_place_to_itinerary_screen.dart` (tìm kiếm + danh sách địa điểm, tái dùng `placesProvider`) → `ItineraryRepository.addItem()` ghi vào sub-collection `itinerary_items` với `dayIndex` + `order` (order = số item hiện có trong đúng ngày đó); nút "Thêm ngày" trên màn chi tiết đẩy `endDate` lên 1 ngày để mở thêm ngày mới
- [x] Sắp xếp lại thứ tự điểm đến (kéo-thả) — `ReorderableListView.builder` trong `itinerary_detail_screen.dart`, `ItineraryRepository.reorderDay()` ghi lại `order` bằng `WriteBatch`. **Bug tự phát hiện khi test**: icon kéo-thả bên trái chỉ mang tính trang trí (không có tác dụng), kéo thật sự chỉ hoạt động ở handle mặc định bên phải do `ReorderableListView` tự sinh — đã sửa bằng `buildDefaultDragHandles: false` + bọc icon bên trái bằng `ReorderableDragStartListener` để đúng 1 handle rõ ràng, hoạt động đúng vị trí trực quan
- [x] Xoá địa điểm khỏi lịch trình — nút thùng rác trên mỗi item (`ItineraryRepository.removeItem()`, xoá doc trong `itinerary_items`)
- [x] Chức năng Lưu/Yêu thích địa điểm — `SaveToggleButton` (trái tim) trên AppBar màn Chi tiết địa điểm, `SavedPlaceRepository.toggleSave()` dùng doc id `${uid}_${placeId}` để toggle tạo/xoá; màn `Đã lưu` (`saved_places/screens/saved_places_screen.dart`) join `saved_places` với `placesProvider` đã tải sẵn (không tốn thêm lượt đọc). **Phát hiện + sửa 1 bug rule Firestore thật khi test**: `toggleSave()` gọi `docRef.get()` để kiểm tra đã lưu chưa (trước khi tạo mới) bị `permission-denied` vì rule `saved_places` truy cập `resource.data.userId` trên document chưa tồn tại (`resource == null`) — cùng loại bug đã gặp ở `reviews` tại Giai đoạn 2, sửa rule thêm `resource == null ||` ở đầu điều kiện đọc, đã deploy
- [x] Chức năng viết đánh giá (rating + comment) — đã làm sớm ở Giai đoạn 2 (xem ghi chú màn Chi tiết địa điểm)
- [x] Hiển thị danh sách đánh giá ở màn Chi tiết địa điểm — đã làm sớm ở Giai đoạn 2 (xem ghi chú màn Chi tiết địa điểm)
- [x] Test toàn bộ luồng: tạo lịch trình → thêm điểm → sắp xếp → lưu — chạy app thật (`flutter run -d web-server`) + script Playwright tự động bấm UI thật, nối Firebase project thật (`travelapp-7f140`), không mock: đăng ký tài khoản test → vào tab "Lịch trình" → tạo lịch trình mới → thêm 2 địa điểm vào Ngày 1 → xoá 1 địa điểm (còn đúng 1) → thêm địa điểm thứ 2 → kéo-thả đổi thứ tự (xác nhận đúng thứ tự mới trong DOM) → quay Trang chủ → mở Chi tiết địa điểm → bấm Lưu (icon đổi trái tim đặc + tooltip đổi "Lưu địa điểm" → "Bỏ lưu") → vào tab "Đã lưu" xác nhận địa điểm xuất hiện đúng. Tất cả bước đều pass, không còn lỗi Firestore/console (chỉ 1 cảnh báo benign của trình duyệt về VideoFrame GC). **Lưu ý**: test qua trình duyệt (web-server), chưa test tay trên emulator/thiết bị Android thật; lúc test cũng phát hiện go_router trên web đôi khi không đồng bộ kịp giao diện khi pop 2 cấp màn hình liên tiếp bằng nút Back trong lúc test tự động tốc độ cao — chưa rõ có phải vấn đề thật hay chỉ là đặc thù môi trường headless, nên thử lại thao tác bấm Back nhiều lần liên tiếp nhanh trên thiết bị thật khi có dịp
## GIAI ĐOẠN 6 — Tour gợi ý
 
> Tour là gói lịch trình dựng sẵn do admin thêm (collection `tours` đã có schema + rule từ Giai đoạn 1: `name`, `placeIds`, `coverImage`, `price`, `durationDays`, `isActive`). Không bán/thanh toán qua bên thứ 3 — user chỉ xem gợi ý rồi "chuyển" tour thành lịch trình của riêng mình để tự sửa (tái dùng toàn bộ hạ tầng Giai đoạn 5).
 
- [x] Seed dữ liệu mẫu cho collection `tours` (3-5 tour) — đã tạo 5 tour thật (Sa Pa mùa lúa chín, Di sản Miền Trung, Hạ Long - Tràng An kỳ vĩ, Đà Lạt mộng mơ, Phú Quốc biển đảo), mỗi tour tham chiếu đúng `placeIds` tới các địa điểm đã seed ở Giai đoạn 2, qua script Node + Firebase SDK (`coverImage` để trống, giống cách làm `places`); đã tạm nới rule `tours` (`allow create: if isSignedIn()`) để seed rồi deploy lại rule gốc (`isContentEditor()`-only) ngay sau
- [x] Màn danh sách Tour gợi ý — `lib/features/tours/screens/tour_list_screen.dart` + `tour_card.dart`, nối tab "Tours" trên bottom nav (trước đó là "đang phát triển"), card hiển thị ảnh (gradient placeholder theo tên nếu chưa có `coverImage`), tên, mô tả, số ngày, số địa điểm, giá
- [x] Màn Chi tiết Tour — `tour_detail_screen.dart`: ảnh cover, tên, rating trung bình (tính từ review approved), số ngày, số địa điểm, giá, mô tả, danh sách địa điểm bao gồm (tra `placesByIdProvider` theo `placeIds`, tái dùng `PlaceImagePlaceholder`)
- [x] Chức năng "Thêm vào lịch trình của tôi" — dialog nhập tên + ngày bắt đầu → `ItineraryRepository.createItineraryFromTour()` (mới, tái dùng chung file với `createItinerary`/`addItem`/`reorderDay` sẵn có) chia đều `placeIds` của tour theo `durationDays` ngày rồi tạo `itinerary` + `itinerary_items`, tự điều hướng sang màn Chi tiết lịch trình để user sửa tự do (thêm/xoá/kéo-thả — đã có sẵn từ Giai đoạn 5)
- [x] Chức năng viết đánh giá (rating + comment) cho Tour — tổng quát hoá `Review`: đổi `placeId` → `targetType` (`'place'`/`'tour'`) + `targetId`, `ReviewRepository.submitReview()` và `review_providers.dart` (`reviewsForTargetProvider`/`myReviewForTargetProvider`) dùng chung cho cả Place lẫn Tour; cập nhật `place_detail_screen.dart` theo API mới; doc id đổi thành `${targetType}_${targetId}_${uid}`. Rule Firestore `reviews` không cần đổi (không tham chiếu field cụ thể)
- [x] Hiển thị danh sách đánh giá ở màn Chi tiết Tour — tái dùng `ReviewForm`/`ReviewListItem` với `targetType: 'tour'`
- [x] Test toàn bộ luồng: xem danh sách tour → xem chi tiết → chuyển thành lịch trình → sửa lịch trình vừa tạo → quay lại đánh giá tour — chạy app thật (`flutter run -d web-server`) + script Playwright tự động bấm UI thật, nối Firebase project thật, không mock: đăng ký tài khoản → tab "Tours" hiện đủ 5 tour đúng tên/giá/số ngày/số điểm → mở "Sa Pa mùa lúa chín" xem đủ thông tin → bấm "Thêm vào lịch trình của tôi" → điền tên + ngày → tạo → sang đúng màn Chi tiết lịch trình có 3 ngày với Sa Pa ở Ngày 1 → quay lại tour → chọn 5 sao + viết bình luận → gửi → SnackBar xác nhận "chờ duyệt", form chuyển sang chế độ "Sửa đánh giá của bạn". Không còn lỗi Firestore/console (chỉ 1 cảnh báo benign VideoFrame GC). **Phát hiện + sửa 2 bug thật khi test**: (1) `TourCard` dùng `AspectRatio` trực tiếp trong `Row` không bọc `SizedBox`/`Expanded` → `RenderAspectRatio has unbounded constraints`, làm cả `ListView.builder` crash và render trắng toàn màn hình — sửa bằng `SizedBox(width: 100, height: 100)` bọc ngoài; (2) `createItineraryFromTour()` ban đầu gộp chung 1 `WriteBatch` để tạo `itinerary` cha và `itinerary_items` con cùng lúc → `permission-denied`, vì rule của `itinerary_items` đọc `get()` doc cha để kiểm tra chủ sở hữu, mà trong 1 batch chưa commit thì doc cha "chưa tồn tại" theo góc nhìn của rule — sửa bằng cách `await` tạo xong `itinerary` trước, rồi mới batch-ghi `itinerary_items` sau. **Lưu ý**: test qua trình duyệt (web-server), chưa test tay trên emulator/thiết bị Android thật
## GIAI ĐOẠN 7 — Admin Dashboard (Next.js)

> Chạy độc lập với app Flutter, chỉ dùng chung Firebase (Firestore + Auth), không cần Cloud Functions
> nên không bị chặn bởi việc chưa bật gói Blaze. Giao diện theo tông xanh brand (tham khảo thiết kế web
> "VietGuide AI" bạn gửi). Bảo mật thật sự nằm ở `firestore.rules` (role-based) — phần "guard" phía
> client trong admin chỉ là UX, không phải lớp bảo mật chính.

- [x] Tạo project Next.js riêng cho Admin — `admin/` (Next.js 16 App Router, TypeScript, Tailwind v4, tự dựng UI bằng Tailwind thuần thay vì shadcn CLI vì CLI yêu cầu tương tác không tự động hoá được); đăng ký thêm 1 Firebase Web App riêng "TravelAI Admin" trong project `travelapp-7f140` để lấy config
- [x] Setup Auth riêng cho admin — **không dùng Admin SDK/service account** (tránh phải quản lý key nhạy cảm cho 1 đồ án): đăng nhập bằng Firebase Auth client SDK (email/password, dùng chung tài khoản với app), `contexts/auth-context.tsx` đọc field `role` trong `users/{uid}` qua `onSnapshot`, tính quyền theo role (`admin` / `content_editor` / `support`) rồi gate route ở `(dashboard)/layout.tsx`. Bảo mật thật nằm ở `firestore.rules` (role-based), không phải ở lớp guard này. Đã mở rộng rule `users` cho phép `support` khoá/mở tài khoản (`isDisabled`) nhưng không đổi được `role` — khớp đúng phân quyền "Super Admin / Content Editor / Support" trong kế hoạch ban đầu; đã deploy
- [x] Trang quản lý người dùng — `(dashboard)/users/page.tsx`: tìm theo tên/email, đổi quyền (chỉ admin), khoá/mở tài khoản (admin + support), link nhanh sang "Xem đánh giá" của từng user (lọc `reviews` theo `userId`)
- [x] Trang CRUD địa điểm/tour — `place-form.tsx`/`tour-form.tsx` dùng chung cho tạo/sửa: tag, giờ mở cửa theo từng ngày, giá vé, thời gian tham quan, toạ độ, ảnh bìa (upload Storage hoặc dán URL trực tiếp — dán URL luôn hoạt động kể cả khi Storage chưa bật), thư viện ảnh; danh sách có bật/tắt nổi bật/hoạt động, xoá có xác nhận
- [x] ~~Trang upload & gắn ảnh 360°~~ — `places/[id]/media360/page.tsx` đã bị xoá cùng lúc gỡ VR 360° khỏi đồ án (xem Giai đoạn 4)
- [x] Trang duyệt/ẩn/xoá đánh giá — `reviews/page.tsx`: tab Chờ duyệt/Đã duyệt/Đã ẩn/Tất cả, join tên người đánh giá + tên địa điểm/tour, hỗ trợ lọc theo `?userId=` từ trang Người dùng
- [x] Trang chọn nội dung nổi bật — gộp vào trang Địa điểm (nút bật/tắt "Nổi bật" ngay trong danh sách) thay vì làm trang riêng, vì hệ thống hiện chưa có collection banner/tin tức trong ERD nên không có gì khác để quản lý ở mục này
- [x] Trang thống kê cơ bản — `(dashboard)/page.tsx`: số người dùng, địa điểm đang hoạt động/tổng, số tour, số đánh giá chờ duyệt (dùng `getCountFromServer`, không tốn đọc toàn bộ document); thêm trang **Nhật ký thao tác** (`audit-log`, admin-only) ghi lại các hành động quản trị (tạo/sửa/xoá địa điểm-tour, khoá/mở tài khoản, duyệt/ẩn đánh giá) vào collection mới `audit_logs` (đã thêm rule + deploy)
- [x] Test luồng: đăng nhập admin → thêm địa điểm mới → kiểm tra hiện trên app — build/lint sạch, sau đó test thật bằng Playwright trên dữ liệu Firestore thật của project (`travelapp-7f140`), không mock: đăng nhập → tất cả trang điều hướng đúng theo role → tạo địa điểm mới → hiện ngay trong danh sách (đã xoá dọn sau test) → duyệt 1 đánh giá thật → ghi đúng vào Nhật ký thao tác. Không còn lỗi console. **Lưu ý**: "Trang CRUD địa điểm/tour" upload ảnh qua Storage sẽ báo lỗi nhẹ nhàng (gợi ý dán URL thay thế) vì Firebase Storage chưa từng bật cho project; chưa test tay trên trình duyệt thật ngoài Playwright headless.
## GIAI ĐOẠN 8 — Web (Next.js)

> `webapp/` (tách biệt hoàn toàn với `web/` — đó là thư mục nền tảng Web của Flutter, không đụng tới).
> Cùng stack với Admin (Next.js App Router + Tailwind v4 + Firebase client SDK), dùng chung 1 Firebase
> project/tài khoản với app & admin. Tông màu chủ đạo lấy đúng theme thật của app Flutter (`#0E7C66`),
> bố cục hero/stat/card tham khảo layout ảnh mẫu "VietGuide AI" người dùng gửi. Tối ưu cho desktop
> (container rộng, grid nhiều cột, sidebar sticky ở trang chi tiết) nhưng vẫn responsive xuống mobile.

- [x] Tạo project Next.js cho Web người dùng — `webapp/`, đăng ký thêm 1 Firebase Web App riêng "TravelAI Web"
- [x] Landing page giới thiệu — hero gradient + ô tìm kiếm, dải thống kê **lấy số thật từ Firestore** (`getCountFromServer`, không hardcode), khối tính năng (AI/Lịch trình/Đa ngôn ngữ), địa điểm nổi bật, CTA cuối trang
- [x] Trang Khám phá — `/explore`: tìm theo tên/địa chỉ + lọc tag, grid 4 cột ở desktop, đọc trực tiếp Firestore `places` (không qua API riêng, đúng kiến trúc "1 backend nhiều client")
- [x] Trang Chi tiết địa điểm — `/places/[id]`: gallery ảnh, giờ mở cửa (rút gọn "Cả tuần" nếu giống nhau, giống logic app Flutter), nút Lưu (tim), nút "Thêm vào lịch trình" (chọn lịch trình + ngày có sẵn), khối đánh giá (viết/sửa đánh giá của mình + danh sách đã duyệt)
- [x] Trang Tour — `/tours` (list) + `/tours/[id]` (chi tiết, danh sách địa điểm, đánh giá, nút "Thêm vào lịch trình của tôi" tự tạo lịch trình mới + chia đều địa điểm theo số ngày, giống hệt logic `createItineraryFromTour` bên Flutter)
- [x] Trang Chat AI — `/chat`: giao diện hội thoại, lưu lịch sử vào đúng path `users/{uid}/chat_history/default/messages` (khớp schema Flutter dùng chung), gợi ý địa điểm dạng card khi AI trả tool `suggest_places`. Gọi thật qua `webapp/src/app/api/chat` (Vercel, xem Giai đoạn 3) — đã test thật trên production, hoạt động đúng, kèm cá nhân hoá theo sở thích/lịch sử người dùng
- [x] ~~Trang VR 360°~~ — `/places/[id]/vr360` đã bị xoá cùng lúc gỡ VR 360° khỏi đồ án (xem Giai đoạn 4)
- [x] Trang Lịch trình — `/itineraries` (danh sách + xoá) , `/itineraries/new` (tạo), `/itineraries/[id]` (thêm địa điểm theo ngày qua modal tìm kiếm, xoá, **kéo-thả sắp xếp lại thứ tự trong ngày** bằng HTML5 drag-and-drop, "+ Thêm ngày" nới `endDate`)
- [x] Trang Đã lưu (`/saved`) và Hồ sơ cá nhân (`/profile`: sửa họ tên/số điện thoại/ngôn ngữ, đăng xuất) — làm thêm ngoài checklist gốc vì đây là chức năng "đầy đủ" của app cần có trên web
- [x] Responsive kiểm tra trên mobile/tablet/desktop — Tailwind responsive classes (`sm:`/`lg:`) xuyên suốt, navbar có menu mobile riêng; **mới kiểm tra kỹ ở viewport desktop (1400px)** qua Playwright, chưa test tay trên thiết bị mobile/tablet thật
- [x] Test đăng nhập/đăng ký trên web hoạt động đúng, dùng chung tài khoản với app — đăng ký ghi đúng `users/{uid}` theo schema chung (`role: 'user'`, `isDisabled: false`); test thật bằng Playwright trên dữ liệu Firestore thật của project `travelapp-7f140` (không mock), đăng nhập bằng tài khoản `admin@gmail.com` đã dùng cho Admin Dashboard: duyệt Khám phá → xem chi tiết địa điểm → Lưu → viết đánh giá → tạo lịch trình → thêm địa điểm theo ngày → thêm ngày → xoá địa điểm → xem Tour → "Thêm vào lịch trình của tôi" → Đã lưu → Hồ sơ → Chat AI (trả lời thật, đúng như kỳ vọng — đã hết chặn Blaze từ khi chuyển sang Vercel). Đã dọn sạch dữ liệu test sau khi xong. **Phát hiện + đã sửa 3 bug thật khi test**: (1) thiếu composite index `itinerary_items` (`dayIndex` + `order`) khiến trang chi tiết lịch trình đọc dữ liệu bị lỗi âm thầm — đã thêm index + deploy; (2) nút "Hỏi trợ lý AI" ở khối CTA trang chủ bị mất chữ do class Tailwind tự viết đè (`bg-transparent`/`text-white`) xung đột thứ tự với class gốc của variant `outline` — sửa bằng cách thêm hẳn 1 variant `outlineInverse` riêng cho nút trên nền màu thay vì đè class; (3) trang Chat bị đẩy layout lệch hẳn lên trên (header/tin nhắn khuất khỏi khung nhìn) do `scrollIntoView({behavior:'smooth'})` mặc định `block:'start'` chạy ngay cả khi chưa có tin nhắn nào — sửa bằng cách bỏ qua khi danh sách tin nhắn rỗng và thêm `block:'nearest'`
## GIAI ĐOẠN 9 — Hoàn thiện & nộp đồ án
 
- [x] Push notification (FCM) cho các sự kiện: gợi ý mới, nhắc lịch trình — cùng chuyển sang Vercel như Giai đoạn 3: `webapp/src/app/api/remind-itineraries` (Vercel Cron 1 lần/ngày 08:00) + `webapp/src/app/api/notify-new-place` (gọi trực tiếp từ Admin ngay khi bật `isActive`). Đã test thật, cả 2 route chạy đúng (`200 OK`)
- [x] Đa ngôn ngữ (ít nhất Việt + Anh) — Flutter: `flutter_localizations` + ARB (`lib/l10n/app_vi.arb`/`app_en.arb`), locale lấy từ `users/{uid}.language` (fallback SharedPreferences khi chưa đăng nhập), toggle ở màn Hồ sơ. Webapp: context + dictionary riêng (`vi.json`/`en.json`, không dùng next-intl vì không cần locale-prefixed URL), cùng field `language` để đồng bộ với Flutter. Đã tự verify bằng Playwright + emulator thật: đổi ngôn ngữ, load lại trang, khởi động lại app đều giữ đúng lựa chọn. `flutter analyze`/`tsc --noEmit`/`npm run build` đều sạch
- [x] Rà soát và fix bug toàn bộ luồng chính (App + Web + Admin) — test lại toàn bộ luồng chính qua Playwright (webapp: đăng ký → khám phá → lưu → lịch trình → chat AI → hồ sơ → đăng xuất/đăng nhập lại) và emulator Android thật (Flutter: điều hướng 6 tab, hồ sơ, ngôn ngữ) — không phát hiện bug thật nào; trạng thái "AI chưa khả dụng" báo lỗi gọn gàng đúng như thiết kế thay vì crash
- [x] Tối ưu hiệu năng (cache ảnh, giảm thời gian tải) — đã có từ đợt UI trước (`cached_network_image` + `memCacheWidth`, shimmer skeleton, đếm bằng `getCountFromServer` thay vì tải cả collection); rà lại không thấy vấn đề mới đáng sửa ở quy mô dữ liệu hiện tại
- [ ] Viết báo cáo đồ án (mô tả kiến trúc, chức năng, công nghệ dùng) — bạn tự làm
- [ ] Chuẩn bị slide bảo vệ đồ án — bạn tự làm
- [ ] Quay video demo dự phòng (phòng khi demo trực tiếp lỗi mạng/thiết bị) — bạn tự làm
- [x] Đóng gói/build bản release (APK/AAB cho app, deploy web + admin lên hosting) — tạo keystore ký release riêng (`android/key.properties`, gitignore, không commit), build thành công `app-release.aab` (27.3MB) + `app-release.apk` (55.7MB) ký đúng bằng key thật, cài/chạy thử trên emulator không lỗi. Nhân tiện phát hiện + sửa 1 bug thật: `third_party/motion_sensors` ghim `compileSdkVersion 28` khiến build release luôn fail ở bước `verifyReleaseResources` (thiếu resource `android:attr/lStar`) — nâng lên 34, giờ build release chạy được. Webapp/admin build production sạch.

> **Cập nhật 2026-09-12 — Deploy hosting: ĐÃ XONG, nhưng đổi hướng khỏi Firebase Hosting**: 2 site
> Firebase Hosting (`travelapp-7f140-web`, `travelapp-7f140-admin`) tạo từ trước vẫn chưa dùng được vì
> Next.js SSR qua Firebase Hosting cần Cloud Functions/Cloud Run — cùng bị chặn bởi Blaze như Giai đoạn
> 3, không có dấu hiệu sẽ tự hết. Thay vào đó, deploy cả webapp lẫn admin lên **Vercel** (giống hướng đã
> dùng cho AI ở Giai đoạn 3) — 2 project Vercel riêng biệt cùng team, cùng trỏ về 1 Firebase project
> `travelapp-7f140`:
> - **Webapp**: `https://travel-app-6rww.vercel.app` (đã deploy từ Giai đoạn 3).
> - **Admin**: `https://admin-mocha-six-89.vercel.app` — project Vercel mới tên `admin`, deploy trực
>   tiếp từ thư mục `admin/` (không cần `.vercelignore` allowlist như webapp vì đây là project gốc từ
>   `admin/`, không phải monorepo con), set đủ 7 biến `NEXT_PUBLIC_FIREBASE_*` (copy từ `admin/.env.local`,
>   riêng `NEXT_PUBLIC_FIREBASE_API_KEY` phải thêm bằng `--no-sensitive --value` vì CLI mặc định coi tên
>   có "API_KEY" là nhạy cảm và hỏi xác nhận thêm — không phải lỗi thật).
> - Cả 2 domain Vercel đã thêm vào **Authorized domains** của Firebase Auth (bắt buộc để
>   `signInWithPopup` Google hoạt động — thiếu bước này gây lỗi `auth/unauthorized-domain`, đúng bug đã
>   gặp và sửa cho webapp trước khi làm admin).
> - Firebase Hosting cho `travelapp-7f140-web`/`travelapp-7f140-admin` giữ nguyên chưa xoá, không dùng
>   tới, có thể dọn sau nếu muốn — không ảnh hưởng gì vì chưa từng deploy được nội dung nào lên đó.

> **Cập nhật 2026-09-12 — Deploy thêm bản Flutter Web + nút chuyển đổi desktop/app**: app Flutter giờ
> có thêm 1 bản chạy trên web, deploy riêng biệt song song với webapp Next.js.
> - **Domain**: `https://web-nu-woad-82.vercel.app` — project Vercel mới tên `web`, deploy static
>   (không phải framework Next.js) từ thư mục build `build/web` sau khi chạy
>   `flutter build web --release --pwa-strategy=none`. **Bắt buộc phải có `--pwa-strategy=none`** —
>   thiếu cờ này bản release bị **trắng trang hoàn toàn, không lỗi rõ ràng** do service worker mặc định
>   của Flutter Web bị race condition lúc tải `main.dart.js` (chỉ xảy ra ở `--release`, không xảy ra ở
>   `--debug`/`--profile`, nên rất dễ bỏ sót nếu chỉ test bằng `flutter run`). Cách deploy lại khi có
>   code mới: `flutter build web --release --pwa-strategy=none` rồi `cd build/web && vercel --prod`.
> - **3 bug thật phát hiện khi làm** (xem chi tiết trong commit): (1) `webview_flutter` (dùng cho bản
>   đồ) không có bản cho web → crash toàn app khi vào Chi tiết địa điểm — sửa bằng conditional export:
>   `place_map_view_mobile.dart` (webview_flutter) cho Android/iOS, `place_map_view_web.dart`
>   (`HtmlElementView` + iframe) cho web; (2) `coverImage`/`images` của 18 địa điểm lưu đường dẫn tương
>   đối (`/images/places/...`) chỉ đúng trên domain webapp — **đã ảnh hưởng cả app Flutter Android thật
>   từ trước**, không chỉ web — đã sửa thành URL tuyệt đối trong Firestore; (3) service worker nói trên.
> - **Nút chuyển đổi 2 chiều**: webapp (icon điện thoại trên navbar) ↔ Flutter Web (nút "Chuyển sang
>   bản desktop" ở màn Hồ sơ, chỉ hiện khi `kIsWeb`). **Lưu ý**: 2 domain khác nhau nên phiên đăng nhập
>   không dùng chung — người dùng cần đăng nhập lại khi chuyển qua lại giữa 2 bản.
> - Thêm CORS header (`Access-Control-Allow-Origin: *`) cho `/images/*` trên webapp — cần thiết để
>   Flutter Web (renderer CanvasKit) vẽ được ảnh cross-origin lên canvas (khác `<img>` thường không cần).
---
 
## Ghi chú
- Sau mỗi giai đoạn: **commit Git riêng**, đặt tên rõ ràng (vd: `feat: hoan thanh giai doan 2 - trang chu`)
- Sau mỗi giai đoạn: **commit Git riêng**, đặt tên rõ ràng (vd: `feat: hoan thanh giai doan 2 - trang chu`)
- Giai đoạn 4 (VR 360°) đã được bỏ khỏi đồ án (2026-09-12, xem ghi chú ở đầu giai đoạn) — không cần thời gian dự phòng cho mục này nữa
- Luôn tự chạy thử app thật sau khi vibe code xong mỗi mục, không chỉ tin AI báo "xong"

## Việc cần tự làm

**Giai đoạn 3 — Trợ lý AI: ĐÃ XONG**, không cần Blaze nữa — xem `migration-vercel-ai.md` (đã chuyển
sang Vercel, đã test thật đầu-cuối trên webapp + app Flutter, kèm push notification + kiểm duyệt
review bằng AI, và cá nhân hoá gợi ý theo sở thích/lịch sử người dùng).

**Giai đoạn 4 — VR 360°: ĐÃ BỎ KHỎI ĐỒ ÁN** (2026-09-12) — không còn việc gì cần làm ở mục này, xem
ghi chú quyết định ở đầu Giai đoạn 4.

Không còn việc nào đang chờ bạn làm.
