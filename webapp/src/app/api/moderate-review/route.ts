import { FieldValue } from "firebase-admin/firestore";
import Anthropic from "@anthropic-ai/sdk";
import { adminDb } from "@/lib/firebase-admin";

// Port từ functions/src/index.ts (moderateReviewOnCreate) — bản gốc là Firestore trigger
// (onDocumentCreated), Vercel không hỗ trợ kiểu trigger này nên đổi sang Vercel Cron gọi
// route này mỗi 5 phút, tự quét review chưa có aiModeration. Không tự động ẩn/xoá gì cả —
// chỉ gắn nhãn gợi ý, quyết định cuối vẫn luôn là admin (đúng rule Firestore hiện tại).

export const maxDuration = 60;

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

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // chưa cấu hình secret thì cho qua (chỉ nên xảy ra lúc mới setup)
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const snap = await adminDb.collection("reviews").where("aiModeration", "==", null).limit(25).get();

  let processed = 0;
  let flagged = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const comment = typeof data.comment === "string" ? data.comment.trim() : "";
    if (!comment) continue;

    try {
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
      if (!block) continue;

      const input = block.input as { flagged?: unknown; reason?: unknown };
      await doc.ref.update({
        aiModeration: {
          flagged: input.flagged === true,
          reason: typeof input.reason === "string" ? input.reason : null,
          checkedAt: FieldValue.serverTimestamp(),
        },
      });
      processed += 1;
      if (input.flagged === true) flagged += 1;
    } catch (error) {
      console.error(`api/moderate-review: loi khi kiem duyet review ${doc.id}`, error);
    }
  }

  return Response.json({ processed, flagged });
}
