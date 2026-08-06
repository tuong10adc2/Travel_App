# Kế hoạch chức năng & kiến trúc hệ thống
## Dự án: Trợ lý du lịch AI (App + Web + Admin Dashboard)

---

## 1. Tổng quan hệ thống

Hệ thống gồm 3 mặt trận, dùng chung 1 backend/API và 1 database:

| Thành phần | Đối tượng | Nền tảng đề xuất |
|---|---|---|
| **App di động** | Người dùng cuối | Flutter (iOS + Android) |
| **Web** | Người dùng cuối (marketing, SEO, trải nghiệm không cần cài app) | Next.js hoặc Flutter Web |
| **Admin Dashboard** | Đội ngũ vận hành/nội dung | Next.js (React) hoặc Flutter Web riêng |
| **Backend/API** | Dùng chung cho cả 3 | Firebase / Node.js (NestJS) |

Nguyên tắc: **1 backend duy nhất, nhiều client**. App làm trước không có nghĩa là backend tuỳ tiện — nên thiết kế API/DB ngay từ đầu để web và admin cắm vào dùng chung sau này, tránh phải viết lại.

---

## 2. Danh sách chức năng

### 2.1. Chức năng chung (Auth & tài khoản) — dùng cho cả App & Web

- Đăng ký / đăng nhập bằng Email + mật khẩu
- Đăng nhập bằng Google (OAuth)
- Quên mật khẩu / đặt lại mật khẩu
- Quản lý hồ sơ cá nhân (avatar, tên, sở thích du lịch)
- Chọn ngôn ngữ giao diện (đa ngôn ngữ)
- Đăng xuất / xoá tài khoản

### 2.2. App di động & Web (người dùng cuối)

**A. Trang chủ & Khám phá**
- Ô tìm kiếm điểm đến (theo tên, khu vực, loại hình)
- Danh sách địa điểm nổi bật (card: ảnh, tên, rating, thời gian, khoảng cách)
- Lọc theo tag: Lịch sử / Thiên nhiên / Ẩm thực / Văn hoá...
- Gợi ý "phổ biến" / "xu hướng"
- Bản đồ tương tác (xem địa điểm trên map)

**B. Trợ lý AI (Chat)**
- Chat hỏi đáp về lịch sử, văn hoá, ẩm thực, địa điểm ẩn
- AI gợi ý địa điểm theo sở thích cá nhân (trả về card địa điểm, không chỉ text)
- Lưu lịch sử hội thoại
- Hỗ trợ đa ngôn ngữ trong chat

**C. Trải nghiệm VR 360°**
- Xem ảnh/video 360° tại từng địa điểm (xoay, pinch-zoom, hỗ trợ gyroscope)
- Danh sách các điểm có "VR miễn phí"
- Xem trước điểm đến trước khi đặt chân tới

**D. Chi tiết địa điểm / Tour**
- Ảnh, mô tả, rating, review
- Thời gian tham quan ước tính, khoảng cách
- Giờ mở cửa, giá vé (nếu có)
- Nút "Xem hành trình" / "Trải nghiệm VR"

**E. Lịch trình (Itinerary)**
- Tạo lịch trình cá nhân theo ngày
- AI tự động đề xuất lộ trình tối ưu (thời tiết, mật độ đám đông, thời gian di chuyển)
- Thêm / xoá / sắp xếp lại điểm đến (kéo-thả)
- Chia sẻ lịch trình

**F. Đã lưu / Yêu thích**
- Bookmark địa điểm/tour để xem sau

**G. Đánh giá & bình luận**
- Viết review, chấm sao, đăng ảnh

**H. Thông báo**
- Push notification (gợi ý mới, nhắc lịch trình, khuyến mãi)

**I. Cài đặt**
- Ngôn ngữ, quyền riêng tư, quản lý tài khoản

### 2.3. Admin Dashboard (nội bộ)

**A. Quản lý người dùng**
- Danh sách, tìm kiếm, khoá/mở tài khoản
- Xem lịch sử hoạt động (đặt lịch, review...)

**B. Quản lý địa điểm/tour**
- CRUD: tên, mô tả, ảnh, toạ độ, tag, giờ mở cửa, giá vé
- Gắn ảnh/video 360° vào từng địa điểm
- Duyệt/ẩn địa điểm

**C. Quản lý nội dung nổi bật**
- Chọn địa điểm "phổ biến" / "xu hướng" hiển thị trang chủ
- Quản lý banner, tin tức, bài viết

**D. Quản lý đánh giá**
- Duyệt / ẩn / xoá review vi phạm

**E. Thống kê & báo cáo (Analytics)**
- Số người dùng mới, lượt xem địa điểm, địa điểm hot
- Thống kê sử dụng chat AI (số lượt hỏi, câu hỏi phổ biến)
- Biểu đồ theo thời gian

**F. Quản lý AI**
- Cấu hình system prompt cho trợ lý AI
- Giới hạn usage (rate limit) theo user
- Xem log hội thoại để cải thiện chất lượng

**G. Quản lý thông báo đẩy**
- Soạn & gửi push notification theo nhóm người dùng

**H. Phân quyền nội bộ**
- Roles: Super Admin / Content Editor / Support
- Nhật ký thao tác (audit log)

---

## 3. Sơ đồ kiến trúc hệ thống

Xem file **kien-truc-he-thong.mermaid** — mô tả cách App, Web, Admin cùng gọi chung 1 Backend API, Backend kết nối Database, Storage, và các dịch vụ ngoài (AI, Maps, Push).

## 4. Sơ đồ cơ sở dữ liệu (ERD)

Xem file **erd-database.mermaid** — các collection chính trong Firestore: `users`, `places`, `media_360`, `tours`, `itineraries`, `itinerary_items`, `reviews`, `saved_places`, `chat_history` (itinerary_items có thể để dạng sub-collection của itineraries).

## 5. Sơ đồ luồng người dùng chính

Xem file **luong-nguoi-dung.mermaid** — hành trình từ mở app → đăng nhập → khám phá/chat AI → xem chi tiết → lưu/thêm lịch trình → lên đường.

---

## 6. Tech stack đề xuất

| Lớp | Công nghệ |
|---|---|
| Mobile App | Flutter |
| Web (người dùng) | Next.js (SEO tốt cho landing + trang địa điểm) |
| Admin Dashboard | Next.js + shadcn/ui (làm nhanh, nhiều component sẵn) |
| Backend/API | Firebase (Cloud Firestore + Authentication + Storage + Cloud Functions) — hoặc NestJS nếu cần logic phức tạp hơn |
| Database | Cloud Firestore (NoSQL, document-based) |
| AI | Claude API — gọi qua Cloud Function, **không gọi trực tiếp từ client** để giấu API key và kiểm soát chi phí |
| Bản đồ | Google Maps API / Mapbox |
| VR 360° | Package `panorama` (Flutter) cho ảnh equirectangular |
| Push notification | Firebase Cloud Messaging (FCM) |
| Lưu trữ ảnh/video | Firebase Storage |

**Lý do chọn Firebase**: có sẵn Auth + Firestore + Storage + Cloud Functions + FCM trong cùng 1 hệ sinh thái, tích hợp Flutter cực tốt (FlutterFire), tiết kiệm thời gian tự viết backend. Khi làm Admin/Web sau, chỉ cần dùng chung Firebase SDK/Admin SDK để cắm vào cùng project, không phải xây lại từ đầu. Lưu ý: Firestore là NoSQL document-based nên khi thiết kế dữ liệu cần nghĩ theo **collection/document** thay vì bảng/quan hệ như SQL — cân nhắc denormalize dữ liệu để tối ưu số lượt đọc.

---

## 7. Lộ trình đề xuất

1. **Giai đoạn 1 — App khung sườn**: Auth + màn Trang chủ/Khám phá (data seed cứng) + Chi tiết địa điểm
2. **Giai đoạn 2 — AI & VR**: Tích hợp chat AI (qua backend) + VR 360° cho 2-3 địa điểm demo
3. **Giai đoạn 3 — Lịch trình & tương tác**: Itinerary, Lưu, Review
4. **Giai đoạn 4 — Admin Dashboard**: CRUD địa điểm, quản lý user, thống kê cơ bản
5. **Giai đoạn 5 — Web**: Tái sử dụng API đã có, build landing + trang trải nghiệm cho web (ưu tiên SEO)

