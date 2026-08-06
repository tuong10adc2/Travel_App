import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import Anthropic from "@anthropic-ai/sdk";

initializeApp();
const db = getFirestore();

const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");

const MAX_MESSAGE_LENGTH = 4000;
const MAX_HISTORY_TURNS = 20;

const SUGGEST_PLACES_TOOL: Anthropic.Tool = {
  name: "suggest_places",
  description:
    "Hiển thị thẻ thông tin cho một hoặc nhiều địa điểm CỤ THỂ trong danh sách địa điểm đã cung cấp ở system prompt. " +
    "Chỉ gọi khi bạn thực sự muốn giới thiệu (các) địa điểm rõ ràng — không gọi cho câu hỏi chung chung, câu chào hỏi, " +
    "hay khi không có địa điểm nào trong danh sách phù hợp với yêu cầu.",
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

function buildSystemPrompt(placesList: string): string {
  return `Bạn là trợ lý du lịch AI trong ứng dụng "Trợ lý du lịch AI" — giúp người dùng khám phá địa điểm và lên kế hoạch du lịch tại Việt Nam.

Nguyên tắc trả lời:
- Trả lời ngắn gọn, thân thiện, đúng trọng tâm, bằng tiếng Việt (trừ khi người dùng chủ động nhắn tiếng Anh).
- Chỉ tư vấn các chủ đề du lịch: địa điểm, lịch trình, ẩm thực, văn hoá, mẹo di chuyển. Với câu hỏi ngoài phạm vi du lịch, lịch sự từ chối và gợi ý quay lại chủ đề du lịch.
- Khi muốn giới thiệu (các) địa điểm cụ thể có trong "Danh sách địa điểm hiện có" bên dưới, PHẢI gọi tool suggest_places với đúng id — không tự liệt kê tên địa điểm suông trong văn bản trả lời (văn bản chỉ nên giải thích ngắn gọn vì sao gợi ý).
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
      const placesList = placesSnap.docs
        .map((doc) => {
          const d = doc.data();
          const tags = Array.isArray(d.tags) ? d.tags.join(", ") : "";
          return `- ${doc.id} | ${d.name ?? ""} | ${tags} | ${d.description ?? ""}`;
        })
        .join("\n");

      const client = new Anthropic({ apiKey: anthropicApiKey.value() });

      const response = await client.messages.create({
        model: "claude-opus-5",
        max_tokens: 1024,
        system: buildSystemPrompt(placesList),
        thinking: { type: "adaptive" },
        output_config: { effort: "medium" },
        tools: [SUGGEST_PLACES_TOOL],
        messages: [
          ...history.map((turn) => ({
            role: turn.role,
            content: turn.content,
          })),
          { role: "user" as const, content: message },
        ],
      });

      if (response.stop_reason === "refusal") {
        throw new HttpsError(
          "failed-precondition",
          "Trợ lý không thể trả lời yêu cầu này."
        );
      }

      let reply = "";
      const suggestedPlaceIds: string[] = [];
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
        }
      }

      return { reply: reply.trim(), suggestedPlaceIds };
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
