import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Image src="/logo.png" alt="TngGuide" width={32} height={32} className="h-8 w-8 rounded-lg object-cover" />
              <span className="text-base font-semibold text-foreground">TngGuide</span>
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
          © {new Date().getFullYear()} TngGuide. Trợ lý du lịch thông minh khám phá Việt Nam.
        </div>
      </div>
    </footer>
  );
}
