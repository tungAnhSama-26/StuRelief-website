'use client';

import Link from 'next/link';
import { ArrowUpRight, HeartHandshake, Mail, MapPin, Phone } from 'lucide-react';
import { APP_ROUTES } from '@shared';

export default function DashboardFooter() {
  return (
    <footer className="mt-8 overflow-hidden rounded-[28px] border border-[#dfe3ea] bg-white shadow-sm dark:border-[#3a3b3c] dark:bg-[#242526]">
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-400" />

      <div className="grid gap-8 p-6 md:grid-cols-3 md:p-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0084ff] text-white shadow-md shadow-[#0084ff]/20">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-950 dark:text-white">StuRelief</p>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Chợ đồ cũ sinh viên</p>
            </div>
          </div>

          <p className="max-w-sm text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Nơi sinh viên mua bán, trao đổi và thanh lý đồ dùng học tập với nhịp giao dịch nhanh, rõ ràng và an toàn.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium text-zinc-950 dark:text-white">Lối tắt</p>
          <div className="flex flex-col gap-2">
            <Link className="text-sm text-zinc-600 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400" href={APP_ROUTES.HOME}>
              Chợ đồ cũ
            </Link>
            <Link className="text-sm text-zinc-600 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400" href={APP_ROUTES.VERIFICATION}>
              Xác thực sinh viên
            </Link>
            <Link className="text-sm text-zinc-600 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400" href={APP_ROUTES.MEETING_POINTS}>
              Điểm hẹn giao dịch
            </Link>
            <Link className="text-sm text-zinc-600 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400" href={APP_ROUTES.ADMIN.REPUTATION}>
              Uy tín & đánh giá
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium text-zinc-950 dark:text-white">Hỗ trợ</p>
          <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-cyan-500" />
              <span>1900 6522</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-cyan-500" />
              <span>support@sturelief.vn</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-cyan-500" />
              <span>Dành cho cộng đồng sinh viên</span>
            </div>
          </div>

          <button
            onClick={() => {
              window.location.href = APP_ROUTES.HOME;
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#0084ff] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0084ff]/20 transition-all hover:bg-blue-500"
          >
            Khám phá chợ
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-[#edf0f5] px-6 py-4 text-xs text-zinc-500 dark:border-[#3a3b3c] dark:text-zinc-400 md:flex-row md:items-center md:justify-between md:px-8">
        <span>© 2026 StuRelief. Giao dịch dành cho sinh viên.</span>
        <span>An toàn, gọn, và dễ trao đổi.</span>
      </div>
    </footer>
  );
}
