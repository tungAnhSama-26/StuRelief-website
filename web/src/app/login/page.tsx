'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { APP_ROUTES } from '@shared';
import { Suspense } from 'react';
import { 
  HeartHandshake, 
  Mail, 
  Lock, 
  User, 
  GraduationCap, 
  Check, 
  AlertCircle, 
  Eye,
  EyeOff,
} from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // States
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Feedback Toast
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(() => {
    const err = searchParams.get('error');
    if (err === 'google_not_configured') {
      return { message: 'Chưa cấu hình Google Client ID/Secret cho đăng nhập Google thật.', type: 'error' };
    }
    if (err === 'google_oauth_denied') {
      return { message: 'Bạn đã hủy đăng nhập Google.', type: 'error' };
    }
    if (err === 'google_oauth_state_invalid') {
      return { message: 'Phiên đăng nhập Google không hợp lệ, vui lòng thử lại.', type: 'error' };
    }
    if (err === 'google_oauth_failed') {
      return { message: 'Xác thực tài khoản Google OAuth thất bại!', type: 'error' };
    }
    if (err === 'google_email_missing') {
      return { message: 'Tài khoản Google của bạn không công khai Email!', type: 'error' };
    }
    if (err === 'google_database_unavailable') {
      return { message: 'Database đang offline, chưa thể lưu tài khoản Google.', type: 'error' };
    }
    if (err === 'google_server_error') {
      return { message: 'Lỗi máy chủ khi xử lý đăng nhập Google!', type: 'error' };
    }
    return null;
  });

  // Automatically clear feedback toast after 4 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Listen to Google OAuth callback parameters & error redirects
  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
  };

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error) return error.message || fallback;
    return fallback;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showFeedback('Vui lòng điền đầy đủ email và mật khẩu!', 'error');
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
        throw new Error(data.message || 'Đã xảy ra lỗi!');
      }

      showFeedback('Đăng nhập thành công! Đang chuyển hướng...', 'success');
      
      // Store user details for this browser session only
      sessionStorage.setItem('sturelief_user', JSON.stringify(data.user));
      
      // Redirect home and force page refresh to sync header
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (err: unknown) {
      showFeedback(getErrorMessage(err, 'Tài khoản hoặc mật khẩu không chính xác!'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      showFeedback('Họ tên, email và mật khẩu là bắt buộc!', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          studentCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Đăng ký tài khoản thất bại!');
      }

      showFeedback('Đăng ký tài khoản thành công! Hãy đăng nhập.', 'success');
      
      // Switch back to Login view and pre-populate email
      setIsRegister(false);
      setPassword('');
    } catch (err: unknown) {
      showFeedback(getErrorMessage(err, 'Có lỗi xảy ra khi tạo tài khoản!'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans antialiased transition-colors duration-300">
      {/* Toast Alert */}
      {feedback && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
            : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
        }`}>
          {feedback.type === 'success' ? (
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-500" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-rose-500" />
            </div>
          )}
          <span className="font-medium text-sm">{feedback.message}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-6xl bg-white dark:bg-zinc-900/60 dark:backdrop-blur-xl rounded-[32px] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.06)] border border-slate-100 dark:border-zinc-800 flex flex-col md:flex-row transition-all duration-300">
        
        {/* Left Panel (Premium illustrated Branding/Bento Showcase) */}
        <div className="w-full md:w-1/2 bg-blue-600 dark:bg-blue-700 p-8 sm:p-12 md:p-16 flex flex-col justify-between relative overflow-hidden text-white min-h-[400px] md:min-h-[680px]">
          {/* Subtle decorative background glow and shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px] -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-[100px] -ml-20 -mb-20" />

          {/* StuRelief App Emblem */}
          <div className="relative flex items-center gap-3 z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <HeartHandshake className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-wide uppercase">StuRelief</span>
          </div>

          {/* Showcase Widgets (Mocking the beautiful design in user's request) */}
          <div className="relative z-10 my-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Stat 1 */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl">
                <span className="text-[10px] uppercase font-medium tracking-wider opacity-60">Sản phẩm hiện có</span>
                <div className="text-3xl font-extrabold mt-1">19+</div>
                <p className="text-[11px] opacity-70 mt-1">Tin rao đang hoạt động</p>
              </div>
              {/* Stat 2 */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl">
                <span className="text-[10px] uppercase font-medium tracking-wider opacity-60">Độ tin cậy</span>
                <div className="text-3xl font-extrabold mt-1">100%</div>
                <p className="text-[11px] opacity-70 mt-1">Xác thực mã sinh viên</p>
              </div>
            </div>
            
            {/* Horizontal Banner Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-medium text-lg">
                🤝
              </div>
              <div>
                <h4 className="font-medium text-sm">Giao dịch an toàn & tin cậy</h4>
                <p className="text-xs opacity-75 mt-0.5">Hỗ trợ gặp trực tiếp tại ký túc xá, giảng đường.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Panel (Interactive Login / Register Form) */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 md:p-16 flex flex-col justify-center bg-white dark:bg-zinc-900 transition-colors duration-300">
          
          {/* Logo (Emblem) */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 rounded-[22px] bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <HeartHandshake className="w-8 h-8" />
            </div>
          </div>

          {/* Welcome Titles */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">
              {isRegister ? 'Tạo Tài Khoản Mới!' : 'Chào Mừng Trở Lại!'}
            </h2>
          </div>

          {/* Dynamic Form Form */}
          <form onSubmit={isRegister ? handleRegisterSubmit : handleLoginSubmit} className="space-y-5">
            
            {/* FULL NAME (Only for Register) */}
            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Họ tên sinh viên</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyen Van A"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50/80 hover:bg-white dark:bg-zinc-800/60 dark:hover:bg-zinc-800/90 border border-slate-200 hover:border-blue-300 dark:border-zinc-700 dark:hover:border-blue-500/50 rounded-2xl text-sm focus:outline-none focus:ring-[4px] focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-500/20 dark:text-white transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-md focus:-translate-y-0.5"
                    required
                  />
                </div>
              </div>
            )}

            {/* EMAIL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Địa chỉ Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu.vn"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 hover:bg-slate-50 dark:bg-zinc-800/50 dark:hover:bg-zinc-800/80 border border-slate-200 hover:border-slate-300 dark:border-zinc-800 dark:hover:border-zinc-700 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:ring-blue-500/20 dark:text-white transition-all duration-300 shadow-sm"
                  required
                />
              </div>
            </div>

            {/* STUDENT CODE (Only for Register) */}
            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Mã sinh viên (Không bắt buộc)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    placeholder="MSSV123456"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50/80 hover:bg-white dark:bg-zinc-800/60 dark:hover:bg-zinc-800/90 border border-slate-200 hover:border-blue-300 dark:border-zinc-700 dark:hover:border-blue-500/50 rounded-2xl text-sm focus:outline-none focus:ring-[4px] focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-500/20 dark:text-white transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-md focus:-translate-y-0.5"
                  />
                </div>
              </div>
            )}

            {/* PASSWORD */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Mật khẩu</label>
                {!isRegister && (
                  <button 
                    type="button" 
                    onClick={() => showFeedback('Chức năng quên mật khẩu sẽ được hỗ trợ qua email sinh viên.', 'success')}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50/80 hover:bg-white dark:bg-zinc-800/60 dark:hover:bg-zinc-800/90 border border-slate-200 hover:border-blue-300 dark:border-zinc-700 dark:hover:border-blue-500/50 rounded-2xl text-sm focus:outline-none focus:ring-[4px] focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-500/20 dark:text-white transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-md focus:-translate-y-0.5"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold text-[15px] tracking-wide shadow-[0_8px_30px_rgb(59,130,246,0.4)] hover:shadow-[0_8px_30px_rgb(59,130,246,0.6)] hover:-translate-y-1 text-white bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                loading ? 'opacity-80 cursor-wait' : ''
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>{isRegister ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập'}</span>
              )}
            </button>



            <button
              type="button"
              onClick={() => {
                window.location.href = '/api/auth/google?returnTo=/';
              }}
              className="w-full py-3.5 rounded-2xl font-medium text-sm tracking-wide bg-white dark:bg-zinc-800/40 hover:bg-slate-50 dark:hover:bg-zinc-800/80 border border-slate-200 hover:border-slate-300 dark:border-zinc-700 dark:hover:border-zinc-600 text-slate-700 dark:text-zinc-200 transition-all duration-300 flex items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Google Colored Icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Đăng nhập với Google</span>
            </button>
          </form>

          {/* Form Switcher */}
          <div className="text-center mt-8">
            <span className="text-sm text-slate-500 dark:text-zinc-400">
              {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản sinh viên?'}
            </span>
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setFeedback(null);
              }}
              className="ml-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 transition-colors"
            >
              {isRegister ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
            </button>
          </div>

          <div className="text-center mt-4">
            <Link href={APP_ROUTES.ADMIN.LOGIN} className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
              Dành cho quản trị viên
            </Link>
          </div>

        </div>

      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-4">Đang tải...</div>}>
      <LoginContent />
    </Suspense>
  );
}
