import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cho phép đọc ảnh cross-origin từ Flutter Web (app-web) — CanvasKit renderer
  // của Flutter Web coi ảnh cross-origin thiếu CORS là "tainted", vẽ lên canvas
  // thất bại (khác với thẻ <img> thường của webapp, không cần CORS).
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
    ];
  },
};

export default nextConfig;
