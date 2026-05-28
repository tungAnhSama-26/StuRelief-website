'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@shared';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '@/lib/alerts';

type FeedbackState = {
  message: string;
  type: 'success' | 'error';
} | null;

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      showSuccessAlert('Thành công!', message);
    } else {
      showErrorAlert('Lỗi!', message);
    }
  };

  const clearNonAdminSession = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore logout cleanup failures
    } finally {
      sessionStorage.removeItem('sturelief_user');
    }
  };

  // Sync current session on mount
  useEffect(() => {
    let active = true;
    const syncCurrentSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;
        const data = await res.json();
        if (!active || !data.user) return;
        if (data.user.role === 'ADMIN') {
          sessionStorage.setItem('sturelief_user', JSON.stringify(data.user));
          router.replace(APP_ROUTES.ADMIN.DASHBOARD);
          return;
        }
        await clearNonAdminSession();
        if (active) {
          showFeedback('Tài khoản hiện tại không có quyền quản trị.', 'error');
        }
      } catch {
        // ignore auth sync errors on the login screen
      }
    };
    syncCurrentSession();
    return () => {
      active = false;
    };
  }, [router]);

  // Handle login form submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showFeedback('Vui lòng nhập đầy đủ email và mật khẩu quản trị.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Đăng nhập quản trị thất bại.');
      }
      if (data.user?.role !== 'ADMIN') {
        await clearNonAdminSession();
        throw new Error('Tài khoản này không có quyền quản trị.');
      }
      sessionStorage.setItem('sturelief_user', JSON.stringify(data.user));
      showFeedback('Đăng nhập quản trị thành công. Đang chuyển hướng...', 'success');
      setTimeout(() => {
        router.push(APP_ROUTES.ADMIN.DASHBOARD);
        router.refresh();
      }, 800);
    } catch (err: any) {
      showFeedback(err.message || 'Không thể đăng nhập cổng quản trị.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Error handling from URL params (Google OAuth)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err === 'google_not_configured') {
      showFeedback('Chưa cấu hình Google Client ID/Secret cho cổng quản trị.', 'error');
    } else if (err === 'google_not_admin') {
      showFeedback('Tài khoản Google này không có quyền truy cập cổng quản trị.', 'error');
    } else if (err === 'google_oauth_denied') {
      showFeedback('Bạn đã hủy đăng nhập Google quản trị.', 'error');
    } else if (err === 'google_oauth_state_invalid') {
      showFeedback('Phiên đăng nhập Google quản trị không hợp lệ, vui lòng thử lại.', 'error');
    } else if (err === 'google_oauth_failed') {
      showFeedback('Xác thực Google cho quản trị viên thất bại.', 'error');
    } else if (err === 'google_email_missing') {
      showFeedback('Tài khoản Google này không cung cấp email.', 'error');
    } else if (err === 'google_server_error') {
      showFeedback('Máy chủ gặp lỗi khi xử lý đăng nhập Google quản trị.', 'error');
    }
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.14),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef6ff_100%)] p-4 sm:p-6 md:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl items-center justify-center">
        <section className="w-full max-w-lg rounded-[32px] border border-sky-100 bg-white/94 px-6 py-8 shadow-[0_24px_80px_rgba(59,130,246,0.12)] backdrop-blur-xl sm:px-8 md:px-10">
          <Link href={APP_ROUTES.LOGIN} className="mb-8 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500 transition hover:text-sky-700">
            <ArrowLeft className="h-4 w-4" />
            Về trang sinh viên
          </Link>
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[24px] bg-sky-100 text-sky-700">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-[0.22em] text-sky-600">Admin Login</div>
              <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Đăng nhập quản trị</h2>
            </div>
          </div>
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Email quản trị</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sturelief.vn"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Mật khẩu</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-400 transition hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-4 text-sm font-black tracking-wide text-white transition hover:bg-sky-700 active:scale-[0.99] ${loading ? 'cursor-wait opacity-80' : 'cursor-pointer'}`}
            >
              <LogIn className="h-4.5 w-4.5" />
              <span>{loading ? 'Đang xác thực...' : 'Vào bảng điều khiển quản trị'}</span>
            </button>
            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-x-0 h-px bg-slate-200" />
              <span className="relative bg-white px-4 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">hoặc</span>
            </div>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/api/auth/google?returnTo=/admin';
              }}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 active:scale-[0.99]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Đăng nhập Google quản trị</span>
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
