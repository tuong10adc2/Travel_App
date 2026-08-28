import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

// Dùng khi Cloud Functions (cần Blaze) không deploy được — các API route trong
// webapp/ tự verify Firebase ID token + đọc/ghi Firestore bằng Admin SDK thay
// vì Cloud Functions. Đọc/ghi Firestore qua Admin SDK không cần Blaze, chỉ
// Cloud Functions/Cloud Run mới cần.
function getAdminApp(): App {
  const existing = getApps();
  if (existing.length) return existing[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "Thiếu biến môi trường FIREBASE_SERVICE_ACCOUNT_KEY (nội dung JSON của service account key, xem Firebase Console → Project Settings → Service Accounts)."
    );
  }

  const serviceAccount = JSON.parse(raw) as {
    project_id: string;
    client_email: string;
    private_key: string;
  };

  return initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
  });
}

// Khởi tạo lười (lazy) — không được chạy `getAdminApp()` ở top-level, vì Next.js import module
// này lúc build ("Collecting page data") để đọc route config (maxDuration...), mà lúc build cục
// bộ chưa có FIREBASE_SERVICE_ACCOUNT_KEY (biến này chỉ set trên Vercel) sẽ làm build fail.
// Proxy hoãn việc gọi getAdminApp()/getAuth()/getFirestore() tới tận lúc route thật sự truy cập
// 1 method (vd adminDb.collection(...)) — không đổi cách gọi ở các route đã viết. Bind method vào
// đúng `instance` thật (không phải Proxy) vì SDK Admin dùng private field (#...), gọi với `this`
// sai sẽ throw.
function lazyProxy<T extends object>(create: () => T): T {
  let instance: T | undefined;
  return new Proxy({} as T, {
    get(_target, prop) {
      instance ??= create();
      const value = Reflect.get(instance, prop);
      return typeof value === "function" ? value.bind(instance) : value;
    },
  });
}

export const adminAuth = lazyProxy(() => getAuth(getAdminApp()));
export const adminDb = lazyProxy(() => getFirestore(getAdminApp()));
export const adminMessaging = lazyProxy(() => getMessaging(getAdminApp()));

export class UnauthorizedError extends Error {}

/** Verify Firebase ID token từ header Authorization: Bearer <token>. Ném UnauthorizedError nếu thiếu/sai. */
export async function verifyRequestAuth(request: Request): Promise<string> {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) {
    throw new UnauthorizedError("Thiếu token xác thực.");
  }
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    throw new UnauthorizedError("Token không hợp lệ hoặc đã hết hạn.");
  }
}
