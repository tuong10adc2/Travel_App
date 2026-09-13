/**
 * Lập lịch trình nhiều ngày theo khoảng cách địa lý — thuần thuật toán (không gọi LLM).
 * Mô hình ngôn ngữ chỉ chọn ĐỊA ĐIỂM phù hợp sở thích; việc nhóm theo khu vực, sắp thứ tự
 * di chuyển, và tính giờ ghé thăm theo giờ mở cửa do code đảm nhiệm, vì LLM suy luận
 * toạ độ/khoảng cách/giờ giấc không đáng tin cậy.
 */

export interface GeoPoint {
  id: string;
  lat: number;
  lng: number;
}

/** Thông tin 1 địa điểm cần để tính lịch trình theo giờ (ngoài toạ độ). */
export interface PlaceScheduleInfo extends GeoPoint {
  visitDurationMinutes?: number; // 0/thiếu -> dùng mặc định DEFAULT_VISIT_MINUTES
  openingHours?: Record<string, string>; // vd { mon: "08:00-17:00", ... } — thiếu = mở cả ngày
}

export interface ScheduledStop {
  placeId: string;
  arrival: string; // "HH:MM"
  departure: string; // "HH:MM"
}

export interface DayPlan {
  dayIndex: number;
  placeIds: string[];
  schedule: ScheduledStop[];
  /** Cảnh báo bằng tiếng Việt, vd địa điểm có thể bị ghé lúc đã đóng cửa — để model diễn giải lại cho người dùng. */
  warnings: string[];
}

const DEFAULT_VISIT_MINUTES = 60;
const DAY_START_MINUTES = 8 * 60; // 08:00 — giờ xuất phát mặc định mỗi ngày
const AVG_SPEED_KMH = 30; // tốc độ di chuyển trung bình trong đô thị/liên tỉnh gần, gồm cả thời gian gửi xe/chờ

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(Math.min(1, h)));
}

function minutesToClock(minutes: number): string {
  const m = Math.max(0, Math.round(minutes)) % (24 * 60);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function parseClockToMinutes(clock: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(clock.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/** Lấy 1 khung giờ đại diện từ `openingHours` — hầu hết địa điểm mở cùng giờ mọi ngày trong
 * tuần nên chỉ cần lấy giá trị đầu tiên tìm thấy, không cần biết đúng thứ mấy trong lịch thật
 * (lịch trình AI gợi ý chưa gắn ngày cụ thể). Trả về `null` nếu không rõ giờ hoặc mở 24/24. */
function representativeHours(openingHours?: Record<string, string>): { openMin: number; closeMin: number } | null {
  if (!openingHours) return null;
  const value = Object.values(openingHours).find((v) => typeof v === "string" && v.includes("-"));
  if (!value) return null;
  const [openStr, closeStr] = value.split("-");
  const openMin = parseClockToMinutes(openStr);
  const closeMin = parseClockToMinutes(closeStr);
  if (openMin === null || closeMin === null) return null;
  if (openMin === 0 && (closeMin === 0 || closeMin >= 23 * 60 + 59)) return null; // mở cả ngày, không cần cảnh báo
  return { openMin, closeMin };
}

/**
 * K-means (k = số ngày) trên toạ độ lat/lng. Seed centroid đơn giản bằng cách sắp xếp điểm
 * theo lat+lng rồi lấy mẫu đều — có chủ đích tránh dùng số ngẫu nhiên để kết quả tái lập được.
 */
function clusterByDay(points: GeoPoint[], days: number): GeoPoint[][] {
  const k = Math.max(1, Math.min(days, points.length));
  if (k === 1) return [points];

  const sorted = [...points].sort((a, b) => a.lat + a.lng - (b.lat + b.lng));
  const centroids = Array.from({ length: k }, (_, i) => {
    const idx = Math.floor((i * sorted.length) / k);
    return { lat: sorted[idx].lat, lng: sorted[idx].lng };
  });

  let clusters: GeoPoint[][] = [];
  const MAX_ITERATIONS = 10;
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    clusters = Array.from({ length: k }, () => [] as GeoPoint[]);
    for (const p of points) {
      let bestIdx = 0;
      let bestDist = Infinity;
      centroids.forEach((c, ci) => {
        const d = haversineKm(p, c);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = ci;
        }
      });
      clusters[bestIdx].push(p);
    }
    // Không để cụm nào rỗng — lấy 1 điểm từ cụm đông nhất bù sang, tránh mất hẳn 1 ngày.
    for (let ci = 0; ci < k; ci++) {
      if (clusters[ci].length === 0) {
        const donorIdx = clusters.reduce(
          (best, c, i) => (c.length > clusters[best].length ? i : best),
          0
        );
        if (clusters[donorIdx].length > 1) {
          clusters[ci].push(clusters[donorIdx].pop()!);
        }
      }
    }
    centroids.forEach((c, ci) => {
      const pts = clusters[ci];
      if (pts.length === 0) return;
      c.lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
      c.lng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
    });
  }
  return clusters;
}

/** Greedy nearest-neighbor — đủ tốt cho vài điểm/ngày, không cần TSP tối ưu tuyệt đối. */
function orderByNearestNeighbor(points: GeoPoint[]): GeoPoint[] {
  if (points.length <= 1) return points;
  const remaining = [...points];
  const route: GeoPoint[] = [remaining.shift()!];
  while (remaining.length > 0) {
    const last = route[route.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((p, i) => {
      const d = haversineKm(last, p);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    route.push(remaining.splice(bestIdx, 1)[0]);
  }
  return route;
}

/**
 * Tính giờ ghé thăm từng điểm trong 1 ngày theo thứ tự đã sắp: cộng dồn thời gian di chuyển
 * (khoảng cách Haversine / tốc độ trung bình) + thời gian tham quan mỗi điểm, có đối chiếu giờ
 * mở cửa — chờ tới giờ mở nếu tới sớm, cảnh báo nếu tới sau giờ đóng cửa (vẫn giữ nguyên thứ tự
 * do nearest-neighbor tính, vì đổi thứ tự sẽ tốn thêm quãng đường — chỉ cảnh báo để AI/người dùng
 * tự cân nhắc, không tự ý bỏ địa điểm khỏi lịch trình).
 */
function scheduleDay(
  orderedPoints: GeoPoint[],
  infoById: Map<string, PlaceScheduleInfo>
): { schedule: ScheduledStop[]; warnings: string[] } {
  const schedule: ScheduledStop[] = [];
  const warnings: string[] = [];
  let currentMinutes = DAY_START_MINUTES;

  orderedPoints.forEach((point, i) => {
    if (i > 0) {
      const travelKm = haversineKm(orderedPoints[i - 1], point);
      const travelMinutes = (travelKm / AVG_SPEED_KMH) * 60;
      currentMinutes += travelMinutes;
    }

    const info = infoById.get(point.id);
    const hours = representativeHours(info?.openingHours);
    if (hours) {
      if (currentMinutes < hours.openMin) {
        currentMinutes = hours.openMin; // tới sớm, chờ tới giờ mở cửa
      } else if (currentMinutes >= hours.closeMin) {
        warnings.push(
          `Có thể tới nơi lúc ${minutesToClock(currentMinutes)}, sau giờ đóng cửa (${minutesToClock(hours.closeMin)}) — cân nhắc đổi thứ tự hoặc bớt điểm trong ngày.`
        );
      }
    }

    const visitMinutes = info?.visitDurationMinutes && info.visitDurationMinutes > 0
      ? info.visitDurationMinutes
      : DEFAULT_VISIT_MINUTES;
    const arrival = currentMinutes;
    const departure = currentMinutes + visitMinutes;
    schedule.push({ placeId: point.id, arrival: minutesToClock(arrival), departure: minutesToClock(departure) });
    currentMinutes = departure;
  });

  return { schedule, warnings };
}

export function computeGeoItinerary(
  placeIds: string[],
  days: number,
  placesInfo: Map<string, PlaceScheduleInfo>
): DayPlan[] {
  const points = placeIds
    .filter((id, i) => placeIds.indexOf(id) === i) // bỏ trùng lặp nếu model lỡ liệt kê 2 lần
    .map((id) => placesInfo.get(id))
    .filter((p): p is PlaceScheduleInfo => p !== undefined);

  if (points.length === 0) return [];

  const clusters = clusterByDay(points, days);
  return clusters
    .map((cluster) => orderByNearestNeighbor(cluster))
    .filter((ordered) => ordered.length > 0)
    .map((ordered, dayIndex) => {
      const { schedule, warnings } = scheduleDay(ordered, placesInfo);
      return { dayIndex, placeIds: ordered.map((p) => p.id), schedule, warnings };
    });
}
