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
- **Illustration SVG thật cho Empty state** — 4 file SVG tự vẽ tay (`assets/illustrations/empty_chat.svg`,
  `empty_itinerary.svg`, `empty_saved.svg`, `empty_tours.svg` — chat bubble + sparkle AI, calendar +
  checkmark, bookmark + tim, map pin + đường chấm) dùng đúng 2 màu thương hiệu (`primary`/`secondary`),
  render qua package `flutter_svg`. `EmptyState` nhận thêm `illustrationAsset` (optional) — có thì thay
  cho `icon` bên trong halo, không có thì fallback về icon Material như cũ (không phá các chỗ gọi
  `EmptyState` khác trong tương lai chưa có SVG riêng). Áp dụng cho 4 màn: chat trống, chưa có lịch
  trình, chưa lưu địa điểm, chưa có tour.
- **Bo góc & shadow** — kiểm tra lại, hoá ra không có vấn đề: toàn bộ `BorderRadius.circular` trong code
  (ngoài 1 chỗ bo tròn hoàn toàn `999` cho nút dạng viên thuốc và 1 chỗ `BorderRadius.zero` cho ảnh full-
  bleed, cả 2 đều đúng ý không thuộc thang `sm/md/lg`) đã dùng `AppRadius.sm/md/lg` sẵn — không cần sửa.

Đã verify: `flutter analyze` sạch, `flutter build web` build được (chạy lại sau khi refactor màu +
Hero + micro-interaction + illustration).

### 7. Webapp: page transition (framer-motion)
- Cài `framer-motion`, thêm `components/page-transition.tsx` — fade + trượt nhẹ (10px, 180ms) giữa các
  trang khi điều hướng, dùng `AnimatePresence` + `key={pathname}` (từ `usePathname()`). Tôn trọng
  `prefers-reduced-motion` qua hook `useReducedMotion()` — tắt hẳn animation thay vì chỉ giảm biên độ.
  Gắn vào `layout.tsx` (server component) bằng cách bọc `{children}` trong `<main>` bằng component
  client này — pattern chuẩn của Next.js App Router để mount 1 client boundary bên trong 1 server layout.
- **Không làm shared-element transition** (ảnh place-card "bay" sang ảnh hero ở trang chi tiết bằng
  `layoutId`) như dự tính ban đầu — kiểm tra code thì `places/[id]/page.tsx` tự fetch dữ liệu bằng
  `getDoc` sau khi mount và hiện loading spinner riêng trong lúc chờ; ảnh đích chưa tồn tại trong DOM tại
  thời điểm chuyển trang nên `layoutId` không có gì để khớp — hiệu ứng "bay" sẽ không xảy ra, chỉ tốn
  công thêm code chết. Muốn làm đúng cần đổi cách lấy dữ liệu trang chi tiết (truyền trước qua router
  state, hoặc cache theo id) — nằm ngoài phạm vi 1 đợt polish UI thuần tuý, để riêng nếu sau này đổi kiến
  trúc fetch dữ liệu.

Đã verify: `npx tsc --noEmit`, `npm run lint`, `npm run build` đều sạch.

### 8. Admin dashboard: pagination + sort + chart phân bố rating
- `components/ui/pagination.tsx` — component phân trang dùng chung (20 dòng/trang, nhãn "Hiển thị X–Y
  trên Z", nút Trước/Sau). Áp dụng cho `places/page.tsx` (sau bộ lọc tìm kiếm/tab) và `reviews/page.tsx`.
- Sắp xếp theo cột: `places/page.tsx` có header bấm được (tên, đánh giá, ngày tạo — thêm mới cột ngày tạo
  vì trước đó không hiển thị); `reviews/page.tsx` là card-list nên thay bằng hàng nút "Sắp xếp: ngày tạo/
  rating" cùng quy ước chevron lên/xuống. Reset về trang 1 khi đổi tìm kiếm/tab/sắp xếp — cài đặt qua
  "điều chỉnh state trong lúc render" (so `resetKey` phái sinh với `prevResetKey`) thay vì `useEffect`
  gọi `setState` để tránh lỗi lint `react-hooks/set-state-in-effect` của Next 16.
- `components/ui/rating-distribution-chart.tsx` — bar chart 5 cột (1★–5★) đếm số đánh giá theo từng mức
  sao, dùng toàn bộ dữ liệu `reviews` (không phải danh sách đã lọc) để phản ánh đúng phân bố tổng thể;
  cùng pattern màu qua CSS variable (`var(--warning-600)`) như `activity-chart.tsx` để tự đổi theo dark
  mode.

Đã verify: `npx tsc --noEmit`, `npm run lint`, `npm run build` đều sạch.

## Hướng tiếp theo nếu muốn đẹp hơn nữa

Tất cả các hướng đã liệt kê trong các đợt polish trước đều đã làm. Còn lại là các hướng lớn hơn, cần thay
đổi kiến trúc hoặc đầu tư thời gian đáng kể hơn 1 đợt polish UI:

1. **Shared-element image transition (webapp)** — xem lý do descope ở mục 7 phía trên; cần đổi cách
   fetch dữ liệu trang chi tiết trước.
2. **Server-side pagination cho admin** — hiện `places`/`reviews` vẫn tải toàn bộ collection qua
   `onSnapshot` rồi phân trang phía client; nếu dữ liệu lên tới hàng nghìn dòng sẽ cần chuyển sang
   `startAfter` cursor-based pagination thật ở tầng Firestore query.
3. **Thêm chart khác cho admin** (rating trung bình theo thời gian, top địa điểm được xem nhiều) — mục
   "top địa điểm được xem nhiều" cần thêm cơ chế đếm lượt xem (view tracking) chưa có trong schema hiện
   tại, nên đây là việc lớn hơn 1 chart đơn thuần.
