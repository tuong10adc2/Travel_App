# ROADMAP NÂNG CẤP AI — TravelAI

> Mục tiêu: nâng độ sâu kỹ thuật AI của sản phẩm để đưa vào CV ứng tuyển công ty AI.
> Hiện trạng tham chiếu: chat qua Claude (tool-use, prompt caching) ở `functions/src/index.ts`,
> itinerary planner lai LLM + geo-clustering ở `functions/src/itinerary-planner.ts`,
> review moderation bằng structured output (forced tool) ở `functions/src/index.ts:269`.
>
> Mỗi hướng bên dưới có 4 mục: **Mục đích** (vấn đề gì), **Cách làm** (kỹ thuật cụ thể),
> **Giá trị CV** (vì sao nhà tuyển dụng AI quan tâm), **Khả năng hoàn thành** (độ khó, thời gian ước tính,
> rủi ro chính, làm được với 1 người trong thời gian ngắn hay không).

---

## 1. RAG / Vector Search cho gợi ý địa điểm

**Mục đích**: Hiện tại toàn bộ bảng `places` được nhét thẳng dạng text vào system prompt mỗi lần chat
(`index.ts:132-142`). Cách này không scale (prompt phình theo số địa điểm), không có truy hồi ngữ nghĩa
(user hỏi "chỗ nào yên tĩnh gần biển" thì model phải tự đọc hết rồi suy luận, dễ sai/chậm), và tốn token.

**Cách làm**:
1. Sinh embedding cho mô tả + tags mỗi địa điểm (Voyage AI embeddings hoặc Vertex AI text-embedding) —
   chạy 1 lần khi tạo/sửa `places`, lưu vector vào field mới `embedding: number[]` trong Firestore,
   hoặc đẩy sang một vector store nhẹ (ví dụ Pinecone free tier, hoặc tự làm cosine similarity trong
   Cloud Function nếu số địa điểm còn nhỏ — không cần hạ tầng vector DB riêng ở quy mô demo).
2. Khi user gửi tin nhắn, embed câu hỏi, lấy top-k địa điểm gần nhất theo cosine similarity, chỉ đưa
   top-k đó vào system prompt thay vì toàn bộ bảng.
3. (Nâng cao) Áp dụng tương tự cho `reviews` để trả lời được câu hỏi kiểu "mọi người nhận xét gì về
   chỗ này" bằng cách retrieve review liên quan thay vì tóm tắt cứng.

**Giá trị CV**: RAG là kỹ năng bắt buộc phải có khi phỏng vấn ở công ty AI hiện nay — gần như câu hỏi
mặc định. Có RAG thật (không chỉ nói lý thuyết) trong một sản phẩm end-to-end là điểm cộng rất lớn.

**Khả năng hoàn thành**: **Cao** nếu chỉ làm bản tối giản (embedding lưu trong Firestore + cosine
similarity tính tay trong Cloud Function, không cần vector DB riêng) — ước tính 1-2 ngày làm việc cho
1 người, vì số lượng địa điểm demo còn nhỏ (8 địa điểm hiện tại) nên không cần index ANN phức tạp.
Nếu muốn dùng vector DB thật (Pinecone/pgvector) để "kể chuyện" hạ tầng chuyên nghiệp hơn thì cộng thêm
1 ngày để setup + migrate. Rủi ro chính: chọn provider embedding cần API key mới (Voyage/Vertex),
tốn thêm thời gian setup billing.

---

## 2. Streaming response cho chat

**Mục đích**: Chat hiện gọi `httpsCallable` không streaming (`chat_repository.dart:85-92`), người dùng
phải chờ toàn bộ câu trả lời (kể cả extended thinking) xong mới thấy gì — trải nghiệm không giống các
sản phẩm chat AI thật (ChatGPT, Claude.ai) đều stream theo token. Đã ghi chú "cố ý chưa làm" trong
`checklist-nuoc-rut-3-ngay.md:46`.

**Cách làm**:
1. Đổi callable function sang HTTPS onRequest endpoint (Cloud Functions v2 hỗ trợ streaming response),
   hoặc dùng Cloud Run nếu cần kiểm soát response stream tốt hơn.
2. Dùng `client.messages.stream()` của Anthropic SDK, forward từng delta qua response stream
   (Server-Sent Events).
3. Vẫn phải giữ xác thực (`request.auth` hiện có ở callable) — với onRequest cần tự verify Firebase ID
   token từ header `Authorization`.
4. Phía Flutter: thay `httpsCallable` bằng HTTP client đọc SSE (package `http` với response stream, hoặc
   `flutter_client_sse`), cập nhật `chat_message_bubble.dart` để render text tăng dần thay vì
   `Text(message.content)` tĩnh.
5. Xử lý tool-use trong lúc stream: cần buffer tool_use block riêng, chỉ stream phần text — phức tạp
   hơn stream thuần vì đang có agent loop 2 vòng (`MAX_TOOL_ROUND_TRIPS`).

**Giá trị CV**: Thể hiện hiểu về giao thức streaming LLM thực tế (SSE, xử lý tool-use xen kẽ streaming
text) — khác với việc chỉ gọi API dạng request/response đơn giản. Đây là chi tiết hay bị hỏi sâu khi
phỏng vấn về "đã từng build production chat app chưa".

**Khả năng hoàn thành**: **Trung bình**. Bản thân stream text thuần không khó (~1 ngày), nhưng vì hệ
thống đang dùng tool-use agent loop nên phải xử lý thêm case "model đang stream text → dừng lại để gọi
tool → tiếp tục stream" — tăng độ phức tạp lên khoảng 2-3 ngày tổng cộng. Cũng cần đổi cách xác thực từ
callable sang onRequest, có rủi ro phát sinh bug bảo mật nếu verify token không đúng — cần test kỹ.

---

## 3. Eval harness cho chất lượng output LLM

**Mục đích**: Hiện chưa có bất kỳ bài test tự động nào cho chất lượng câu trả lời của AI — không biết
đổi prompt có làm tệ đi không, không đo được tỉ lệ hallucination (model bịa địa điểm không có thật),
không đo tỉ lệ gọi đúng tool.

**Cách làm**:
1. Tạo bộ ~15-20 test case cố định: câu hỏi mẫu (tiếng Việt, đa dạng: hỏi gợi ý, hỏi lịch trình, hỏi
   ngoài chủ đề để test guardrail từ chối) kèm kỳ vọng (tool nào nên được gọi, placeId nào hợp lệ,
   có nên từ chối không).
2. Viết script chạy các case này qua `chatWithAssistant` thật (hoặc gọi thẳng Anthropic SDK với cùng
   prompt để tách biệt khỏi Firebase), so sánh output với kỳ vọng bằng rule đơn giản (placeId có nằm
   trong danh sách thật không — tái dùng đúng logic filter đã có ở `index.ts` để chặn hallucination) và
   bằng LLM-as-judge cho phần văn phong/độ liên quan (dùng chính Claude chấm điểm 1-5 câu trả lời có
   đúng trọng tâm câu hỏi không).
3. Log kết quả ra file/markdown mỗi lần chạy để có "golden set" theo dõi qua thời gian, chạy lại mỗi khi
   sửa system prompt.

**Giá trị CV**: Đây là điểm phân biệt rõ nhất giữa "biết gọi API LLM" và "biết build AI product nghiêm
túc". Các công ty AI rất quan tâm đến eval vì đó là cách duy nhất biết chất lượng LLM app có tốt lên hay
tệ đi khi thay đổi. Có sẵn 1 bộ eval nhỏ nhưng thật để demo trong phỏng vấn là lợi thế lớn.

**Khả năng hoàn thành**: **Cao**. Đây là hướng dễ làm nhất trong danh sách — không cần đổi kiến trúc gì,
chỉ cần viết thêm script (Node/TypeScript, tái dùng SDK đã có sẵn trong `functions/`). Ước tính 1 ngày
cho bộ eval cơ bản (rule-based check hallucination), thêm nửa ngày nếu làm LLM-as-judge. Rủi ro thấp vì
không đụng vào code chạy production.

---

## 4. Cá nhân hoá dựa trên preference & lịch sử tương tác

**Mục đích**: Field `users.preferences` đã có sẵn trong schema với ghi chú "dùng cho AI gợi ý"
(`docs/firestore-schema.md:17`) nhưng chưa được đọc/dùng ở đâu cả. Chat hiện trả lời giống nhau cho mọi
người dùng, không tận dụng lịch sử đã lưu (địa điểm đã save, đã review, rating đã cho).

**Cách làm**:
1. Khi build system prompt trong `chatWithAssistant`, đọc thêm `users/{uid}.preferences` và một số tín
   hiệu hành vi (top tags từ `saved_places`/`reviews` điểm cao của user đó), tóm tắt ngắn gọn thành 1-2
   câu chèn vào system prompt (ví dụ: "Người dùng thường thích địa điểm thiên nhiên, đã đánh giá cao
   Sa Pa và Đà Lạt").
2. Nếu làm cùng hướng RAG (mục 1), có thể dùng vector trung bình của các địa điểm user thích để làm
   query bổ sung khi retrieve, giống cơ chế "user embedding" đơn giản.
3. Thêm bước cập nhật `preferences` tự động sau mỗi vài lượt chat/review (ví dụ dùng chính LLM để trích
   xuất sở thích mới từ hội thoại, ghi lại — cần cân nhắc rate limit/cost).

**Giá trị CV**: Cá nhân hoá là phần lõi của mọi hệ thống recommendation/AI assistant thương mại (Netflix,
Spotify, các trợ lý du lịch thật). Demo được "AI nhớ tôi thích gì" là câu chuyện dễ kể và dễ gây ấn tượng
trong phỏng vấn hơn là một chatbot vô danh.

**Khả năng hoàn thành**: **Trung bình-Cao**. Phần đọc `preferences` tĩnh có sẵn và chèn vào prompt rất
đơn giản (nửa ngày). Phần tự động trích xuất sở thích từ hội thoại bằng LLM phức tạp hơn (thêm 1 ngày)
và cần cẩn thận về chi phí gọi thêm API + đảm bảo không ghi đè preference sai lệch. Làm bản tối giản
(chỉ đọc preference tĩnh, không tự cập nhật) gần như chắc chắn hoàn thành trong thời gian ngắn.

---

## 5. Guardrails & Observability cho các lệnh gọi LLM

**Mục đích**: Ngoài forced-tool moderation cho review, chưa có logging/metrics tổng thể nào cho các
lệnh gọi LLM — không biết latency trung bình, chi phí token, tỉ lệ tool-call thành công, hay tần suất
model bị chặn hallucination (bao nhiêu % lần model gợi ý placeId không tồn tại và bị lọc bỏ).

**Cách làm**:
1. Thêm structured logging (Cloud Logging, dùng `logger` sẵn có của Firebase Functions) ở mỗi điểm gọi
   Anthropic API: input tokens, output tokens, thời gian phản hồi, tool nào được gọi, có bị lọc
   placeId hallucinate không (đã có logic lọc, chỉ cần log thêm khi nó thực sự lọc ra gì đó).
2. Tổng hợp log định kỳ (BigQuery export có sẵn từ Cloud Logging, hoặc đơn giản là query log thủ công)
   thành vài con số: cost/ngày, latency p50/p95, tỉ lệ hallucination bị chặn.
3. (Tuỳ chọn) Dashboard nhỏ trong admin panel (`admin/`) hiển thị các số liệu này — tái dùng UI admin
   đã có sẵn.

**Giá trị CV**: Thể hiện tư duy vận hành AI ở production — chi phí, độ trễ, và an toàn không phải thứ
chỉ code xong là xong, mà cần đo lường liên tục. Đây là góc nhìn "AI engineer" thay vì chỉ "app dev gọi
API AI", rất được đánh giá cao khi phỏng vấn.

**Khả năng hoàn thành**: **Cao**. Không đổi kiến trúc, chỉ thêm logging vào code đã có — ước tính nửa
ngày cho phần log cơ bản, thêm 1 ngày nếu làm dashboard admin. Rủi ro thấp nhất trong danh sách.

---

## 6. Itinerary planner: ràng buộc thực tế (giờ mở cửa, thời gian di chuyển)

**Mục đích**: Thuật toán geo-clustering hiện tại (`itinerary-planner.ts:32-114`) chỉ dựa trên khoảng
cách haversine, bỏ qua `openingHours` (đã ghi chú là việc cần làm ở `checklist.md` dòng liên quan) và
không dùng thời gian di chuyển thực tế (chỉ ước lượng theo đường chim bay).

**Cách làm**:
1. Thêm ràng buộc giờ mở cửa khi sắp thứ tự điểm trong ngày: loại/đẩy lịch các địa điểm đã đóng cửa ở
   khung giờ dự kiến ghé, ưu tiên sắp xếp theo giờ mở-đóng còn lại (bài toán gần giống lập lịch có
   ràng buộc thời gian — có thể làm bằng heuristic tham lam, không cần solver phức tạp).
2. Thay khoảng cách haversine bằng thời gian di chuyển thực tế qua Google Distance Matrix API (đã dùng
   Google Places API ở `scripts/import_places/`, dùng chung project/API key) cho việc sắp thứ tự trong
   cùng 1 cụm.
3. Giữ nguyên phần LLM chọn địa điểm (đã đúng thiết kế: LLM chọn, thuật toán tối ưu thứ tự) — chỉ nâng
   cấp phần thuật toán.

**Giá trị CV**: Nâng độ phức tạp kỹ thuật của phần "AI + optimization" — cho thấy khả năng kết hợp LLM
với bài toán tối ưu cổ điển (constraint satisfaction/scheduling) chứ không chỉ dừng ở gọi API sinh text.
Đây là câu chuyện kỹ thuật cụ thể, dễ vẽ sơ đồ và giải thích sâu khi phỏng vấn.

**Khả năng hoàn thành**: **Trung bình**. Phần lọc theo giờ mở cửa tương đối đơn giản (nửa ngày -
1 ngày, dữ liệu `openingHours` đã có sẵn trong schema). Phần tích hợp Distance Matrix API phức tạp hơn
vì cần quản lý thêm 1 API key/billing và xử lý rate limit (gọi ma trận N x N cho mỗi lần lập lịch) —
thêm 1-2 ngày. Có thể làm riêng phần giờ mở cửa trước (ROI cao, ít rủi ro), để phần Distance Matrix làm
sau nếu còn thời gian.

---

## Gợi ý thứ tự ưu tiên (nếu thời gian có hạn)

1. **RAG (mục 1)** + **Eval harness (mục 3)** — combo mạnh nhất, mỗi cái đều nhanh làm và là 2 chủ đề
   chắc chắn bị hỏi khi phỏng vấn AI. Tổng ~2-3 ngày.
2. **Guardrails & Observability (mục 5)** — rẻ, rủi ro thấp, cộng thêm câu chuyện "vận hành AI" cho CV.
3. **Streaming (mục 2)** — giá trị demo cao (trải nghiệm rõ ràng hơn hẳn) nhưng tốn công nhất vì phải
   xử lý tool-use xen kẽ stream; làm nếu còn thời gian và muốn có video demo mượt.
4. **Cá nhân hoá (mục 4)** và **Itinerary constraints (mục 6)** — làm sau cùng, giá trị tăng thêm nhưng
   không phải kiến thức "lõi" hay bị hỏi bằng RAG/eval/streaming.
