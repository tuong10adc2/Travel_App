import Anthropic from "@anthropic-ai/sdk";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, verifyRequestAuth, UnauthorizedError } from "@/lib/firebase-admin";

// Dịch mô tả/đặc điểm/món ăn của 1 địa điểm sang tiếng Anh theo yêu cầu, gọi 1 lần rồi cache
// kết quả vào chính doc `places/{id}.translations.en` — các lượt gọi sau (kể cả người dùng
// khác) chỉ đọc cache, không gọi lại Claude. Đây là phần "chế độ tiếng Anh" còn thiếu: UI tĩnh
// (l10n .arb) và tag cố định (tagLabel) đã dịch được, nhưng nội dung tự do nhập trong Firestore
// (description/highlights/foodToTry) thì không, vì không phải chuỗi tĩnh hay tập giá trị cố định.

export const maxDuration = 30;

// Gọi cross-origin từ Flutter Web (domain khác webapp) — an ninh thật nằm ở verify Firebase ID
// token bên dưới, không phải ở CORS.
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

interface TranslatedFields {
  description: string;
  highlights: string[];
  foodToTry: string[];
}

const TRANSLATE_TOOL: Anthropic.Tool = {
  name: "translate_place",
  description:
    "Trả về bản dịch tiếng Anh tự nhiên (văn phong giới thiệu du lịch) cho các trường đã cho, giữ đúng nghĩa. " +
    "Không dịch tên riêng địa điểm/món ăn nếu không có tên tiếng Anh phổ biến tương đương.",
  input_schema: {
    type: "object",
    properties: {
      description: { type: "string" },
      highlights: { type: "array", items: { type: "string" } },
      foodToTry: { type: "array", items: { type: "string" } },
    },
    required: ["description", "highlights", "foodToTry"],
  },
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { placeId?: string } | null;
  const placeId = body?.placeId;
  if (!placeId) {
    return jsonWithCors({ error: "Thiếu placeId." }, { status: 400 });
  }

  const ref = adminDb.collection("places").doc(placeId);
  const snap = await ref.get();
  if (!snap.exists) {
    return jsonWithCors({ error: "Không tìm thấy địa điểm." }, { status: 404 });
  }
  const data = snap.data()!;

  // Đọc bản dịch đã cache thì KHÔNG cần đăng nhập — trang chi tiết địa điểm vốn xem được công
  // khai (không auth-gate), nên yêu cầu đăng nhập ở đây trước đây khiến khách chưa đăng nhập
  // chuyển sang chế độ tiếng Anh vẫn thấy mô tả/đặc điểm bằng tiếng Việt (bug thật, đã sửa).
  // Chỉ khi CẦN DỊCH MỚI (tốn 1 lượt gọi Claude) mới bắt buộc đăng nhập, để tránh bị lạm dụng.
  const cached = data.translations?.en as TranslatedFields | undefined;
  if (cached) {
    return jsonWithCors(cached);
  }

  try {
    await verifyRequestAuth(request);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonWithCors({ error: "Bạn cần đăng nhập để tạo bản dịch mới." }, { status: 401 });
    }
    throw error;
  }

  const description = typeof data.description === "string" ? data.description : "";
  const highlights: string[] = Array.isArray(data.highlights) ? data.highlights : [];
  const foodToTry: string[] = Array.isArray(data.foodToTry) ? data.foodToTry : [];

  if (!description && highlights.length === 0 && foodToTry.length === 0) {
    const empty: TranslatedFields = { description: "", highlights: [], foodToTry: [] };
    return jsonWithCors(empty);
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system:
        "Bạn là biên dịch viên du lịch. Dịch các trường được cung cấp từ tiếng Việt sang tiếng Anh tự nhiên, " +
        "giữ đúng nghĩa và số lượng phần tử trong mỗi mảng, gọi tool translate_place với kết quả.",
      tools: [TRANSLATE_TOOL],
      tool_choice: { type: "tool", name: "translate_place" },
      messages: [
        {
          role: "user",
          content: JSON.stringify({ description, highlights, foodToTry }),
        },
      ],
    });

    const block = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "translate_place"
    );
    if (!block) throw new Error("Model không trả về bản dịch.");

    const input = block.input as { description?: unknown; highlights?: unknown; foodToTry?: unknown };
    const translated: TranslatedFields = {
      description: typeof input.description === "string" ? input.description : description,
      highlights: Array.isArray(input.highlights)
        ? input.highlights.filter((h): h is string => typeof h === "string")
        : [],
      foodToTry: Array.isArray(input.foodToTry)
        ? input.foodToTry.filter((h): h is string => typeof h === "string")
        : [],
    };

    await ref.set(
      { translations: { en: { ...translated, translatedAt: FieldValue.serverTimestamp() } } },
      { merge: true }
    );

    return jsonWithCors(translated);
  } catch (error) {
    console.error("api/translate-place: loi khi dich", error);
    return jsonWithCors({ error: "Đã có lỗi khi dịch địa điểm." }, { status: 500 });
  }
}
