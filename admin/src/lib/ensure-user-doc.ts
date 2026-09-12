import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase";

/**
 * Tạo `users/{uid}` nếu chưa tồn tại — cần cho lần đầu 1 tài khoản Google đăng
 * nhập vào Admin (không có màn Đăng ký riêng). Role mặc định 'user' (KHÔNG có
 * quyền admin) — sau khi tạo, chủ dự án phải tự sửa field `role` trong Firestore
 * Console thành 'admin'/'content_editor'/'support' cho đúng tài khoản Gmail
 * muốn cấp quyền quản trị.
 */
export async function ensureUserDoc(user: User): Promise<void> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(ref, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName ?? "",
    phoneNumber: user.phoneNumber ?? null,
    role: "user",
    preferences: [],
    language: "vi",
    isDisabled: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
