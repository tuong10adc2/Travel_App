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
- Nếu có phần "Thông tin cá nhân hoá" bên dưới VÀ câu hỏi của người dùng chung chung, không nêu rõ loại địa điểm (vd "gợi ý cho tôi 1 chỗ hay ho", "đi đâu bây giờ"), thì BẮT BUỘC chọn (các) địa điểm có tag trùng với sở thích/lịch sử nêu trong phần đó — không được chọn địa điểm khác chỉ vì nổi tiếng/điểm đánh giá cao hơn. Chỉ bỏ qua quy tắc này khi không có địa điểm nào trong danh sách khớp tag đó, hoặc khi người dùng đã nói rõ muốn loại địa điểm khác.

Danh sách địa điểm hiện có (id | tên | tags | mô tả ngắn):
${placesList || "(hiện chưa có địa điểm nào trong hệ thống)"}`;
}

/**
 * Cá nhân hoá (roadmap mục 4): đọc sở thích khai báo (users.preferences) + tín hiệu hành vi
 * (tag của địa điểm đã lưu, tag của địa điểm được đánh giá cao) để chèn thêm 1 đoạn ngắn vào
 * system prompt — KHÔNG đưa vào block có cache_control vì nội dung khác nhau theo từng user,
 * đặt ở block riêng sau block địa điểm (ổn định, dùng chung) để không phá cache prefix.
 */
async function buildPersonalizationNote(
  uid: string,
  placeTagsById: Map<string, { name: string; tags: string[] }>
): Promise<string | null> {
  const [userSnap, savedSnap, reviewsSnap] = await Promise.all([
    adminDb.collection("users").doc(uid).get(),
    adminDb.collection("saved_places").where("userId", "==", uid).get(),
    adminDb.collection("reviews").where("userId", "==", uid).where("rating", ">=", 4).get(),
  ]);

  const declaredPreferences: string[] = Array.isArray(userSnap.data()?.preferences)
    ? userSnap.data()!.preferences
    : [];

  const tagCounts = new Map<string, number>();
  for (const tag of declaredPreferences) {
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 2); // sở thích khai báo trực tiếp có trọng số cao hơn
  }

  const likedPlaceNames: string[] = [];
  for (const doc of savedSnap.docs) {
    const placeId = doc.data().placeId as string | undefined;
    if (!placeId) continue;
    for (const tag of placeTagsById.get(placeId)?.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  for (const doc of reviewsSnap.docs) {
    const data = doc.data();
    if (data.targetType !== "place") continue;
    const placeId = data.targetId as string | undefined;
    if (!placeId) continue;
    const entry = placeTagsById.get(placeId);
    if (entry) {
      likedPlaceNames.push(entry.name);
      for (const tag of entry.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  if (tagCounts.size === 0 && likedPlaceNames.length === 0) return null;

  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);

  const parts: string[] = [];
  if (topTags.length > 0) parts.push(`Người dùng có xu hướng thích: ${topTags.join(", ")}.`);
  if (likedPlaceNames.length > 0) {
    parts.push(`Đã từng đánh giá cao: ${[...new Set(likedPlaceNames)].slice(0, 3).join(", ")}.`);
  }
  return parts.length > 0 ? `Thông tin cá nhân hoá:\n${parts.join(" ")}` : null;
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
    const placeTagsById = new Map<string, { name: string; tags: string[] }>();
    const placesList = placesSnap.docs
      .map((doc) => {
        const d = doc.data();
        const tagsArr: string[] = Array.isArray(d.tags) ? d.tags : [];
        const tags = tagsArr.join(", ");
        const location = d.location as { latitude?: number; longitude?: number } | undefined;
        if (location && typeof location.latitude === "number" && typeof location.longitude === "number") {
          placesLocationById.set(doc.id, { id: doc.id, lat: location.latitude, lng: location.longitude });
        }
        placeTagsById.set(doc.id, { name: d.name ?? "", tags: tagsArr });
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

    // Cá nhân hoá — block riêng KHÔNG cache (khác nhau theo từng user), đặt sau block địa điểm
    // đã cache để không phá cache prefix dùng chung. Lỗi ở đây không được chặn luồng chat chính.
    try {
      const note = await buildPersonalizationNote(uid, placeTagsById);
      if (note) systemBlocks.push({ type: "text", text: note });
    } catch (error) {
      console.error("api/chat: loi khi tinh ca nhan hoa (bo qua, khong chan chat)", error);
    }

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
