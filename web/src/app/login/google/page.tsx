'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, HeartHandshake, ArrowRight } from 'lucide-react';

export default function GoogleLoginRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    window.location.href = '/api/auth/google?returnTo=/';
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <HeartHandshake className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Đang chuyển tới Google
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Hệ thống sẽ mở trang xác thực Google thật để đăng nhập vào StuRelief.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang xử lý...
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.href = '/api/auth/google?returnTo=/';
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Tiếp tục ngay
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </main>
  );
}
