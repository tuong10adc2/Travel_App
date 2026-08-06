# Thiết kế Firestore Schema

> Dựa trên `erd-database.mermaid`. Firestore là NoSQL document-based nên có denormalize
> một số trường (vd: `ratingAvg`, `ratingCount` trên `places`) để giảm số lượt đọc.

## `users/{uid}`
Doc id = `uid` từ Firebase Auth.

| Field | Type | Ghi chú |
|---|---|---|
| uid | string | trùng doc id |
| email | string | |
| displayName | string | |
| photoURL | string? | |
| phoneNumber | string? | |
| role | string | `user` \| `admin` \| `content_editor` \| `support`, mặc định `user` |
| preferences | array\<string\> | sở thích du lịch, dùng cho AI gợi ý |
| language | string | `vi` \| `en`, mặc định `vi` |
| isDisabled | bool | admin khoá tài khoản |
| createdAt | timestamp | |
| updatedAt | timestamp | |

Sub-collection: `users/{uid}/chat_history/{sessionId}` (xem bên dưới).

## `places/{placeId}`

| Field | Type | Ghi chú |
|---|---|---|
| name | string | |
| description | string | |
| address | string | |
| location | geopoint | |
| tags | array\<string\> | Lịch sử / Thiên nhiên / Ẩm thực / Văn hoá... |
| images | array\<string\> | URL Storage |
| coverImage | string | |
| openingHours | map | vd `{ mon: "08:00-17:00", ... }` |
| ticketPrice | number | 0 nếu miễn phí |
| ratingAvg | number | denormalize từ `reviews` |
| ratingCount | number | denormalize từ `reviews` |
| visitDurationMinutes | number | |
| isFeatured | bool | hiển thị trang chủ |
| isActive | bool | admin duyệt/ẩn |
| has360 | bool | denormalize, true nếu có `media_360` |
| createdBy | string (uid) | |
| createdAt / updatedAt | timestamp | |

## `media_360/{mediaId}`

| Field | Type | Ghi chú |
|---|---|---|
| placeId | string | ref tới `places` |
| type | string | `image` \| `video` |
| url | string | ảnh equirectangular 2:1, Storage URL |
| title | string | tên điểm nhìn |
| order | number | thứ tự hiển thị |
| hotspots | array\<map\> | optional: `{ targetMediaId, yaw, pitch, label }` |
| createdAt | timestamp | |

## `tours/{tourId}`

| Field | Type | Ghi chú |
|---|---|---|
| name | string | |
| description | string | |
| placeIds | array\<string\> | ref tới `places` |
| coverImage | string | |
| price | number | |
| durationDays | number | |
| isActive | bool | |
| createdAt / updatedAt | timestamp | |

## `itineraries/{itineraryId}`

| Field | Type | Ghi chú |
|---|---|---|
| userId | string | chủ sở hữu |
| name | string | |
| startDate | timestamp | |
| endDate | timestamp? | có thể suy ra từ items |
| isShared | bool | |
| shareCode | string? | mã chia sẻ công khai |
| createdAt / updatedAt | timestamp | |

Sub-collection: `itineraries/{itineraryId}/itinerary_items/{itemId}`

| Field | Type | Ghi chú |
|---|---|---|
| placeId | string | ref tới `places` |
| dayIndex | number | ngày thứ mấy trong lịch trình (0-based) |
| order | number | thứ tự trong ngày, dùng cho kéo-thả |
| note | string? | |
| createdAt | timestamp | |

## `reviews/{reviewId}`

| Field | Type | Ghi chú |
|---|---|---|
| placeId | string | ref tới `places` |
| userId | string | ref tới `users` |
| rating | number | 1-5 |
| comment | string | |
| images | array\<string\> | |
| status | string | `pending` \| `approved` \| `hidden`, admin duyệt |
| createdAt / updatedAt | timestamp | |

## `saved_places/{savedId}`

Doc id đề xuất dạng `${userId}_${placeId}` để đảm bảo unique (mỗi user chỉ lưu 1 lần / địa điểm) và dễ query tồn tại bằng `get()` trực tiếp thay vì query.

| Field | Type | Ghi chú |
|---|---|---|
| userId | string | |
| placeId | string | |
| createdAt | timestamp | |

## `users/{uid}/chat_history/{sessionId}`

Sub-collection theo `userId` (đúng yêu cầu checklist Giai đoạn 3).

| Field | Type | Ghi chú |
|---|---|---|
| title | string | tóm tắt phiên chat |
| createdAt / updatedAt | timestamp | |

Sub-collection: `.../chat_history/{sessionId}/messages/{messageId}`

| Field | Type | Ghi chú |
|---|---|---|
| role | string | `user` \| `assistant` |
| content | string | |
| placeCards | array\<map\>? | gợi ý địa điểm dạng card: `{ placeId, name, image, rating }` |
| createdAt | timestamp | |

---

## Index đề xuất (composite)

- `places`: `isActive` + `isFeatured` + `createdAt` (trang chủ)
- `places`: `isActive` + `tags` (array-contains) + `ratingAvg` (lọc theo tag)
- `reviews`: `placeId` + `status` + `createdAt`
- `itinerary_items` (collection group nếu cần truy vấn xuyên itinerary): `placeId`

## Bước tiếp theo

Security Rules (mục tiếp theo trong checklist Giai đoạn 1) sẽ dựa trên field `role` của
`users/{uid}` và `request.auth.uid` khớp `userId`/`createdBy` để phân quyền đọc/ghi.
