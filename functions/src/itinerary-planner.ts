/**
 * Lập lịch trình nhiều ngày theo khoảng cách địa lý — thuần thuật toán (không gọi LLM).
 * Mô hình ngôn ngữ chỉ chọn ĐỊA ĐIỂM phù hợp sở thích; việc nhóm theo khu vực và sắp thứ tự
 * di chuyển trong ngày do code đảm nhiệm, vì LLM suy luận toạ độ/khoảng cách không đáng tin cậy.
 */

export interface GeoPoint {
  id: string;
  lat: number;
  lng: number;
}

export interface DayPlan {
  dayIndex: number;
  placeIds: string[];
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(Math.min(1, h)));
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

export function computeGeoItinerary(placeIds: string[], days: number, locations: Map<string, GeoPoint>): DayPlan[] {
  const points = placeIds
    .filter((id, i) => placeIds.indexOf(id) === i) // bỏ trùng lặp nếu model lỡ liệt kê 2 lần
    .map((id) => locations.get(id))
    .filter((p): p is GeoPoint => p !== undefined);

  if (points.length === 0) return [];

  const clusters = clusterByDay(points, days);
  return clusters
    .map((cluster) => orderByNearestNeighbor(cluster).map((p) => p.id))
    .filter((placeIdsInDay) => placeIdsInDay.length > 0)
    .map((placeIdsInDay, dayIndex) => ({ dayIndex, placeIds: placeIdsInDay }));
}
