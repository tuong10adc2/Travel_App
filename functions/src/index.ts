import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentWritten } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import Anthropic from "@anthropic-ai/sdk";
import { computeGeoItinerary, type GeoPoint, type DayPlan } from "./itinerary-planner";

initializeApp();
const db = getFirestore();

const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");

const MAX_MESSAGE_LENGTH = 4000;
const MAX_HISTORY_TURNS = 20;
const MAX_TOOL_ROUND_TRIPS = 2;

const SUGGEST_PLACES_TOOL: Anthropic.Tool = {
  name: "suggest_places",
  description:
    "Hiển thị thẻ thông tin cho một hoặc nhiều địa điểm CỤ THỂ trong danh sách địa điểm đã cung cấp ở system prompt. " +
    "Chỉ gọi khi bạn thực sự muốn giới thiệu (các) địa điểm rõ ràng — không gọi cho câu hỏi chung chung, câu chào hỏi, " +
    "hay khi không có địa điểm nào trong danh sách phù hợp với yêu cầu. " +
    "Nếu người dùng muốn LẬP LỊCH TRÌNH nhiều ngày, dùng tool plan_itinerary thay vì tool này.",
  input_schema: {
    type: "object",
    properties: {
      placeIds: {
        type: "array",
        items: { type: "string" },
        description: "Id địa điểm (lấy đúng nguyên văn từ danh sách đã cung cấp), tối đa 5 địa điểm mỗi lượt.",
      },
    },
    required: ["placeIds"],
  },
};

const PLAN_ITINERARY_TOOL: Anthropic.Tool = {
  name: "plan_itinerary",
  description:
    "Lập lịch trình nhiều ngày cho các địa điểm đã chọn. Gọi tool này khi người dùng muốn LÊN KẾ HOẠCH/LỊCH TRÌNH " +
    "cụ thể theo ngày (vd: 'lên lịch 3 ngày ở Sa Pa'), không dùng cho câu hỏi gợi ý địa điểm đơn thuần. " +
    "Bạn chỉ cần chọn các địa điểm phù hợp sở thích người dùng — server sẽ tự nhóm theo khu vực địa lý và sắp thứ tự " +
    "di chuyển hợp lý trong từng ngày, bạn không cần tự đoán khoảng cách hay thứ tự.",
  input_schema: {
    type: "object",
    properties: {
      placeIds: {
        type: "array",
        items: { type: "string" },
        description: "Id các địa điểm đưa vào lịch trình (lấy đúng nguyên văn từ danh sách đã cung cấp), tối đa 15 địa điểm.",
      },
      days: {
        type: "number",
        description: "Số ngày của lịch trình (số nguyên dương).",
      },
    },
    required: ["placeIds", "days"],
  },
};

function buildSystemPrompt(placesList: string): string {
  return `Bạn là trợ lý du lịch AI trong ứng dụng "TngGuide" — giúp người dùng khám phá địa điểm và lên kế hoạch du lịch tại Việt Nam.

Nguyên tắc trả lời:
- Trả lời ngắn gọn, thân thiện, đúng trọng tâm, bằng tiếng Việt (trừ khi người dùng chủ động nhắn tiếng Anh).
- Chỉ tư vấn các chủ đề du lịch: địa điểm, lịch trình, ẩm thực, văn hoá, mẹo di chuyển. Với câu hỏi ngoài phạm vi du lịch, lịch sự từ chối và gợi ý quay lại chủ đề du lịch.
- Khi muốn giới thiệu (các) địa điểm cụ thể có trong "Danh sách địa điểm hiện có" bên dưới, PHẢI gọi tool suggest_places với đúng id — không tự liệt kê tên địa điểm suông trong văn bản trả lời (văn bản chỉ nên giải thích ngắn gọn vì sao gợi ý).
- Khi người dùng muốn LẬP LỊCH TRÌNH cụ thể nhiều ngày (vd "lên lịch 3 ngày ở Sa Pa"), PHẢI gọi tool plan_itinerary thay vì suggest_places — chỉ cần chọn đúng địa điểm phù hợp, KHÔNG tự sắp xếp thứ tự hay đoán khoảng cách, server sẽ tính bằng toạ độ thật rồi trả lại cho bạn để bạn diễn giải bằng lời.
- Chỉ được gợi ý địa điểm có trong danh sách bên dưới. Không bịa thêm địa điểm, giá vé, hay thông tin không có trong danh sách.
- Không phải câu hỏi nào cũng cần gợi ý địa điểm — chỉ gọi tool khi người dùng thực sự đang tìm địa điểm để đi.

Danh sách địa điểm hiện có (id | tên | tags | mô tả ngắn):
${placesList || "(hiện chưa có địa điểm nào trong hệ thống)"}`;
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestData {
  message: string;
  history?: ChatTurn[];
}

function isChatTurn(value: unknown): value is ChatTurn {
  if (typeof value !== "object" || value === null) return false;
  const turn = value as Record<string, unknown>;
  return (
    (turn.role === "user" || turn.role === "assistant") &&
    typeof turn.content === "string" &&
    turn.content.trim().length > 0
  );
}

export const chatWithAssistant = onCall(
  { secrets: [anthropicApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Bạn cần đăng nhập để trò chuyện với trợ lý du lịch."
      );
    }

    const data = request.data as ChatRequestData;
    const message = data?.message?.trim();
    if (!message) {
      throw new HttpsError("invalid-argument", "Thiếu nội dung tin nhắn.");
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      throw new HttpsError(
        "invalid-argument",
        `Tin nhắn quá dài (tối đa ${MAX_MESSAGE_LENGTH} ký tự).`
      );
    }

    const history = Array.isArray(data?.history)
      ? data.history.filter(isChatTurn).slice(-MAX_HISTORY_TURNS)
      : [];

    try {
      // Lấy danh sách địa điểm hiện có để nhét vào system prompt — luôn khớp
      // dữ liệu thật, và cũng dùng để lọc lại placeIds hợp lệ từ tool_use.
      const placesSnap = await db.collection("places").where("isActive", "==", true).get();
      const validPlaceIds = new Set(placesSnap.docs.map((doc) => doc.id));
      const placesLocationById = new Map<string, GeoPoint>();
      const placesList = placesSnap.docs
        .map((doc) => {
          const d = doc.data();
          const tags = Array.isArray(d.tags) ? d.tags.join(", ") : "";
          const location = d.location as { latitude?: number; longitude?: number } | undefined;
          if (location && typeof location.latitude === "number" && typeof location.longitude === "number") {
            placesLocationById.set(doc.id, { id: doc.id, lat: location.latitude, lng: location.longitude });
          }
          return `- ${doc.id} | ${d.name ?? ""} | ${tags} | ${d.description ?? ""}`;
        })
        .join("\n");

      const client = new Anthropic({ apiKey: anthropicApiKey.value() });

      // system dạng block (thay vì string thuần) để bật prompt caching — danh sách địa điểm
      // không đổi giữa các lượt trong cùng 1 phiên, cache lại giúp giảm cả độ trễ lẫn chi phí.
      const systemBlocks: Anthropic.TextBlockParam[] = [
        {
          type: "text",
          text: buildSystemPrompt(placesList),
          cache_control: { type: "ephemeral" },
        },
      ];

      const conversation: Anthropic.MessageParam[] = [
        ...history.map((turn) => ({
          role: turn.role,
          content: turn.content,
        })),
        { role: "user" as const, content: message },
      ];

      let reply = "";
      const suggestedPlaceIds: string[] = [];
      let itineraryPlan: DayPlan[] | null = null;

      // Vòng lặp agent tối đa MAX_TOOL_ROUND_TRIPS lượt: nếu model gọi plan_itinerary, server
      // tính toán bằng thuật toán (không phải LLM đoán khoảng cách) rồi gửi kết quả lại cho model
      // ở lượt kế tiếp để model diễn giải bằng lời. suggest_places không cần vòng lặp (server tự
      // trả placeIds cho client render card, không cần model nói thêm gì dựa trên kết quả đó).
      for (let turn = 0; turn < MAX_TOOL_ROUND_TRIPS; turn++) {
        const response = await client.messages.create({
          model: "claude-opus-5",
          max_tokens: 1024,
          system: systemBlocks,
          thinking: { type: "adaptive" },
          output_config: { effort: "medium" },
          tools: [SUGGEST_PLACES_TOOL, PLAN_ITINERARY_TOOL],
          messages: conversation,
        });

        if (response.stop_reason === "refusal") {
          throw new HttpsError(
            "failed-precondition",
            "Trợ lý không thể trả lời yêu cầu này."
          );
        }

        let calledPlanItinerary = false;
        const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];

        for (const block of response.content) {
          if (block.type === "text") {
            reply += block.text;
          } else if (block.type === "tool_use" && block.name === "suggest_places") {
            const input = block.input as { placeIds?: unknown };
            if (Array.isArray(input.placeIds)) {
              for (const id of input.placeIds) {
                // Chỉ giữ id thật sự tồn tại — phòng trường hợp model "bịa" id.
                if (typeof id === "string" && validPlaceIds.has(id)) {
                  suggestedPlaceIds.push(id);
                }
              }
            }
            toolResultBlocks.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: "Đã ghi nhận gợi ý địa điểm.",
            });
          } else if (block.type === "tool_use" && block.name === "plan_itinerary") {
            const input = block.input as { placeIds?: unknown; days?: unknown };
            const ids = Array.isArray(input.placeIds)
              ? input.placeIds.filter((id): id is string => typeof id === "string" && validPlaceIds.has(id))
              : [];
            const days = typeof input.days === "number" && input.days > 0 ? Math.min(Math.round(input.days), 14) : 1;
            itineraryPlan = computeGeoItinerary(ids, days, placesLocationById);
            calledPlanItinerary = true;
            toolResultBlocks.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify({ days: itineraryPlan }),
            });
          }
        }

        if (!calledPlanItinerary || toolResultBlocks.length === 0 || turn === MAX_TOOL_ROUND_TRIPS - 1) {
          break;
        }

        // Phải giữ nguyên response.content (kể cả block thinking) khi tiếp tục hội thoại — API
        // yêu cầu vậy khi có extended thinking + tool use.
        conversation.push({ role: "assistant", content: response.content });
        conversation.push({ role: "user", content: toolResultBlocks });
      }

      return { reply: reply.trim(), suggestedPlaceIds, itineraryPlan };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("chatWithAssistant: loi khi goi Claude API", error);
      throw new HttpsError(
        "internal",
        "Đã có lỗi khi gọi trợ lý AI. Vui lòng thử lại."
      );
    }
  }
);

const FLAG_REVIEW_TOOL: Anthropic.Tool = {
  name: "flag_review",
  description:
    "Đánh dấu đánh giá này nếu là spam, quảng cáo, ngôn từ thù ghét/tục tĩu, hoặc hoàn toàn không liên quan " +
    "tới địa điểm/tour du lịch. Đánh giá tiêu cực nhưng lịch sự và đúng chủ đề (chê địa điểm) KHÔNG bị đánh dấu.",
  input_schema: {
    type: "object",
    properties: {
      flagged: { type: "boolean", description: "true nếu cần admin xem lại trước khi duyệt." },
      reason: { type: "string", description: "Lý do ngắn gọn, chỉ cần khi flagged=true." },
    },
    required: ["flagged"],
  },
};

/**
 * Tiền duyệt bằng AI: chạy song song với hàng đợi duyệt thủ công ở Admin, không tự động
 * ẩn/xoá gì cả — chỉ gắn nhãn gợi ý (`aiModeration`) để content editor ưu tiên xem trước.
 * Quyết định cuối vẫn luôn là con người, đúng tinh thần rule Firestore hiện tại.
 */
export const moderateReviewOnCreate = onDocumentCreated(
  { document: "reviews/{reviewId}", secrets: [anthropicApiKey] },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data();
    const comment = typeof data.comment === "string" ? data.comment.trim() : "";
    if (!comment) return;

    try {
      const client = new Anthropic({ apiKey: anthropicApiKey.value() });
      const response = await client.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 256,
        system:
          "Bạn là bộ lọc kiểm duyệt đánh giá cho ứng dụng du lịch TngGuide. Đọc nội dung đánh giá rồi gọi " +
          "tool flag_review để phân loại.",
        tools: [FLAG_REVIEW_TOOL],
        tool_choice: { type: "tool", name: "flag_review" },
        messages: [
          {
            role: "user",
            content: `Số sao: ${typeof data.rating === "number" ? data.rating : "?"}\nNội dung: ${comment}`,
          },
        ],
      });

      const block = response.content.find(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "flag_review"
      );
      if (!block) return;

      const input = block.input as { flagged?: unknown; reason?: unknown };
      await snap.ref.update({
        aiModeration: {
          flagged: input.flagged === true,
          reason: typeof input.reason === "string" ? input.reason : null,
          checkedAt: FieldValue.serverTimestamp(),
        },
      });
    } catch (error) {
      // Lỗi kiểm duyệt AI không được chặn việc đánh giá lên hàng chờ duyệt thủ công bình thường.
      logger.error("moderateReviewOnCreate: loi khi goi Claude API", error);
    }
  }
);

/**
 * Push notification #1 (Giai đoạn 9): báo địa điểm mới khi admin duyệt (isActive false -> true),
 * kể cả khi địa điểm đó vừa được pipeline nhập tự động tạo nháp rồi duyệt. Gửi theo topic
 * `new_places` — client tự subscribe topic này ngay sau khi đăng nhập
 * (`PushNotificationService.init()` phía Flutter).
 */
export const notifyNewPlace = onDocumentWritten("places/{placeId}", async (event) => {
  const before = event.data?.before.exists ? event.data.before.data() : null;
  const after = event.data?.after.exists ? event.data.after.data() : null;
  if (!after) return; // đã xoá, không cần thông báo

  const becameActive = after.isActive === true && before?.isActive !== true;
  if (!becameActive) return;

  try {
    await getMessaging().send({
      topic: "new_places",
      notification: {
        title: "Địa điểm mới trên TngGuide",
        body: `Khám phá ngay: ${after.name ?? "một địa điểm mới"}`,
      },
      data: { type: "new_place", placeId: event.params.placeId },
    });
  } catch (error) {
    logger.error("notifyNewPlace: loi khi gui FCM", error);
  }
});

/**
 * Push notification #2 (Giai đoạn 9): nhắc lịch trình sắp tới, chạy mỗi ngày 08:00 giờ máy chủ.
 * Gửi trực tiếp tới `fcmToken` đã lưu trên `users/{uid}` (không dùng topic vì mỗi thông báo
 * chỉ dành riêng cho 1 user).
 */
export const remindUpcomingItineraries = onSchedule("every day 08:00", async () => {
  const now = Timestamp.now();
  const in24h = Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000);
  const in48h = Timestamp.fromMillis(now.toMillis() + 48 * 60 * 60 * 1000);

  const snap = await db
    .collection("itineraries")
    .where("startDate", ">=", in24h)
    .where("startDate", "<", in48h)
    .get();

  for (const itineraryDoc of snap.docs) {
    const itinerary = itineraryDoc.data();
    const userSnap = await db.collection("users").doc(itinerary.userId).get();
    const token = userSnap.data()?.fcmToken;
    if (typeof token !== "string" || !token) continue;

    try {
      await getMessaging().send({
        token,
        notification: {
          title: "Sắp tới ngày đi rồi!",
          body: `Lịch trình "${itinerary.name ?? "của bạn"}" bắt đầu vào ngày mai.`,
        },
        data: { type: "itinerary_reminder", itineraryId: itineraryDoc.id },
      });
    } catch (error) {
      logger.error(`remindUpcomingItineraries: loi gui FCM cho user ${itinerary.userId}`, error);
    }
  }
});
