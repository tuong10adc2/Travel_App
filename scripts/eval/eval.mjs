// Eval harness cho trợ lý AI (`/api/chat`) — thay cho việc test tay bằng route API tạm
// (cách đã dùng suốt quá trình phát triển: tạo route tạm mint-test-token/seed-test-user,
// curl, rồi xoá route). Script này đóng gói lại chính quy trình đó thành 1 công cụ dùng
// lại được nhiều lần, kiểm tra bằng rule cụ thể (không cần LLM-judge) cho từng khía cạnh
// đã cố ý thiết kế trong hệ thống: grounding (không bịa địa điểm), guardrail (từ chối câu
// hỏi ngoài chủ đề), cá nhân hoá, và lịch trình có giờ giấc.
//
// Chạy: cd scripts/eval && npm install && FIREBASE_SERVICE_ACCOUNT_KEY='...' npm run eval
// (lấy FIREBASE_SERVICE_ACCOUNT_KEY từ Vercel — Settings > Environment Variables của project webapp)

import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const CHAT_API_BASE_URL = process.env.CHAT_API_BASE_URL || "https://travel-app-6rww.vercel.app";
// API key public phía client (không nhạy cảm — đã có sẵn trong webapp/.env.local và bundle công khai).
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyDHn-Eio0vVPfzWR6PS1t347Bg23AfNrK0";
const EVAL_UID = "eval-harness-test-user";

const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!rawKey) {
  console.error("Thiếu biến môi trường FIREBASE_SERVICE_ACCOUNT_KEY (JSON service account key).");
  process.exit(1);
}
const serviceAccount = JSON.parse(rawKey);
const app = initializeApp({
  credential: cert({
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key,
  }),
});
const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

async function ensureUserDoc(overrides = {}) {
  await adminDb.collection("users").doc(EVAL_UID).set(
    {
      uid: EVAL_UID,
      email: "eval-harness@example.com",
      displayName: "Eval Harness",
      role: "user",
      preferences: [],
      language: "vi",
      isDisabled: false,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      ...overrides,
    },
    { merge: true }
  );
}

async function getIdToken() {
  const customToken = await adminAuth.createCustomToken(EVAL_UID);
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!data.idToken) throw new Error("Không đổi được custom token -> id token: " + JSON.stringify(data));
  return data.idToken;
}

async function callChat(idToken, message, history = []) {
  const res = await fetch(`${CHAT_API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ message, history }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`/api/chat trả lỗi ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function loadPlacesById() {
  const snap = await adminDb.collection("places").where("isActive", "==", true).get();
  const byId = new Map();
  snap.docs.forEach((doc) => byId.set(doc.id, doc.data()));
  return byId;
}

const TIME_RE = /^\d{2}:\d{2}$/;

async function main() {
  await ensureUserDoc();
  const placesById = await loadPlacesById();
  const validPlaceIds = new Set(placesById.keys());

  const cases = [
    {
      name: "grounded_suggestion — gợi ý địa điểm cụ thể chỉ dùng dữ liệu thật",
      message: "Gợi ý cho tôi một địa điểm yên tĩnh, ít đông người",
      assert: (result) => {
        if (result.suggestedPlaceIds.length === 0) return fail("không gợi ý địa điểm nào");
        const invalid = result.suggestedPlaceIds.filter((id) => !validPlaceIds.has(id));
        if (invalid.length > 0) return fail(`gợi ý id không có thật: ${invalid.join(", ")}`);
        return pass();
      },
    },
    {
      name: "tag_match — gợi ý biển đảo phải đúng tag",
      message: "Gợi ý cho tôi một địa điểm biển đảo",
      assert: (result) => {
        if (result.suggestedPlaceIds.length === 0) return fail("không gợi ý địa điểm nào");
        const wrongTag = result.suggestedPlaceIds.filter(
          (id) => !(placesById.get(id)?.tags || []).includes("Biển đảo")
        );
        if (wrongTag.length > 0) return fail(`gợi ý địa điểm không có tag "Biển đảo": ${wrongTag.join(", ")}`);
        return pass();
      },
    },
    {
      name: "no_hallucination — không bịa địa điểm không có trong hệ thống",
      message: "Địa đạo Củ Chi có trong hệ thống của bạn không?",
      assert: (result) => {
        // AI được phép gợi ý địa điểm THAY THẾ có thật (hành vi hữu ích) — chỉ cần không khẳng
        // định sai là "Địa đạo Củ Chi" có trong hệ thống, và không bịa id giả trong gợi ý thay thế.
        const deniesExistence = /chưa có|không có|không tìm thấy|hiện chưa/i.test(result.reply);
        if (!deniesExistence) return fail("reply không phủ nhận rõ ràng — có thể đang bịa là đã có địa điểm này");
        const invalid = result.suggestedPlaceIds.filter((id) => !validPlaceIds.has(id));
        if (invalid.length > 0) return fail(`gợi ý thay thế có id không có thật: ${invalid.join(", ")}`);
        return pass();
      },
    },
    {
      name: "off_topic_guardrail — từ chối câu hỏi ngoài chủ đề du lịch",
      message: "Viết giúp tôi đoạn code Python tính giai thừa",
      assert: (result) => {
        if (result.suggestedPlaceIds.length > 0) return fail("không nên gợi ý địa điểm cho câu hỏi ngoài chủ đề");
        if (result.itineraryPlan) return fail("không nên trả về lịch trình cho câu hỏi ngoài chủ đề");
        if (result.reply.includes("```") || /def\s+\w+\(/.test(result.reply)) {
          return fail("AI có vẻ đã viết code thay vì từ chối");
        }
        return pass();
      },
    },
    {
      name: "itinerary_schedule — lịch trình nhiều ngày có giờ đến hợp lệ",
      message: "Lên lịch trình 2 ngày ở Hội An và Huế",
      assert: (result) => {
        if (!result.itineraryPlan || result.itineraryPlan.length === 0) return fail("không trả về lịch trình");
        if (result.itineraryPlan.length !== 2) return fail(`kỳ vọng 2 ngày, nhận được ${result.itineraryPlan.length}`);
        for (const day of result.itineraryPlan) {
          if (!Array.isArray(day.schedule) || day.schedule.length !== day.placeIds.length) {
            return fail(`ngày ${day.dayIndex}: thiếu schedule cho đủ số địa điểm`);
          }
          for (const stop of day.schedule) {
            if (!TIME_RE.test(stop.arrival)) return fail(`giờ đến không hợp lệ: ${stop.arrival}`);
          }
        }
        return pass();
      },
    },
    {
      name: "personalization — câu hỏi chung chung ưu tiên sở thích đã khai báo",
      setup: () => ensureUserDoc({ preferences: ["Biển đảo"] }),
      message: "Gợi ý cho tôi 1 chỗ hay ho",
      teardown: () => ensureUserDoc({ preferences: [] }),
      assert: (result) => {
        if (result.suggestedPlaceIds.length === 0) return fail("không gợi ý địa điểm nào");
        const matchesPreference = result.suggestedPlaceIds.some((id) =>
          (placesById.get(id)?.tags || []).includes("Biển đảo")
        );
        if (!matchesPreference) return fail("không ưu tiên đúng sở thích đã khai báo (Biển đảo)");
        return pass();
      },
    },
  ];

  let failCount = 0;
  console.log(`Chạy ${cases.length} test case nhắm vào ${CHAT_API_BASE_URL}/api/chat ...\n`);

  for (const testCase of cases) {
    try {
      if (testCase.setup) await testCase.setup();
      const idToken = await getIdToken();
      const result = await callChat(idToken, testCase.message);
      const outcome = testCase.assert(result, { placesById });
      if (testCase.teardown) await testCase.teardown();

      if (outcome.ok) {
        console.log(`✅ PASS — ${testCase.name}`);
      } else {
        failCount++;
        console.log(`❌ FAIL — ${testCase.name}`);
        console.log(`   Lý do: ${outcome.reason}`);
        console.log(`   Reply: ${result.reply.slice(0, 200)}`);
      }
    } catch (error) {
      failCount++;
      console.log(`❌ ERROR — ${testCase.name}`);
      console.log(`   ${error.message}`);
    }
  }

  await adminDb.collection("users").doc(EVAL_UID).delete();

  console.log(`\n${cases.length - failCount}/${cases.length} test case pass.`);
  process.exit(failCount > 0 ? 1 : 0);
}

function pass() {
  return { ok: true };
}
function fail(reason) {
  return { ok: false, reason };
}

main().catch((error) => {
  console.error("Eval harness gặp lỗi không mong muốn:", error);
  process.exit(1);
});
