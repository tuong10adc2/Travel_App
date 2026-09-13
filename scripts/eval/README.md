# Eval harness cho trợ lý AI

Bộ kiểm tra tự động chất lượng câu trả lời của `/api/chat` — thay cho việc test tay (tạo route API
tạm, curl, xoá route) đã dùng lặp đi lặp lại trong quá trình phát triển.

Không dùng LLM-judge — mỗi test case kiểm tra bằng rule cụ thể, bám sát các thiết kế đã cố ý làm
trong hệ thống: grounding (không bịa địa điểm), guardrail (từ chối câu hỏi ngoài chủ đề), cá nhân
hoá, và lịch trình có giờ giấc.

## Chạy

```bash
cd scripts/eval
npm install
FIREBASE_SERVICE_ACCOUNT_KEY='<json service account key>' npm run eval
```

Lấy `FIREBASE_SERVICE_ACCOUNT_KEY` từ Vercel (project `webapp` → Settings → Environment Variables)
hoặc Firebase Console → Project Settings → Service Accounts → Generate new private key.

Biến môi trường tuỳ chọn:
- `CHAT_API_BASE_URL` — mặc định `https://travel-app-6rww.vercel.app`, đổi sang `http://localhost:3000` để test bản đang chạy `npm run dev` cục bộ.
- `FIREBASE_API_KEY` — mặc định dùng key public sẵn có của project.

## Test case hiện có

| Case | Kiểm tra |
|---|---|
| `grounded_suggestion` | Gợi ý địa điểm chỉ dùng id có thật trong hệ thống |
| `tag_match` | Câu hỏi rõ loại địa điểm ("biển đảo") → gợi ý đúng tag |
| `no_hallucination` | Hỏi về địa điểm không có thật → không khẳng định sai là có |
| `off_topic_guardrail` | Câu hỏi ngoài chủ đề du lịch → từ chối, không thực hiện yêu cầu |
| `itinerary_schedule` | Lập lịch trình nhiều ngày → đủ giờ đến hợp lệ cho từng điểm |
| `personalization` | Câu hỏi chung chung → ưu tiên đúng sở thích đã khai báo |

Script tự dọn dữ liệu test (`users/eval-harness-test-user`) sau khi chạy xong, kể cả khi có lỗi ở
giữa chừng (trừ khi tiến trình bị ngắt đột ngột).

Thoát với exit code khác 0 nếu có test fail — dùng được trực tiếp trong CI (xem
`.github/workflows/eval.yml`).
