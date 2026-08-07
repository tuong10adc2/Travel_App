import Link from "next/link";
import { Compass } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Compass className="h-4.5 w-4.5" />
              </div>
              <span className="text-base font-semibold text-foreground">VietGuide AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Trợ lý du lịch số riêng bạn — mang đến tri thức bản địa và dẫn đường thông minh
              tới mọi miền đất nước.
            </p>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-foreground">Khám phá</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/explore" className="hover:text-brand-700">Địa điểm</Link></li>
              <li><Link href="/tours" className="hover:text-brand-700">Tour gợi ý</Link></li>
              <li><Link href="/itineraries" className="hover:text-brand-700">Lịch trình của tôi</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-foreground">Tính năng AI</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/chat" className="hover:text-brand-700">Hỏi đáp trợ lý AI</Link></li>
              <li><span>Dẫn đường thông minh</span></li>
              <li><span>Xem trước 360°</span></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-foreground">Tài khoản</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/login" className="hover:text-brand-700">Đăng nhập</Link></li>
              <li><Link href="/register" className="hover:text-brand-700">Đăng ký</Link></li>
              <li><Link href="/profile" className="hover:text-brand-700">Hồ sơ</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} VietGuide AI. Trợ lý du lịch thông minh khám phá Việt Nam.
        </div>
      </div>
    </footer>
  );
}
