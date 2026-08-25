// Pipeline nhập địa điểm hàng loạt, không gõ tay từng field (Hướng AI #1 trong kế hoạch
// nâng cấp AI). Tách rõ 2 nguồn:
//   - Sự thật (toạ độ, địa chỉ, giờ mở cửa, ảnh): lấy từ Google Places API — KHÔNG để LLM
//     tự bịa vì hallucinate địa chỉ/giờ mở cửa rất dễ mà không ai phát hiện.
//   - Nội dung mềm (mô tả, tags, thời gian tham quan gợi ý): sinh bằng Claude từ dữ liệu thật ở trên.
// Ghi vào Firestore ở trạng thái NHÁP (isActive: false) — KHÔNG tự public. Admin duyệt qua
// tab "Chờ duyệt" ở trang Địa điểm (admin/) rồi mới bật isActive.
//
// Cần trước khi chạy:
//   1. Biến môi trường GOOGLE_PLACES_API_KEY (bật "Places API" trong Google Cloud Console)
//      và ANTHROPIC_API_KEY.
//   2. Giống các script seed trước (seed_vr360, seed places/tours Giai đoạn 2/6): tạm nới
//      firestore.rules cho phép user đã đăng nhập tạo `places`
//      (`allow create: if isSignedIn()`), deploy, chạy xong thì trả rule gốc
//      (`isContentEditor()`-only) và deploy lại.
//
// Chạy: cd scripts/import_places && npm install && npm run import

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  GeoPoint,
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const firebaseConfig = {
  apiKey: 'AIzaSyDHn-Eio0vVPfzWR6PS1t347Bg23AfNrK0',
  appId: '1:591974579800:web:978bcd62808b3bb5aa542d',
  messagingSenderId: '591974579800',
  projectId: 'travelapp-7f140',
  authDomain: 'travelapp-7f140.firebaseapp.com',
  storageBucket: 'travelapp-7f140.firebasestorage.app',
};

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PLACE_TAGS = ['Lịch sử', 'Thiên nhiên', 'Ẩm thực', 'Văn hoá', 'Biển đảo', 'Núi rừng', 'Tâm linh', 'Đô thị'];
const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']; // khớp thứ tự day của Google (0=CN)

if (!GOOGLE_PLACES_API_KEY || !ANTHROPIC_API_KEY) {
  console.error('Thiếu biến môi trường GOOGLE_PLACES_API_KEY hoặc ANTHROPIC_API_KEY.');
  process.exit(1);
}

const DESCRIBE_PLACE_TOOL = {
  name: 'describe_place',
  description: 'Sinh nội dung mô tả cho địa điểm du lịch dựa trên dữ liệu thật đã cho.',
  input_schema: {
    type: 'object',
    properties: {
      description: { type: 'string', description: '2-3 câu mô tả hấp dẫn bằng tiếng Việt, dựa trên dữ liệu thật, không bịa thêm sự kiện/lịch sử không chắc chắn.' },
      tags: {
        type: 'array',
        items: { type: 'string', enum: PLACE_TAGS },
        description: `Chọn 1-3 tag phù hợp nhất trong danh sách: ${PLACE_TAGS.join(', ')}.`,
      },
      visitDurationMinutes: { type: 'number', description: 'Thời gian tham quan gợi ý (phút), ước lượng hợp lý theo loại địa điểm.' },
    },
    required: ['description', 'tags', 'visitDurationMinutes'],
  },
};

function toTimeRange(period) {
  const open = period.open?.time;
  const close = period.close?.time;
  if (!open) return null;
  const fmt = (t) => `${t.slice(0, 2)}:${t.slice(2, 4)}`;
  return `${fmt(open)}-${close ? fmt(close) : '23:59'}`;
}

function buildOpeningHours(periods) {
  if (!Array.isArray(periods) || periods.length === 0) return null;
  const hours = {};
  for (const period of periods) {
    const day = period.open?.day;
    if (day === undefined) continue;
    const key = WEEKDAY_KEYS[day];
    const range = toTimeRange(period);
    if (key && range) hours[key] = range;
  }
  return Object.keys(hours).length > 0 ? hours : null;
}

async function findPlaceId(query) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json');
  url.searchParams.set('input', query);
  url.searchParams.set('inputtype', 'textquery');
  url.searchParams.set('fields', 'place_id');
  url.searchParams.set('key', GOOGLE_PLACES_API_KEY);
  const res = await fetch(url);
  const json = await res.json();
  if (json.status !== 'OK' || !json.candidates?.[0]?.place_id) {
    throw new Error(`Không tìm thấy trên Google Places (status=${json.status}): ${query}`);
  }
  return json.candidates[0].place_id;
}

async function getPlaceDetails(placeId) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set(
    'fields',
    'name,formatted_address,geometry,opening_hours,photo,rating,user_ratings_total'
  );
  url.searchParams.set('language', 'vi');
  url.searchParams.set('key', GOOGLE_PLACES_API_KEY);
  const res = await fetch(url);
  const json = await res.json();
  if (json.status !== 'OK' || !json.result) {
    throw new Error(`Không lấy được chi tiết địa điểm (status=${json.status})`);
  }
  return json.result;
}

function photoUrl(photoReference) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/photo');
  url.searchParams.set('maxwidth', '1200');
  url.searchParams.set('photo_reference', photoReference);
  url.searchParams.set('key', GOOGLE_PLACES_API_KEY);
  // Lưu ý: đây là URL hotlink trực tiếp tới Google (redirect tới ảnh thật), dùng tạm cho tới khi
  // Firebase Storage được bật — lúc đó nên tải về rồi upload lại vào Storage thay vì hotlink mãi.
  return url.toString();
}

async function describeWithClaude(client, details) {
  const response = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 512,
    system: 'Bạn là biên tập viên nội dung du lịch cho ứng dụng TngGuide. Chỉ dùng dữ liệu thật được cung cấp, không bịa thêm sự kiện lịch sử hay chi tiết không chắc chắn.',
    tools: [DESCRIBE_PLACE_TOOL],
    tool_choice: { type: 'tool', name: 'describe_place' },
    messages: [
      {
        role: 'user',
        content: `Tên địa điểm: ${details.name}\nĐịa chỉ: ${details.formatted_address}\nĐánh giá Google: ${details.rating ?? 'không có'} (${details.user_ratings_total ?? 0} lượt)`,
      },
    ],
  });
  const block = response.content.find((b) => b.type === 'tool_use' && b.name === 'describe_place');
  if (!block) throw new Error('Claude không trả về tool_use describe_place');
  return block.input;
}

async function main() {
  const queries = JSON.parse(readFileSync(path.join(__dirname, 'places.json'), 'utf-8'));

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const email = `import_places.seed.${Date.now()}@travelai-test.local`;
  const password = `Seed${Date.now()}!`;
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  await setDoc(doc(db, 'users', uid), {
    uid,
    email,
    displayName: 'Import Places Script',
    photoURL: null,
    phoneNumber: null,
    role: 'user',
    preferences: [],
    language: 'vi',
    isDisabled: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  console.log('Đã tạo tài khoản seed tạm:', email);

  const existingSnap = await getDocs(collection(db, 'places'));
  const existingNames = new Set(Array.from(existingSnap.docs, (d) => d.data().name));

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const query of queries) {
    try {
      const placeId = await findPlaceId(query);
      const details = await getPlaceDetails(placeId);

      if (existingNames.has(details.name)) {
        console.log(`BỎ QUA (đã tồn tại): ${details.name}`);
        skipped++;
        continue;
      }

      const enrichment = await describeWithClaude(anthropic, details);

      const location = details.geometry?.location;
      if (!location) throw new Error('Thiếu toạ độ từ Google Places');

      const coverImage = details.photo?.[0] ? photoUrl(details.photo[0].photo_reference) : '';
      const openingHours = buildOpeningHours(details.opening_hours?.periods);

      const placeRef = doc(collection(db, 'places'));
      await setDoc(placeRef, {
        name: details.name,
        description: enrichment.description,
        address: details.formatted_address ?? '',
        location: new GeoPoint(location.lat, location.lng),
        tags: enrichment.tags,
        images: coverImage ? [coverImage] : [],
        coverImage,
        ...(openingHours ? { openingHours } : {}),
        ticketPrice: 0,
        ratingAvg: 0,
        ratingCount: 0,
        visitDurationMinutes: enrichment.visitDurationMinutes,
        isFeatured: false,
        isActive: false, // NHÁP — chờ admin duyệt qua tab "Chờ duyệt"
        has360: false,
        createdBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      existingNames.add(details.name);
      created++;
      console.log(`+ Đã tạo (nháp): ${details.name} -> ${placeRef.id}`);
    } catch (err) {
      failed++;
      console.error(`LỖI với "${query}":`, err.message);
    }
  }

  console.log(`\nHoàn tất. Tạo mới: ${created}, bỏ qua (trùng): ${skipped}, lỗi: ${failed}.`);
  console.log('Vào Admin Dashboard > Địa điểm > tab "Chờ duyệt" để xem/sửa/duyệt.');
  console.log('Tài khoản seed tạm (có thể xoá ở Firebase Console > Authentication):', email);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
