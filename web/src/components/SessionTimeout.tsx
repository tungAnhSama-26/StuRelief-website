'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function SessionTimeout() {
  const router = useRouter();
  const pathname = usePathname();
  const isLoggingOut = useRef(false);

  useEffect(() => {
    // Không áp dụng cho các trang public như login, register
    if (pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const logout = async () => {
      if (isLoggingOut.current) return;
      isLoggingOut.current = true;
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        localStorage.removeItem('lastActive');
        window.location.href = '/login?session_expired=true';
      } catch (e) {
        console.error(e);
      } finally {
        isLoggingOut.current = false;
      }
    };

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      // 10 phút = 10 * 60 * 1000 = 600000 ms
      timeoutId = setTimeout(logout, 600000);
      localStorage.setItem('lastActive', Date.now().toString());
    };

    const checkInitial = () => {
      const lastActive = localStorage.getItem('lastActive');
      if (lastActive && Date.now() - parseInt(lastActive, 10) > 600000) {
        // Đã quá 10 phút từ lần cuối hoạt động -> logout ngay
        logout();
      } else {
        resetTimeout();
      }
    };

    checkInitial();

    // Lắng nghe các sự kiện hoạt động của người dùng
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, resetTimeout, { passive: true });
    });

    // Lắng nghe cả sự thay đổi tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkInitial();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimeout);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router, pathname]);

  return null;
}
