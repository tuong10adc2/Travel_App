import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase";

/**
 * Tạo `users/{uid}` khớp field bắt buộc trong `firestore.rules` (role mặc định
 * 'user', isDisabled = false) nếu chưa tồn tại — gọi ngay sau khi đăng nhập
 * Google lần đầu, vì không còn màn Đăng ký riêng để làm việc này.
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
