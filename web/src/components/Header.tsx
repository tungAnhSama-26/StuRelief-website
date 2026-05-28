'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  HeartHandshake, 
  LogIn, 
  LogOut, 
  User, 
  GraduationCap, 
  ShieldCheck
} from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; role: 'STUDENT' | 'ADMIN'; fullName: string; avatarUrl?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user session status on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
            sessionStorage.setItem('sturelief_user', JSON.stringify(data.user));
          } else {
            setCurrentUser(null);
            sessionStorage.removeItem('sturelief_user');
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin phiên đăng nhập:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setCurrentUser(null);
        sessionStorage.removeItem('sturelief_user');
        router.refresh();
        window.location.reload(); // Reload to refresh all server-side counts
      }
    } catch (err) {
      console.error('Lỗi khi đăng xuất:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Side: Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-wide uppercase text-zinc-950 dark:text-white leading-none">StuRelief</span>
          </div>
        </Link>

        {/* Right Side: Auth / Actions */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-24 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
          ) : currentUser ? (
            <div className="flex items-center gap-3 sm:gap-4">
              
              {/* User Avatar + Greetings */}
              <div className="flex items-center gap-2.5">
                {/* Profile Picture Circle */}
                <div className={`w-9 h-9 rounded-full overflow-hidden shadow-sm border flex items-center justify-center font-black text-xs select-none ${
                  currentUser.role === 'ADMIN'
                    ? 'border-red-200 dark:border-red-900/40 bg-red-600 text-white'
                    : 'border-slate-200 dark:border-zinc-800 bg-blue-600 text-white'
                }`}>
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : currentUser.role === 'ADMIN' ? (
                    <span>AD</span>
                  ) : (
                    <span>{currentUser.fullName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium text-zinc-900 dark:text-white leading-tight">
                    {currentUser.fullName}
                  </span>
                </div>
              </div>

              {/* Role Authorization Badge */}
              <div className="flex items-center">
                {currentUser.role === 'ADMIN' ? (
                  <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wide">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Quản trị viên</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-xl text-xs font-extrabold uppercase tracking-wide">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Sinh viên</span>
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 hover:text-red-500 rounded-2xl transition-colors cursor-pointer text-zinc-500 dark:text-zinc-400"
                title="Đăng xuất khỏi hệ thống"
              >
                <LogOut className="w-5 h-5" />
              </button>

            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium text-sm px-5 py-2.5 rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all active:scale-[0.98]"
            >
              <LogIn className="w-4.5 h-4.5" />
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
