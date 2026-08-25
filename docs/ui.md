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

## Hướng tiếp theo nếu muốn đẹp hơn nữa

### Flutter app
1. **Page transition + Hero animation** — hiện chuyển màn hình dùng transition mặc định của
   `go_router`/Material, ảnh cover ở list và ở trang chi tiết là 2 widget riêng biệt (không có hiệu ứng
   ảnh "bay" từ card sang trang chi tiết). Bọc ảnh cover bằng `Hero(tag: place.id, ...)` ở cả
   `PlaceCard` và `PlaceDetailScreen` là điểm nhanh, rẻ, hiệu ứng rất rõ.
2. **Dark mode** — token màu đã tách riêng ở `AppColors`, nhưng `AppTheme` mới chỉ có `light`. Thêm
   `AppTheme.dark` (đảo `background`/`surface`/`textPrimary` sang tối, giữ `primary`/`secondary`) và
   set `themeMode: ThemeMode.system` ở `MaterialApp` là đủ cho bản đầu.
3. **Illustration cho Empty/Error state** — `EmptyState` hiện chỉ có icon Material đơn sắc (56px). Thay
   icon bằng 1 bộ illustration nhẹ (SVG, ví dụ từ unDraw/Storyset) theo màu thương hiệu sẽ khiến các màn
   trống (chưa lưu địa điểm, chưa có lịch trình...) đỡ "trơ" hơn nhiều so với 1 icon xám.
4. **Micro-interaction** — nút bấm, `ChoiceChip`, `Card` hiện dùng behavior mặc định của Material (chỉ
   có ripple). Thêm `AnimatedScale`/`AnimatedContainer` nhẹ khi nhấn (scale 0.97, 100ms) cho nút chính
   (gửi chat, tạo lịch trình, lưu địa điểm) tạo cảm giác "phản hồi" rõ hơn.
5. **Bo góc & shadow nhất quán hơn** — `AppRadius`/`CardTheme` đã có nhưng vài nơi (badge trong
   `PlaceCard`, chip trong `TourCard`) tự đặt `BorderRadius.circular` riêng thay vì dùng `AppRadius.sm`.
   Rà lại 1 lượt để tất cả bo góc dùng chung 3 mức `sm/md/lg` đã định nghĩa.

### Webapp (Next.js)
6. **Dark mode** — biến CSS trong `globals.css` đã đủ cấu trúc để thêm nhánh `prefers-color-scheme:
   dark`/`data-theme`, chỉ chưa viết. Đây là surface đã polish nhất nên làm dark mode ở đây trước sẽ có
   ROI cao nhất (dễ thấy khác biệt khi demo).
7. **framer-motion cho các transition phức tạp hơn** — hiện chỉ có 1 `IntersectionObserver` tự viết cho
   scroll-reveal. Nếu muốn shared-element transition (ảnh place-card "bay" sang trang chi tiết như ở
   app) hoặc page transition mượt giữa các route, cần thêm `framer-motion` — hiện chưa có trong
   `package.json`.

### Admin dashboard
8. **Bảng dữ liệu thật** — `places/page.tsx`, `reviews/page.tsx` vẫn là `<table>`/card-list không phân
   trang/sắp xếp/bulk-action. Nếu danh sách địa điểm/đánh giá tăng lên vài trăm dòng sẽ cần thêm
   pagination + sort theo cột.
9. **Thêm chart cho users/reviews** — `activity-chart.tsx` mới chỉ có 1 chart tổng quan ở trang chủ.
   Có thể thêm biểu đồ tương tự (rating trung bình theo thời gian, top địa điểm được xem nhiều) ở trang
   riêng nếu cần báo cáo sâu hơn.

## Ưu tiên nếu làm tiếp (ROI theo thời gian bỏ ra)
1. Dark mode cho webapp (rẻ, hạ tầng có sẵn, tác động demo rõ)
2. `Hero` animation cho ảnh place ở Flutter app (rẻ, hiệu ứng rất rõ)
3. Illustration cho empty state (trung bình, cần tìm/tải asset)
4. framer-motion + shared-element transition (tốn công nhất, để sau cùng)
