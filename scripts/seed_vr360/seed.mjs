// Seed script cho Giai đoạn 4 (VR 360°).
// CHỈ chạy sau khi:
//   1. Firebase Storage đã được bật ở Console (project travelapp-7f140)
//   2. firestore.rules và storage.rules đã được deploy ở bản "tạm nới"
//      (allow write cho user đã đăng nhập trên media_360 / places / storage)
// Sau khi script chạy xong, nhớ deploy lại rule gốc (siết chặt).
//
// Dùng client SDK (giống các script seed places/tours ở Giai đoạn 2 & 6),
// ký bằng 1 tài khoản test tạo mới, KHÔNG dùng service account key.

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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

// { placeName trong Firestore -> [ { file, title, order, hotspots? } ] }
const PLAN = {
  'Vịnh Hạ Long': [
    { file: 'ha_long_bien.jpg', title: 'Trên biển', order: 0, hotspotToOrder: 1 },
    { file: 'ha_long_dinh_nui.jpg', title: 'Đỉnh núi', order: 1, hotspotToOrder: 0 },
  ],
  'Phố cổ Hội An': [{ file: 'hoi_an.jpg', title: 'Phố cổ về đêm', order: 0 }],
  'Đà Lạt': [{ file: 'da_lat.jpg', title: 'Đồi thông', order: 0 }],
  'Sa Pa': [{ file: 'sa_pa.jpg', title: 'Ruộng bậc thang', order: 0 }],
  'Phú Quốc': [{ file: 'phu_quoc.jpg', title: 'Bãi biển', order: 0 }],
};

async function main() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  const email = `vr360.seed.${Date.now()}@travelai-test.local`;
  const password = `Seed${Date.now()}!`;
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  await setDoc(doc(db, 'users', uid), {
    uid,
    email,
    displayName: 'VR360 Seed Script',
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

  const placesSnap = await getDocs(collection(db, 'places'));
  const placesByName = new Map();
  placesSnap.forEach((d) => placesByName.set(d.data().name, { id: d.id, ...d.data() }));

  for (const [placeName, mediaItems] of Object.entries(PLAN)) {
    const place = placesByName.get(placeName);
    if (!place) {
      console.warn('BỎ QUA (không tìm thấy địa điểm):', placeName);
      continue;
    }

    const idsByOrder = {};
    const createdMediaIds = [];

    for (const item of mediaItems) {
      const filePath = path.join(__dirname, 'images', item.file);
      const bytes = readFileSync(filePath);
      const storagePath = `media_360/${place.id}/${item.file}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, bytes, { contentType: 'image/jpeg' });
      const url = await getDownloadURL(storageRef);

      const mediaDocRef = doc(collection(db, 'media_360'));
      idsByOrder[item.order] = mediaDocRef.id;
      createdMediaIds.push({ ref: mediaDocRef, item });

      await setDoc(mediaDocRef, {
        placeId: place.id,
        type: 'image',
        url,
        title: item.title,
        order: item.order,
        hotspots: [],
        createdAt: serverTimestamp(),
      });
      console.log(`  + media_360 [${placeName}] "${item.title}" ->`, mediaDocRef.id);
    }

    // Gắn hotspot liên kết 2 điểm nhìn (chỉ Vịnh Hạ Long có 2 viewpoint)
    for (const { ref: mediaDocRef, item } of createdMediaIds) {
      if (item.hotspotToOrder === undefined) continue;
      const targetId = idsByOrder[item.hotspotToOrder];
      if (!targetId) continue;
      await updateDoc(mediaDocRef, {
        hotspots: [{ targetMediaId: targetId, yaw: 0, pitch: 0, label: 'Xem điểm nhìn khác' }],
      });
    }

    await updateDoc(doc(db, 'places', place.id), { has360: true, updatedAt: serverTimestamp() });
    console.log(`  -> đã bật has360 cho "${placeName}"`);
  }

  console.log('\nHoàn tất. Tài khoản seed tạm (có thể xoá sau ở Firebase Console > Authentication):', email);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
