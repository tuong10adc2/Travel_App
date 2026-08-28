import { Timestamp } from "firebase-admin/firestore";
import { adminDb, adminMessaging } from "@/lib/firebase-admin";

// Port từ functions/src/index.ts (remindUpcomingItineraries) — bản gốc là Cloud Scheduler
// (onSchedule mỗi ngày 08:00), đổi sang Vercel Cron gọi route này 1 lần/ngày (xem
// webapp/vercel.json). Gửi trực tiếp tới fcmToken đã lưu trên users/{uid}.

export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Timestamp.now();
  const in24h = Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000);
  const in48h = Timestamp.fromMillis(now.toMillis() + 48 * 60 * 60 * 1000);

  const snap = await adminDb
    .collection("itineraries")
    .where("startDate", ">=", in24h)
    .where("startDate", "<", in48h)
    .get();

  let sent = 0;

  for (const itineraryDoc of snap.docs) {
    const itinerary = itineraryDoc.data();
    const userSnap = await adminDb.collection("users").doc(itinerary.userId).get();
    const token = userSnap.data()?.fcmToken;
    if (typeof token !== "string" || !token) continue;

    try {
      await adminMessaging.send({
        token,
        notification: {
          title: "Sắp tới ngày đi rồi!",
          body: `Lịch trình "${itinerary.name ?? "của bạn"}" bắt đầu vào ngày mai.`,
        },
        data: { type: "itinerary_reminder", itineraryId: itineraryDoc.id },
      });
      sent += 1;
    } catch (error) {
      console.error(`api/remind-itineraries: loi gui FCM cho user ${itinerary.userId}`, error);
    }
  }

  return Response.json({ checked: snap.size, sent });
}
