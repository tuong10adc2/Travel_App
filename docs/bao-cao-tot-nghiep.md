# Tài liệu tổng hợp cho báo cáo tốt nghiệp — TngGuide / TravelAI

> File này KHÔNG phải bản báo cáo hoàn chỉnh — đây là tài liệu tham khảo để mày tự viết lại
> theo văn phong báo cáo của trường/khoa. Phần cuối có hướng dẫn cách dùng tài liệu này để viết.

---

## 1. Sản phẩm là gì (tóm tắt 1 đoạn để mở đầu báo cáo)

TngGuide (tên kỹ thuật trong repo: TravelAI) là ứng dụng trợ lý du lịch tích hợp AI, gồm 3 client
dùng chung 1 backend Firebase:

| Client | Nền tảng | Công nghệ |
|---|---|---|
| App di động | Android (+ Flutter Web) | Flutter, Riverpod, go_router |
| Web app người dùng | Trình duyệt | Next.js 16, React 19, Tailwind CSS 4 |
| Admin dashboard | Trình duyệt (nội bộ) | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | Dùng chung | Firebase (Firestore, Auth) + Next.js API Routes trên Vercel cho phần AI/thông báo |

Sản phẩm giải quyết 2 nhu cầu chính: (1) khám phá địa điểm du lịch qua tìm kiếm/lọc tag và
(2) trò chuyện với trợ lý AI để được gợi ý địa điểm và lên lịch trình nhiều ngày.

## 2. Danh sách chức năng đầy đủ

- Khám phá địa điểm: tìm kiếm, lọc theo tag, xem chi tiết (đánh giá, giờ mở cửa, ảnh, giá vé,
  điểm nổi bật, món ăn địa phương, bản đồ nhúng).
- Chat với trợ lý AI: gợi ý địa điểm dạng thẻ (card) chèn ngay trong hội thoại, cá nhân hoá theo
  sở thích người dùng, trả lời hiện dần từng chữ (streaming).
- Lập lịch trình nhiều ngày từ hội thoại chat: tự động nhóm địa điểm theo khu vực, sắp thứ tự di
  chuyển, tính giờ đến/đi từng điểm, cảnh báo nếu có điểm bị ghé lúc đã đóng cửa.
- Đánh giá (review) có sao, được AI tự động kiểm duyệt (phát hiện spam/ngôn từ thù ghét) trước khi
  hiển thị công khai — có hàng đợi duyệt thủ công trong admin (human-in-the-loop), không tự động xoá.
- Lưu địa điểm yêu thích (saved places).
- Thông báo đẩy (push notification): địa điểm mới, nhắc lịch trình sắp tới.
- Admin dashboard: quản lý địa điểm/đánh giá/người dùng, hàng đợi duyệt nội dung, nhật ký thao tác
  (audit log).
- Đăng nhập bằng Google (không dùng email/password) trên cả 3 client.
- Đồng bộ dữ liệu chat/lịch trình giữa Flutter và webapp (cùng 1 định dạng lưu trên Firestore).
- Đa ngôn ngữ Việt/Anh: giao diện tĩnh dịch qua bộ chuỗi (l10n), nội dung động (mô tả/đặc điểm/món
  ăn của từng địa điểm) được AI dịch tự động sang tiếng Anh khi cần, cache lại để chỉ dịch 1 lần.

## 3. Những điểm nên nhấn mạnh với giáo viên

Đây là các điểm **không phải sản phẩm CRUD thông thường** — nên nêu rõ để giáo viên thấy độ khó
kỹ thuật thực sự, không chỉ là "gọi API ChatGPT rồi hiển thị chữ ra màn hình":

1. **Kiến trúc đa client dùng chung 1 nguồn dữ liệu** — Flutter (mobile + web) và Next.js (web +
   admin) đọc/ghi cùng schema Firestore, phải tự giữ đồng bộ định dạng dữ liệu phức tạp (vd
   `itineraryPlan`) giữa 2 ngôn ngữ (Dart và TypeScript).
2. **Chủ động chọn kiến trúc serverless toàn phần** — thay vì dùng Firebase Cloud Functions cho AI,
   đã chọn port toàn bộ logic AI sang Next.js API Routes chạy trên Vercel: deploy nhanh hơn, miễn phí,
   không phải tự quản lý hạ tầng function riêng. Đây là một quyết định kiến trúc thật, đáng kể trong
   báo cáo — thể hiện khả năng đánh giá và chuyển đổi giải pháp hạ tầng phù hợp với quy mô sản phẩm.
3. **AI không phải "gọi API rồi in ra"** — có tool-use agent loop, ràng buộc chống bịa dữ liệu
   (grounding), cá nhân hoá, prompt caching, streaming, và một bộ eval tự động — chi tiết ở mục 4.
4. **Kết hợp AI với thuật toán cổ điển** — lịch trình du lịch không giao hết cho LLM tự bịa toạ độ/
   khoảng cách (LLM làm việc này không đáng tin), mà dùng LLM chỉ để *chọn địa điểm phù hợp sở
   thích*, còn việc *sắp xếp theo khu vực địa lý + tính giờ giấc* do thuật toán (k-means +
   nearest-neighbor + haversine) đảm nhiệm. Đây là điểm kỹ thuật đáng nói kỹ trong báo cáo: biết
   chỗ nào nên dùng AI, chỗ nào không nên.
5. **Có kiểm thử tự động thật** — CI (GitHub Actions) chạy lint/build/test mỗi lần push cho cả 3
   client, và một eval harness riêng đo chất lượng câu trả lời AI (không phải test tay).
6. **Ý thức về bảo mật dữ liệu** — service account key, API key AI đều giữ phía server, không lộ ra
   client; xác thực bằng Firebase ID token verify ở mọi API route AI.

## 4. Phần AI — chi tiết (quan trọng nhất, giáo viên sẽ hỏi sâu phần này)

### 4.1 Đã làm được gì

**a) Kiến trúc: dùng LLM nền tảng có sẵn (Anthropic Claude) qua API, không tự huấn luyện mô hình.**
Model dùng: `claude-opus-5`, gọi qua Anthropic SDK (`@anthropic-ai/sdk`), có bật
`thinking: adaptive` (model tự quyết định có "suy nghĩ" trước khi trả lời hay không tuỳ độ khó câu
hỏi) và `output_config: { effort: "medium" }`.

**b) Tool-use agent loop (function calling)** — thay vì để model trả lời tự do bằng văn bản, hệ
thống định nghĩa 2 "tool" (hàm) mà model có thể gọi:
- `suggest_places`: model chọn ra các `placeId` (id thật trong hệ thống) muốn giới thiệu, server
  render thành thẻ thông tin (card) — model **không được tự liệt kê tên địa điểm suông trong text**,
  bắt buộc phải gọi tool để đảm bảo dữ liệu hiển thị luôn khớp dữ liệu thật.
- `plan_itinerary`: model chỉ cần chọn *tập địa điểm phù hợp* và *số ngày*, không tự sắp xếp thứ
  tự/giờ giấc (cố ý, vì LLM suy luận toạ độ/khoảng cách không đáng tin) — server tính toán bằng
  thuật toán, trả kết quả (`schedule`, `warnings`) lại cho model qua `tool_result` để model diễn
  giải bằng lời cho người dùng ở lượt tiếp theo. Đây là vòng lặp 2 lượt (`MAX_TOOL_ROUND_TRIPS = 2`).

**c) Chống hallucination (grounding) nhiều lớp:**
- System prompt được build động từ collection `places` thật trong Firestore mỗi lần gọi (không
  phải dữ liệu tĩnh hard-code), kèm chỉ dẫn rõ "không được bịa địa điểm/giá vé không có trong
  danh sách".
- Bất kỳ `placeId` nào model trả về (qua tool call) đều được **validate lại phía server** so với
  tập id thật trước khi trả về client — id giả (nếu model lỡ bịa) sẽ bị lọc bỏ âm thầm.
- Có eval case riêng (`no_hallucination`) kiểm tra hành vi này tự động — xem mục c ở phần eval.

**d) Cá nhân hoá (personalization)** — đọc `users.preferences` (sở thích khai báo) + tín hiệu hành
vi (tag của địa điểm đã lưu, tag của địa điểm được đánh giá ≥4 sao), tính trọng số, chèn thành 1
đoạn ngắn riêng vào system prompt. Có ràng buộc **bắt buộc** (không chỉ khuyến khích) ưu tiên tag
khớp sở thích khi câu hỏi chung chung — ghi chú thật trong code: bản đầu chỉ "khuyến khích" thì
model vẫn chọn địa điểm nổi tiếng/rating cao hơn thay vì theo sở thích, phải sửa thành chỉ thị bắt
buộc mới có hiệu quả (một ví dụ thật về việc *prompt engineering cần lặp lại và kiểm chứng bằng
test thật*, không phải viết 1 lần là xong).

**e) Prompt caching** — phần system prompt lớn (danh sách toàn bộ địa điểm) được đánh dấu
`cache_control: { type: "ephemeral" }` để Anthropic cache lại, giảm độ trễ/chi phí cho các lượt gọi
sau trong cùng khung thời gian cache. Phần cá nhân hoá (khác nhau theo từng user) cố tình đặt ở
block **không cache**, sau block đã cache, để không phá cache prefix dùng chung.

**f) Streaming (SSE)** — thay vì đợi model sinh xong toàn bộ câu trả lời rồi trả 1 lần, response
được stream từng đoạn chữ qua Server-Sent Events (`client.messages.stream()` của SDK, forward từng
delta qua `ReadableStream` + `TextEncoder`). Cả webapp (đọc qua `fetch` + `ReadableStreamDefaultReader`)
và Flutter (đọc qua `http.Client().send()` + `StreamedResponse`) đều tự parse frame SSE (`data: {...}`)
và hiện chữ tăng dần trên UI — không dùng thư viện dựng sẵn, tự viết cơ chế đọc chunk/buffer/tách
frame theo `\n\n` cho cả 2 nền tảng.

**g) Lịch trình lai AI + thuật toán (hybrid)** — model chỉ chọn *cái gì*, thuật toán quyết định
*sắp xếp thế nào*:
- Geo-clustering: k-means (k = số ngày) trên toạ độ lat/lng, seed centroid tất định (không dùng số
  ngẫu nhiên) để kết quả tái lập được.
- Sắp thứ tự trong ngày: greedy nearest-neighbor theo khoảng cách Haversine.
- Tính giờ giấc: cộng dồn thời gian di chuyển (khoảng cách / tốc độ trung bình giả định 30km/h) +
  thời gian tham quan mỗi điểm (mặc định 60 phút nếu không khai báo), đối chiếu `openingHours` —
  chờ tới giờ mở nếu đến sớm, sinh cảnh báo tiếng Việt nếu đến sau giờ đóng cửa (cố tình **không**
  tự đổi thứ tự để né giờ đóng cửa, vì sẽ phá tối ưu quãng đường — chỉ cảnh báo để model/người dùng
  tự cân nhắc).

**h) Kiểm duyệt nội dung bằng structured output (forced tool call)** — review mới được phân loại
tự động bằng `tool_choice: { type: "tool", name: "flag_review" }` (ép model luôn trả lời qua đúng 1
tool có schema cố định, không trả free text) để gắn cờ spam/ngôn từ thù ghét, đưa vào hàng đợi duyệt
trong admin thay vì tự động xoá — giữ người kiểm duyệt cuối cùng là con người.

**i) Eval harness tự động (`scripts/eval/`)** — bộ 6 test case rule-based (không dùng LLM chấm điểm)
gọi thẳng API `/api/chat` thật, kiểm tra:
- `grounded_suggestion`: gợi ý địa điểm phải là id có thật.
- `tag_match`: hỏi "biển đảo" thì địa điểm gợi ý phải có đúng tag đó.
- `no_hallucination`: hỏi về địa điểm không tồn tại — AI phải phủ nhận rõ ràng, không được bịa là có,
  và nếu gợi ý địa điểm thay thế thì id vẫn phải thật.
- `off_topic_guardrail`: hỏi ngoài chủ đề (vd nhờ viết code) — AI phải từ chối, không được trả lời
  đúng yêu cầu ngoài chủ đề.
- `itinerary_schedule`: lịch trình nhiều ngày phải có đủ giờ đến hợp lệ (`HH:MM`) cho mỗi điểm.
- `personalization`: khai báo sở thích rồi hỏi chung chung — gợi ý phải ưu tiên đúng sở thích.

Script dùng Firebase Admin SDK để mint token cho 1 user test cố định, gọi API thật (không mock),
dọn dẹp dữ liệu test sau khi chạy, thoát mã lỗi 1 nếu có case fail (chạy được trong CI). **Giá trị
thật đã chứng minh**: lần chạy đầu phát hiện 2 lỗi dữ liệu thật (Đảo Phú Quốc và Vịnh Hạ Long thiếu
tag "Biển đảo" trong Firestore) — nếu không có eval harness thì lỗi này chỉ phát hiện được khi có
người dùng vô tình hỏi đúng câu đó.

**j) CI/CD** — GitHub Actions chạy lint + build + test tự động cho cả 3 client mỗi lần push/PR vào
`main` (không phải chạy tay). Eval harness có workflow riêng (`eval.yml`), chạy theo lịch hàng tuần
hoặc kích hoạt tay — cố tình **không** chạy mỗi lần push để tránh tốn phí gọi Anthropic API liên tục.

**k) Ingest dữ liệu có kiểm soát** — script import địa điểm hàng loạt lấy dữ liệu *sự thật* (toạ độ,
giờ mở cửa, ảnh) từ Google Places API, chỉ dùng Claude để *sinh mô tả/tag* từ dữ liệu đã xác thực đó
— không để AI tự bịa dữ liệu gốc.

**l) Dịch nội dung động sang tiếng Anh theo yêu cầu, có cache** — chế độ đa ngôn ngữ ban đầu chỉ dịch
được chuỗi UI tĩnh (l10n) và 1 tập tag cố định (ánh xạ tay), còn mô tả/đặc điểm/món ăn của từng địa
điểm là dữ liệu tự do nhập trong Firestore nên không dịch được bằng 2 cách trên. Giải quyết bằng 1
route riêng (`/api/translate-place`): lần đầu 1 người dùng bất kỳ xem địa điểm ở chế độ tiếng Anh,
route gọi Claude (forced tool call, cùng kỹ thuật structured output với mục h) dịch 3 trường
(`description`, `highlights`, `foodToTry`), rồi **ghi thẳng kết quả vào chính document Firestore**
của địa điểm đó (`translations.en`) — các lượt xem sau (của bất kỳ ai, trên cả 2 client) chỉ đọc lại
cache, không gọi lại AI. Đây là ví dụ cụ thể về *dùng AI đúng lúc* (nội dung tự do, không thể lập
bảng ánh xạ tay) và *kiểm soát chi phí bằng cache* (mỗi địa điểm chỉ tốn 1 lượt gọi AI trong suốt
vòng đời sản phẩm, không phải mỗi lần xem).

### 4.2 Thiếu sót / giới hạn hiện tại (nói thật với giáo viên — thể hiện tự đánh giá đúng mức)

- **Không có RAG / vector search**: toàn bộ danh sách địa điểm được nhét thẳng dạng text vào system
  prompt mỗi lần gọi. Với ~18 địa điểm hiện tại vẫn ổn (chưa vượt giới hạn ngữ cảnh, chưa chậm), nhưng
  không scale nếu số địa điểm lên tới hàng trăm/nghìn — cần retrieval ngữ nghĩa (embedding + cosine
  similarity hoặc vector DB) thay vì nhét hết.
- **Không có rate limiting / cost guardrail**: chưa giới hạn số lượt chat/phút mỗi user, chưa có
  cảnh báo nếu chi phí gọi API tăng bất thường — rủi ro thật nếu đưa vào dùng với nhiều người dùng
  thật hoặc bị lạm dụng (spam request).
- **Không có observability/monitoring cho AI**: chưa log latency, số token, tỉ lệ tool-call thành
  công, hay tần suất bị chặn hallucination — hiện chỉ biết hệ thống "có hoạt động" qua test thủ
  công/eval, không có số liệu vận hành liên tục.
- **Thuật toán lịch trình dùng khoảng cách đường chim bay (Haversine)**, không dùng thời gian di
  chuyển thực tế (kẹt xe, địa hình, phương tiện) — có thể sai lệch với thực tế, nhất là khu vực
  miền núi hoặc nội đô đông đúc.
- **Eval harness còn nhỏ (6 case)**, kiểm tra rule-based chứ chưa có LLM-as-judge để chấm điểm chất
  lượng văn phong/độ liên quan của câu trả lời (chỉ kiểm tra tính đúng đắn dữ liệu, không đo "câu trả
  lời hay hay dở").
- **Chưa tự động cập nhật sở thích người dùng**: cá nhân hoá chỉ đọc dữ liệu tĩnh (`preferences` khai
  báo sẵn + hành vi lưu/đánh giá), chưa có cơ chế AI tự trích xuất sở thích mới từ chính hội thoại.
- **Phụ thuộc hoàn toàn vào nhà cung cấp mô hình (Anthropic)**: không tự host, không có mô hình dự
  phòng nếu API bên thứ 3 gặp sự cố hoặc đổi giá.
- **Chưa test tải (load test)** cho endpoint AI — chưa biết hệ thống chịu được bao nhiêu request
  đồng thời trước khi timeout (route có giới hạn `maxDuration = 60s` trên Vercel).

### 4.3 So sánh với việc tự huấn luyện (train) một mô hình AI riêng

Đây là câu hỏi giáo viên rất hay hỏi ("sao không tự train model?") — nên chuẩn bị trả lời rõ ràng:

| Khía cạnh | Cách đang làm (dùng Claude qua API + prompt engineering) | Nếu tự train/fine-tune mô hình riêng |
|---|---|---|
| Dữ liệu cần | Không cần dataset huấn luyện — chỉ cần dữ liệu địa điểm thật (đã có trong Firestore) đưa vào prompt lúc gọi (in-context) | Cần dataset lớn, có nhãn (câu hỏi ↔ câu trả lời mẫu chất lượng cao), tốn công thu thập/làm sạch |
| Hạ tầng | Không cần GPU, không cần tự host — gọi API qua HTTP | Cần GPU (thuê cloud hoặc máy riêng), pipeline huấn luyện, lưu trữ checkpoint |
| Chi phí | Trả theo lượt gọi (token) — thấp với quy mô đồ án | Chi phí huấn luyện (GPU-hours) + chi phí host mô hình sau khi train, thường cao hơn nhiều lần cho kết quả tương đương ở quy mô nhỏ |
| Thời gian phát triển | Nhanh — thay đổi hành vi bằng cách sửa system prompt/tool schema, thấy kết quả ngay | Chậm — mỗi lần đổi hành vi phải chuẩn bị lại dữ liệu, train lại, đánh giá lại (chu kỳ dài hơn nhiều) |
| Chất lượng ngôn ngữ tự nhiên | Kế thừa toàn bộ khả năng ngôn ngữ, suy luận, đa ngôn ngữ của 1 model nền tảng đã được train trên dữ liệu khổng lồ | Model tự train từ đầu (hoặc fine-tune model nhỏ) thường yếu hơn nhiều về ngôn ngữ tự nhiên trừ khi đầu tư rất lớn |
| Cập nhật dữ liệu mới | Tức thời — chỉ cần sửa Firestore, prompt build lại mỗi lần gọi | Phải train lại (hoặc dùng RAG cộng thêm) mới "biết" dữ liệu mới |
| Kiểm soát hành vi cụ thể | Qua prompt + tool schema + validate server-side — khá tốt cho use case hẹp (gợi ý địa điểm, lập lịch) như đồ án này | Có thể kiểm soát sâu hơn (embed hành vi vào chính trọng số model) nhưng đòi hỏi kỹ thuật train phức tạp hơn (RLHF, SFT...) |
| Rủi ro hallucination | Vẫn có, nhưng giảm bằng grounding + validate id server-side (đã làm) | Vẫn có, và khó kiểm soát hơn nếu dataset huấn luyện không đủ sạch |
| Phù hợp với đồ án tốt nghiệp? | **Phù hợp** — thời gian ngắn, không có ngân sách GPU, mục tiêu là chứng minh khả năng *tích hợp và thiết kế hệ thống AI product* (prompt engineering, tool-use, grounding, eval) | Không khả thi trong khung thời gian/ngân sách đồ án; phù hợp hơn cho nghiên cứu chuyên sâu về NLP/ML, không phải sản phẩm ứng dụng |

**Kết luận nên viết trong báo cáo**: đồ án cố tình chọn hướng "AI engineering" (dùng model nền tảng
có sẵn, thiết kế hệ thống xung quanh nó — prompt, tool-use, grounding, eval, streaming) thay vì
"ML research" (tự train model), vì đây là hướng phản ánh đúng cách các sản phẩm AI thực tế trong
ngành đang được xây dựng (hầu hết công ty dùng API model nền tảng + kỹ thuật xung quanh, rất ít công
ty tự train model từ đầu), và phù hợp với thời gian/ngân sách của một đồ án tốt nghiệp.

## 5. Hướng phát triển tiếp theo (dùng cho phần "Hướng phát triển" của báo cáo)

Xếp theo thứ tự nên làm nếu có thêm thời gian (đã có sẵn phân tích chi tiết ở
[`docs/ai-improvement-roadmap.md`](ai-improvement-roadmap.md)):

1. **RAG / vector search** cho việc gợi ý địa điểm — cần thiết khi số địa điểm lớn hơn nhiều (hiện
   nhét thẳng prompt vẫn ổn với quy mô hiện tại).
2. **Rate limiting / cost guardrail** — bắt buộc nếu đưa vào dùng thật với nhiều người dùng.
3. **Observability cho AI**: log latency, token, tỉ lệ tool-call/hallucination bị chặn, có thể làm
   dashboard nhỏ ngay trong admin đã có sẵn.
4. **Lịch trình dùng thời gian di chuyển thực tế** (Google Distance Matrix API) thay vì đường chim
   bay Haversine.
5. **Eval harness mở rộng**: thêm case, thêm LLM-as-judge để chấm chất lượng văn phong/độ liên quan,
   không chỉ tính đúng dữ liệu.
6. **Tự động cập nhật sở thích người dùng** từ chính nội dung hội thoại (cẩn trọng về chi phí/độ
   chính xác).
7. **Bản đồ preview trong Admin** cho form nhập toạ độ địa điểm.

## 6. Hướng dẫn viết báo cáo

**Cấu trúc gợi ý cho chương "Xây dựng hệ thống AI" (thường là chương được hỏi kỹ nhất khi bảo vệ):**

1. Đặt vấn đề: vì sao chọn dùng LLM (Claude) qua API thay vì tự train — dẫn thẳng bảng so sánh ở
   mục 4.3.
2. Kiến trúc tổng thể luồng chat: vẽ sơ đồ (client → verify Firebase token → build system prompt
   động từ Firestore → gọi Claude với tool định nghĩa sẵn → vòng lặp tool-use → validate dữ liệu →
   stream kết quả về client). Dùng đúng luồng ở mục 4.1(b) để vẽ.
3. Từng kỹ thuật cụ thể — mỗi mục ở 4.1 nên thành 1 mục con trong báo cáo, có đoạn code minh hoạ
   ngắn (lấy trực tiếp từ [`webapp/src/app/api/chat/route.ts`](../webapp/src/app/api/chat/route.ts)
   và [`webapp/src/lib/itinerary-planner.ts`](../webapp/src/lib/itinerary-planner.ts)) — giáo viên
   thích thấy code thật, không chỉ mô tả bằng lời.
4. Kiểm thử: trình bày eval harness như 1 phần riêng — nói rõ nó phát hiện được lỗi thật (2 địa điểm
   thiếu tag) như 1 minh chứng "eval harness có giá trị thật, không phải làm cho có".
5. Hạn chế và hướng phát triển: dùng nguyên mục 4.2 và mục 5 — **đừng bỏ qua phần hạn chế**, giáo
   viên đánh giá cao sinh viên tự nhận ra giới hạn hơn là sinh viên nói sản phẩm hoàn hảo.

**Những câu hỏi giáo viên khả năng cao sẽ hỏi và gợi ý trả lời:**

- *"Sao không tự train model?"* → dùng bảng mục 4.3, nhấn vào: thời gian/ngân sách đồ án, và việc
  ngành công nghiệp hiện tại chủ yếu dùng API model nền tảng + kỹ thuật xung quanh (prompt
  engineering, RAG, tool-use) chứ không tự train.
- *"Làm sao biết AI không bịa thông tin?"* → nói về 2 lớp chống hallucination: (1) system prompt chỉ
  dẫn rõ + (2) validate server-side mọi id trả về, và eval case `no_hallucination` kiểm chứng tự
  động.
- *"Cái gì trong hệ thống AI là do em tự viết, cái gì là của thư viện/API có sẵn?"* → trả lời thẳng:
  Anthropic SDK cung cấp việc gọi model/stream, nhưng toàn bộ *thiết kế* (system prompt, 2 tool
  schema, vòng lặp xử lý tool-use, thuật toán geo-clustering + lịch trình, validate/grounding, eval
  harness, cơ chế đọc SSE ở cả 2 client) là tự thiết kế và code.
- *"Eval harness đo được gì, đo như thế nào?"* → giải thích rule-based assertion (không phải chấm
  điểm chủ quan) cho từng case ở mục 4.1(i), và kể lại câu chuyện phát hiện lỗi tag thật.
- *"Nếu có thêm thời gian sẽ làm gì tiếp?"* → dùng mục 5, ưu tiên RAG + rate limiting nếu được hỏi
  "cái nào quan trọng nhất".

**Chuẩn bị demo khi bảo vệ:**
- Demo streaming: gõ 1 câu hỏi trong chat, chỉ vào chữ hiện dần từng đoạn thay vì đợi cả câu.
- Demo lịch trình: hỏi "lên lịch 2 ngày ở Hội An và Huế", chỉ vào giờ đến/đi cụ thể từng điểm.
- Demo chống hallucination: hỏi về 1 địa điểm không có thật (vd "Địa đạo Củ Chi có trong hệ thống
  không") — AI phải từ chối đúng, không bịa.
- Demo eval harness: chạy `cd scripts/eval && npm install && FIREBASE_SERVICE_ACCOUNT_KEY='...' npm
  run eval` ngay trên máy trước mặt giáo viên, cho xem 6/6 pass — ấn tượng hơn nhiều so với chỉ nói
  bằng lời.
- Demo CI: mở tab Actions trên GitHub, cho xem workflow chạy xanh (pass) ở lần push gần nhất.

**Lưu ý khi trình bày số liệu**: đừng nói "AI thông minh/chính xác 100%" — nói cụ thể bằng cơ chế
(grounding, validate id, eval case) để chứng minh, giáo viên tin vào cơ chế cụ thể hơn là lời khẳng
định chung chung.
