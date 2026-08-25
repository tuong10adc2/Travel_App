/**
 * Firestore trả về Timestamp cho các trường createdAt/updatedAt, nhưng type
 * ở lib/types.ts khai báo `unknown` (vì đôi khi field chưa kịp ghi bởi
 * serverTimestamp() và còn là null khi đọc optimistic). Hàm này quy đổi an
 * toàn sang số mili-giây để dùng trong so sánh/sắp xếp.
 */
export function toMillis(value: unknown): number {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }
  return 0;
}
