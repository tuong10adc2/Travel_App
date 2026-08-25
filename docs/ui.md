# UI/UX — hiện trạng & hướng làm đẹp tiếp theo

> Ghi lại đợt polish UI gần nhất (typography, ảnh, loading state cho Flutter app +
> chart/modal cho admin) và các hướng tiếp theo nếu muốn nâng cấp thêm.

## Đã làm (đợt polish này)

### 1. Typography scale + font riêng (Flutter)
- `lib/core/theme/app_theme.dart`: định nghĩa đầy đủ `TextTheme` (display/headline/title/body/label,
  mỗi loại có Large/Medium/Small) dùng font **Plus Jakarta Sans** (qua package `google_fonts`) thay vì
  Roboto/San Francisco mặc định của OS. Tiêu đề lớn có letter-spacing âm nhẹ (-0.2 → -0.5) cho cảm giác
  chắc/sắc nét hơn.
- Xoá toàn bộ `TextStyle(fontSize: X, fontWeight: Y)` rải rác trong 17 file màn hình, thay bằng
  `Theme.of(context).textTheme.<style>` (`?.copyWith(color: ...)` khi cần đổi màu riêng) — chữ trong
  toàn app giờ theo 1 hệ thống nhất quán thay vì magic number từng nơi.

### 2. Ảnh cache + fade-in (Flutter)
- `lib/core/widgets/app_network_image.dart` — widget `AppNetworkImage` bọc `cached_network_image`:
  cache ảnh, fade-in 250ms khi tải xong, icon lỗi khi ảnh hỏng — thay cho `Image.network` trần (không
  cache, không placeholder, mạng chậm ra khoảng trắng). Áp dụng ở `place_card.dart`, `tour_card.dart`,
  `place_detail_screen.dart`, `tour_detail_screen.dart`, `add_place_to_itinerary_screen.dart`.
- **Không đổi** `vr360_viewer_screen.dart` — package `panorama` yêu cầu type `Image` cụ thể (đọc thẳng
  `.image` để dựng texture 360°), không nhận widget chung chung như `AppNetworkImage`; màn này đã có
  cơ chế loading riêng (`precacheImage` + skeleton) từ trước nên giữ nguyên.
- **Không đổi** `profile_screen.dart`'s `CircleAvatar.backgroundImage` — nhận `ImageProvider`, không
  nhận widget.

### 3. Shimmer skeleton thay cho spinner (Flutter)
- `lib/core/widgets/shimmer_box.dart` + `lib/core/widgets/skeleton_loaders.dart`: 3 skeleton dùng chung
  — `SkeletonCardGrid` (lưới card kiểu Home/Saved), `SkeletonList` (danh sách dòng kiểu Itinerary/Tour),
  `SkeletonDetailPage` (trang chi tiết: ảnh lớn + text). Thay `Center(child: CircularProgressIndicator())`
  ở toàn bộ trạng thái loading full-trang.
- Giữ nguyên các spinner nhỏ **có ngữ cảnh** (nút submit đang lưu, typing indicator trong chat, dòng
  đang thêm địa điểm) — đây không phải loading toàn trang nên không cần skeleton.
- `lib/core/widgets/empty_state.dart`: gom pattern "icon lớn + tiêu đề + mô tả" (trước đây copy-paste ở
  ~5 màn hình) thành 1 widget `EmptyState` dùng chung.

### 4. Admin dashboard: chart thật + modal xác nhận
- Cài `recharts`, thêm `admin/src/components/ui/activity-chart.tsx` (area chart 2 series: người dùng
  mới / đánh giá mới, 14 ngày gần nhất, gom dữ liệu từ Firestore `createdAt`) — thay cho dashboard chỉ
  có 4 ô số liệu tĩnh.
- `admin/src/contexts/confirm-context.tsx`: `ConfirmProvider` + `useConfirm()` — modal xác nhận đồng bộ
  style với app thay cho `confirm()` gốc của trình duyệt (đã phá vỡ giao diện custom mỗi lần xoá địa
  điểm/tour/đánh giá/điểm nhìn 360°). Áp dụng ở `places/page.tsx`, `reviews/page.tsx`, `tours/page.tsx`,
  `places/[id]/media360/page.tsx`.

Đã verify: `flutter analyze` sạch, `flutter build web` build được; admin `tsc --noEmit`, `npm run lint`,
`npm run build` đều sạch.

### 5. Dark mode (webapp + admin)
- `globals.css` (cả 2 project): thêm bộ token màu tối cho `background/foreground/surface/surface-muted/
  border/muted-foreground` + toàn bộ ramp `brand-*`/`success/warning/danger-50/600`, áp theo 2 lớp —
  `@media (prefers-color-scheme: dark)` (tự theo hệ thống khi chưa chọn thủ công) và
  `:root[data-theme="dark"]` (khi bấm nút chuyển). Vì Tailwind v4 `@theme inline` trỏ thẳng tới các biến
  CSS này, toàn bộ component đã dùng token ngữ nghĩa (`bg-surface`, `text-foreground`,...) tự đổi màu
  không cần sửa gì thêm.
- Lưu ý quan trọng khi làm: các sắc `600/700` (`brand-700`, `danger-600`,...) vừa dùng làm **chữ đứng
  một mình trên nền trang** vừa dùng làm **chữ trên chính nền tint `-50`/`-100` của nó** (vd
  `bg-brand-50 text-brand-700`). Nếu chỉ đảo nền tint sang tối mà giữ nguyên sắc chữ cũ, chữ sẽ chìm vào
  nền (contrast quá thấp) — nên bảng màu tối phải **đảo cả 2 đầu dải màu** (700 tối trở thành sáng) chứ
  không chỉ đảo nền/chữ trang.
- `ThemeToggle` (`components/theme-toggle.tsx`, cả 2 project) — nút bật/tắt sáng/tối, lưu vào
  `localStorage`, gắn ở navbar (webapp) và sidebar (admin). Script inline chống FOUC trong `layout.tsx`
  đọc `localStorage` và set `data-theme` lên `<html>` trước khi trình duyệt vẽ khung hình đầu (theo đúng
  hướng dẫn "Preventing Flash Before Hydration" của chính Next.js phiên bản đang dùng).
- Quét toàn bộ 2 project thay `bg-white`/`bg-slate-*` dùng làm **nền chrome trung tính** (card, input,
  dropdown, modal, skeleton) sang `bg-surface`/`bg-surface-muted`. **Giữ nguyên** `text-white`/`bg-white/
  NN` khi nó nằm trong section màu thương hiệu cố định (hero gradient, banner CTA, badge nổi trên ảnh),
  `bg-black/NN` (lớp phủ cho dễ đọc chữ trên ảnh), và toàn bộ `vr360/page.tsx` (trình xem VR nền đen cố
  ý, không phải chrome trang) — những màu này đúng ở cả 2 theme nên không cần đổi.
- `admin/src/components/ui/activity-chart.tsx`: đổi màu series từ hex cứng sang `var(--brand-600)`/
  `var(--warning-600)` để chart tự đổi màu theo theme luôn, không cần logic JS phát hiện dark mode.

### 6. Flutter app: dark mode, Hero animation, micro-interaction, illustration nhẹ
- **Dark mode thật** — tách `AppColors` (chỉ còn màu thương hiệu tĩnh: `primary/primaryDark/secondary/
  error`) khỏi màu phụ thuộc theme (`background/surface/textPrimary/textSecondary/divider/shimmer*`),
  đưa nhóm sau vào `AppSemanticColors extends ThemeExtension<AppSemanticColors>` đăng ký qua
  `ThemeData.extensions` ở cả `AppTheme.light` và `AppTheme.dark` mới — đây là cách Flutter làm tương
  đương "CSS custom property" mà webapp/admin có sẵn qua Tailwind, Flutter không có cơ chế miễn phí
  tương tự nên phải làm ThemeExtension. Truy cập qua extension tiện `context.colors.X` (định nghĩa ngay
  trong `app_theme.dart`) thay vì gọi `Theme.of(context).extension<AppSemanticColors>()!` dài dòng.
  `MyApp` (`main.dart`) thêm `darkTheme: AppTheme.dark, themeMode: ThemeMode.system` — tự theo theme hệ
  điều hành, không có nút chuyển tay riêng (khác webapp/admin) vì Flutter đã tôn trọng cài đặt hệ thống
  của thiết bị theo mặc định.
  - Đã quét & sửa toàn bộ ~13 file còn tham chiếu thẳng `AppColors.background/surface/textPrimary/
    textSecondary/divider` sang `context.colors.X` tương ứng (bao gồm `shimmer_box.dart`,
    `empty_state.dart`, `chat_screen.dart`, `chat_message_bubble.dart`, `home_screen.dart`,
    `place_card.dart`, `place_detail_screen.dart`, `tour_card.dart`, `tour_detail_screen.dart`,
    `itinerary_detail_screen.dart`, `add_place_to_itinerary_screen.dart`, `create_itinerary_screen.dart`,
    `review_form.dart`).
- **Hero animation** — `Hero(tag: 'place-image-${place.id}')` bọc ảnh cover ở cả `PlaceCard` và
  `PlaceDetailScreen`, tương tự `Hero(tag: 'tour-image-${tour.id}')` cho `TourCard`/`TourDetailScreen` —
  ảnh "bay" mượt khi chuyển từ lưới sang trang chi tiết thay vì cắt cảnh đột ngột.
- **Micro-interaction** — widget `lib/core/widgets/pressable_scale.dart` (`PressableScale`): co nhẹ
  (96%) khi nhấn giữ. Dùng `Listener` (chỉ quan sát pointer, không tham gia gesture arena) thay vì
  `GestureDetector.onTap` riêng — nhờ vậy bọc được quanh `IconButton`/`ElevatedButton`/
  `FloatingActionButton` có sẵn `onPressed` mà không giành mất sự kiện chạm của chúng (dùng
  `GestureDetector` sẽ xung đột: widget con nuốt mất tap, scale không bao giờ kích hoạt). Áp dụng cho nút
  gửi chat, nút tim lưu địa điểm (`SaveToggleButton`), FAB "Tạo lịch trình".
- **Illustration nhẹ cho Empty state** — `EmptyState` đổi icon đơn sắc trần thành icon đặt giữa 2 lớp
  vòng tròn màu thương hiệu mờ dần (secondary 12%, primary 14%) thay vì tải asset SVG ngoài (unDraw/
  Storyset) — không cần thêm dependency/asset, vẫn đỡ "trơ" hơn hẳn 1 icon xám. Đây là bản thay thế nhẹ,
  chưa phải illustration vẽ tay/SVG thật — xem lại mục "Illustration SVG thật" bên dưới nếu muốn nâng
  cấp tiếp.
- **Bo góc & shadow** — kiểm tra lại, hoá ra không có vấn đề: toàn bộ `BorderRadius.circular` trong code
  (ngoài 1 chỗ bo tròn hoàn toàn `999` cho nút dạng viên thuốc và 1 chỗ `BorderRadius.zero` cho ảnh full-
  bleed, cả 2 đều đúng ý không thuộc thang `sm/md/lg`) đã dùng `AppRadius.sm/md/lg` sẵn — không cần sửa.

Đã verify: `flutter analyze` sạch, `flutter build web` build được (chạy lại sau khi refactor màu +
Hero + micro-interaction).

## Hướng tiếp theo nếu muốn đẹp hơn nữa

### Webapp (Next.js)
1. **framer-motion cho các transition phức tạp hơn** — hiện chỉ có 1 `IntersectionObserver` tự viết cho
   scroll-reveal. Nếu muốn shared-element transition (ảnh place-card "bay" sang trang chi tiết như ở
   app, giờ app đã có nhờ Hero) hoặc page transition mượt giữa các route, cần thêm `framer-motion` —
   hiện chưa có trong `package.json`.

### Flutter app
2. **Illustration SVG thật** — bản `EmptyState` hiện tại (vòng tròn màu + icon) là giải pháp tạm không
   cần asset ngoài; nếu muốn nâng cấp tiếp, thêm package `flutter_svg` + vài file SVG phong cách nhất
   quán (unDraw/Storyset, đổi màu theo `primary`) cho từng loại empty state (chưa lưu địa điểm, chưa có
   lịch trình, lỗi mạng...).

### Admin dashboard
3. **Bảng dữ liệu thật** — `places/page.tsx`, `reviews/page.tsx` vẫn là `<table>`/card-list không phân
   trang/sắp xếp/bulk-action. Nếu danh sách địa điểm/đánh giá tăng lên vài trăm dòng sẽ cần thêm
   pagination + sort theo cột.
4. **Thêm chart cho users/reviews** — `activity-chart.tsx` mới chỉ có 1 chart tổng quan ở trang chủ.
   Có thể thêm biểu đồ tương tự (rating trung bình theo thời gian, top địa điểm được xem nhiều) ở trang
   riêng nếu cần báo cáo sâu hơn.

## Ưu tiên nếu làm tiếp (ROI theo thời gian bỏ ra)
1. framer-motion + shared-element transition cho webapp (tốn công nhất trong các mục còn lại)
2. Illustration SVG thật cho Flutter (trung bình, cần tìm/tải asset)
3. Bảng dữ liệu + chart bổ sung cho admin (làm khi dữ liệu thật đủ lớn để cần)
