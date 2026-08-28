import Anthropic from "@anthropic-ai/sdk";
import { adminDb, verifyRequestAuth, UnauthorizedError } from "@/lib/firebase-admin";
import { computeGeoItinerary, type GeoPoint, type DayPlan } from "@/lib/itinerary-planner";

// Port từ functions/src/index.ts (chatWithAssistant) — Cloud Function cũ chặn bởi Blaze.
// Logic giữ nguyên 1:1 (system prompt, 2 tool, agent loop 2 lượt, prompt caching), chỉ đổi
// đường truyền: httpsCallable() -> HTTP POST + Firebase ID token verify bằng Admin SDK.

export const maxDuration = 60;

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

function isChatTurn(value: unknown): value is ChatTurn {
  if (typeof value !== "object" || value === null) return false;
  const turn = value as Record<string, unknown>;
  return (
    (turn.role === "user" || turn.role === "assistant") &&
    typeof turn.content === "string" &&
    turn.content.trim().length > 0
  );
}

export async function POST(request: Request) {
  let uid: string;
  try {
    uid = await verifyRequestAuth(request);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ error: "Bạn cần đăng nhập để trò chuyện với trợ lý du lịch." }, { status: 401 });
    }
    throw error;
  }
  void uid;

  const body = (await request.json().catch(() => null)) as { message?: string; history?: unknown } | null;
  const message = body?.message?.trim();
  if (!message) {
    return Response.json({ error: "Thiếu nội dung tin nhắn." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return Response.json({ error: `Tin nhắn quá dài (tối đa ${MAX_MESSAGE_LENGTH} ký tự).` }, { status: 400 });
  }

  const history = Array.isArray(body?.history)
    ? body.history.filter(isChatTurn).slice(-MAX_HISTORY_TURNS)
    : [];

  try {
    const placesSnap = await adminDb.collection("places").where("isActive", "==", true).get();
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

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
        return Response.json({ error: "Trợ lý không thể trả lời yêu cầu này." }, { status: 422 });
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

      conversation.push({ role: "assistant", content: response.content });
      conversation.push({ role: "user", content: toolResultBlocks });
    }

    return Response.json({ reply: reply.trim(), suggestedPlaceIds, itineraryPlan });
  } catch (error) {
    console.error("api/chat: loi khi goi Claude API", error);
    return Response.json({ error: "Đã có lỗi khi gọi trợ lý AI. Vui lòng thử lại." }, { status: 500 });
  }
}
