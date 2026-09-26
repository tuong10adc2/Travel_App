import { adminDb, adminMessaging, verifyRequestAuth, UnauthorizedError } from "@/lib/firebase-admin";

// Port từ functions/src/index.ts (notifyNewPlace) — bản gốc là Firestore trigger
// (onDocumentWritten trên places/{placeId}), Vercel không có trigger kiểu này nên đổi sang
// gọi trực tiếp từ code Admin dashboard ngay sau khi bật isActive: true; server kiểm tra role.

export const maxDuration = 30;

// Gọi cross-origin từ admin/ (deploy riêng, domain khác) — an ninh thật nằm ở việc verify
// Firebase ID token bên dưới, không phải ở CORS, nên cho phép mọi origin gọi route này.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

function jsonWithCors(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { ...CORS_HEADERS, ...init?.headers } });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  let uid: string;
  try {
    uid = await verifyRequestAuth(request);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonWithCors({ error: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }

  // Chỉ admin/content_editor mới được gửi thông báo tới toàn bộ người dùng — trước đây chỉ cần
  // "đã đăng nhập" nên user thường cũng gọi được (leo thang đặc quyền). Khớp rule Firestore
  // isContentEditor().
  const role = (await adminDb.collection("users").doc(uid).get()).data()?.role;
  if (role !== "admin" && role !== "content_editor") {
    return jsonWithCors({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { placeId?: string; placeName?: string } | null;
  const placeId = body?.placeId;
  if (!placeId) {
    return jsonWithCors({ error: "Thiếu placeId." }, { status: 400 });
  }

  try {
    await adminMessaging.send({
      topic: "new_places",
      notification: {
        title: "Địa điểm mới trên TngGuide",
        body: `Khám phá ngay: ${body?.placeName ?? "một địa điểm mới"}`,
      },
      data: { type: "new_place", placeId },
    });
    return jsonWithCors({ ok: true });
  } catch (error) {
    console.error("api/notify-new-place: loi khi gui FCM", error);
    return jsonWithCors({ error: "Không gửi được thông báo." }, { status: 500 });
  }
}
