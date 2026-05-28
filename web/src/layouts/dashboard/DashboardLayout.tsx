'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Bell, Sun, Moon, LogIn, Clock3, Sparkles, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import Sidebar from './Sidebar';
import DashboardFooter from './DashboardFooter';
import type { SecurityLogItem } from '@/lib/adminInsights';
import { APP_ROUTES } from '@shared';
import { useTheme } from 'next-themes';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeItemId?: string;
  pageTitle?: string;
}

const SIDEBAR_COLLAPSED_KEY = 'sturelief.dashboard.sidebar.collapsed';

type SessionUser = {
  id: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  fullName: string;
  avatarUrl?: string | null;
  status: string;
};

type DashboardNotification = {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL';
  createdAt: string;
  targetPath?: string;
};

const READ_NOTIFICATION_IDS_KEY = 'sturelief.dashboard.notifications.readIds';

export default function DashboardLayout({
  children,
  activeItemId,
  pageTitle = 'StuRelief Dashboard',
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarStateReady, setSidebarStateReady] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [notificationBadge, setNotificationBadge] = useState(0);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const storedReadIds = window.localStorage.getItem(READ_NOTIFICATION_IDS_KEY);
    if (!storedReadIds) return;
    try {
      const parsed = JSON.parse(storedReadIds);
      if (Array.isArray(parsed)) {
        setReadNotificationIds(parsed.filter((id) => typeof id === 'string'));
      }
    } catch {
      window.localStorage.removeItem(READ_NOTIFICATION_IDS_KEY);
    }
  }, []);
  useEffect(() => {
    try {
      const storedCollapsed = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (storedCollapsed !== null) {
        setIsCollapsed(storedCollapsed === '1');
      }
    } finally {
      setSidebarStateReady(true);
    }
  }, []);

  useEffect(() => {
    if (!sidebarStateReady) return;
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, isCollapsed ? '1' : '0');
  }, [isCollapsed, sidebarStateReady]);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  const markNotificationsRead = (ids: string[]) => {
    if (!ids.length) return;
    setReadNotificationIds((prev) => {
      const next = Array.from(new Set([...prev, ...ids]));
      window.localStorage.setItem(READ_NOTIFICATION_IDS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const fetchNotifications = useCallback(async () => {
    const items: DashboardNotification[] = [];
    const params = new URLSearchParams(window.location.search);

    if (params.get('login_success') === 'google') {
      items.push({
        id: 'login-success-google',
        title: 'Đăng nhập thành công',
        detail: 'Bạn đã đăng nhập bằng Google thành công.',
        timestamp: 'Vừa xong',
        type: 'INFO',
        targetPath: APP_ROUTES.HOME,
        createdAt: new Date().toISOString(),
      });
      params.delete('login_success');
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', nextUrl);
    }

    if (currentUser?.role === 'ADMIN') {
      try {
        const [logsRes, verificationsRes] = await Promise.all([
          fetch('/api/admin/logs?limit=8'),
          fetch('/api/admin/verifications?status=PENDING'),
        ]);

        if (logsRes.ok) {
          const data = await logsRes.json();
          const logs: SecurityLogItem[] = Array.isArray(data.logs) ? data.logs : [];
          items.push(
            ...logs
              .filter((log) =>
                ['ĐĂNG NHẬP', 'DUYỆT BÀI VIẾT', 'ẨN BÀI VIẾT', 'XÁC THỰC THÀNH VIÊN', 'CẬP NHẬT TRẠNG THÁI ĐƠN', 'SỬA TIN MÔ TẢ ĐANG GIAO DỊCH', 'TRỪ ĐIỂM UY TÍN', 'CỘNG ĐIỂM UY TÍN'].some((keyword) => log.action.includes(keyword))
              )
              .slice(0, 6)
              .map((log) => ({
                id: log.id,
                title: log.action,
                detail: log.details,
                timestamp: log.timestamp,
                type: log.type,
                targetPath:
                  log.action.includes('DUYỆT BÀI VIẾT') || log.action.includes('ẨN BÀI VIẾT')
                    ? APP_ROUTES.ADMIN.POSTS
                    : log.action.includes('XÁC THỰC THÀNH VIÊN')
                      ? APP_ROUTES.ADMIN.APPROVALS
                      : log.action.includes('CẬP NHẬT TRẠNG THÁI ĐƠN')
                        ? APP_ROUTES.ADMIN.LOGS
                        : log.action.includes('TRỪ ĐIỂM UY TÍN') || log.action.includes('CỘNG ĐIỂM UY TÍN')
                          ? APP_ROUTES.ADMIN.REPUTATION
                          : log.action.includes('SỬA TIN MÔ TẢ ĐANG GIAO DỊCH')
                            ? APP_ROUTES.ADMIN.DISPUTES
                            : APP_ROUTES.ADMIN.LOGS,
                createdAt: new Date(log.createdAt).toISOString(),
              }))
          );
        }

        if (verificationsRes.ok) {
          const verifications = await verificationsRes.json();
          items.push(
            ...verifications.slice(0, 4).map((request: { id: string; fullName: string; mssv: string; campus: string; date: string; createdAt: string }) => ({
              id: `pending-verification-${request.id}`,
              title: 'Xác thực đang chờ duyệt',
              detail: `${request.fullName} · ${request.mssv} · ${request.campus}`,
              timestamp: 'Đang chờ xử lý',
              type: 'WARNING' as const,
              targetPath: APP_ROUTES.ADMIN.APPROVALS,
              createdAt: new Date(request.createdAt).toISOString(),
            }))
          );
        }
      } catch {
        // ignore notification fetch errors
      }
    }

    if (currentUser) {
      try {
        const [notificationsRes, userProductsRes] = await Promise.all([
          fetch('/api/notifications?limit=8'),
          fetch(`/api/products?studentId=${currentUser.id}&status=ALL&limit=8`),
        ]);
        const userItems: DashboardNotification[] = [];

        if (notificationsRes.ok) {
          const data = await notificationsRes.json();
          const userNotifications = Array.isArray(data.data) ? data.data : [];
          userItems.push(
            ...userNotifications.map((notification: any) => ({
              id: notification.id,
              title: notification.title,
              detail: notification.content,
              timestamp: new Date(notification.createdAt).toLocaleString('vi-VN'),
              type:
                notification.type === 'ALARM'
                  ? 'CRITICAL'
                  : notification.type === 'SYSTEM'
                    ? 'INFO'
                    : notification.type === 'TRANSACTION'
                      ? 'INFO'
                    : notification.type === 'CHAT'
                        ? 'INFO'
                        : 'INFO',
              targetPath: notification.link?.startsWith('/products/') ? APP_ROUTES.HOME : notification.link ?? undefined,
              createdAt: new Date(notification.createdAt).toISOString(),
            }))
          );
        }

        if (userProductsRes.ok) {
          const data = await userProductsRes.json();
          const userProducts = Array.isArray(data.data) ? data.data : [];

          const hasSimilarNotification = (productName: string, keywords: string[]) => {
            const loweredName = productName.toLowerCase();
            return userItems.some((item) => {
              const text = `${item.title} ${item.detail}`.toLowerCase();
              return text.includes(loweredName) && keywords.some((keyword) => text.includes(keyword));
            });
          };

          userItems.push(
            ...userProducts
              .filter((product: any) => ['DRAFT', 'AVAILABLE', 'HIDDEN'].includes(product.status))
              .filter((product: any) => {
                if (product.status === 'DRAFT') {
                  return !hasSimilarNotification(product.name, ['gửi', 'chờ duyệt']);
                }
                if (product.status === 'AVAILABLE') {
                  return !hasSimilarNotification(product.name, ['duyệt', 'hiển thị']);
                }
                return !hasSimilarNotification(product.name, ['ẩn', 'chưa được duyệt', 'kiểm tra lại']);
              })
              .map((product: any) => ({
                id: `product-status-${product.id}-${product.status}`,
                title:
                  product.status === 'AVAILABLE'
                    ? 'Bài đăng của bạn đã được duyệt'
                    : product.status === 'HIDDEN'
                      ? 'Bài đăng của bạn chưa được duyệt'
                      : 'Bài đăng đã được gửi',
                detail:
                  product.status === 'AVAILABLE'
                    ? `"${product.name}" đã hiển thị trên hệ thống.`
                    : product.status === 'HIDDEN'
                      ? `"${product.name}" cần kiểm tra lại nội dung trước khi hiển thị.`
                      : `"${product.name}" đang chờ admin duyệt.`,
                timestamp: new Date(product.updatedAt ?? product.createdAt).toLocaleString('vi-VN'),
                type: product.status === 'HIDDEN' ? 'WARNING' : 'INFO',
                targetPath: APP_ROUTES.HOME,
                createdAt: new Date(product.updatedAt ?? product.createdAt).toISOString(),
              }))
          );
        }

        items.push(...userItems);
      } catch {
        // ignore notification fetch errors
      }
    }

    const sortedItems = items
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setNotifications(sortedItems);
    const unreadCount = sortedItems.filter((item) => !readNotificationIds.includes(item.id)).length;
    setNotificationBadge(unreadCount);
  }, [authLoaded, currentUser, pathname, readNotificationIds]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        notificationsOpen &&
        notificationPanelRef.current &&
        !notificationPanelRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNotificationsOpen(false);
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    let cancelled = false;

    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setCurrentUser(data.user || null);
      } catch {
        if (!cancelled) setCurrentUser(null);
      } finally {
        if (!cancelled) setAuthLoaded(true);
      }
    };

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (authLoaded && currentUser) {
      fetchNotifications();
    } else if (authLoaded && !currentUser) {
      setNotifications([]);
      setNotificationBadge(0);
    }
  }, [authLoaded, currentUser, fetchNotifications]);

  useEffect(() => {
    if (authLoaded && currentUser) {
      if (
        currentUser.role === 'STUDENT' &&
        currentUser.status === 'UNVERIFIED' &&
        !(currentUser as any).hasPendingVerification &&
        pathname !== '/verification'
      ) {
        router.replace('/verification');
      }
    }
  }, [authLoaded, currentUser, pathname, router]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const handleToggleCollapse = () => setIsCollapsed((prev) => !prev);
  const showSidebar = authLoaded && Boolean(currentUser);
  const shouldShowFooter = pathname === APP_ROUTES.HOME;
  const loginHref = pathname.startsWith('/admin') ? APP_ROUTES.ADMIN.LOGIN : APP_ROUTES.LOGIN;
  const notificationLabel = useMemo(() => {
    if (!notificationBadge) return 'Thông báo';
    return notificationBadge > 99 ? '99+' : String(notificationBadge);
  }, [notificationBadge]);

  const iconColorClass = theme === 'light'
    ? 'bg-cyan-50 border-cyan-200 text-cyan-600 hover:bg-cyan-100 dark:bg-cyan-500/10 dark:border-cyan-900/40 dark:text-cyan-400 dark:hover:bg-cyan-500/15'
    : 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 dark:bg-amber-500/10 dark:border-amber-900/40 dark:text-amber-400 dark:hover:bg-amber-500/15';

  const openNotifications = () => {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);
    if (nextOpen) {
      fetchNotifications();
      markNotificationsRead(notifications.map((notification) => notification.id));
      setNotificationBadge(0);
    }
  };

  const handleNotificationClick = (notification: DashboardNotification) => {
    markNotificationsRead([notification.id]);
    setNotificationBadge((prev) => Math.max(0, prev - 1));
    setNotificationsOpen(false);

    if (notification.targetPath && notification.targetPath !== pathname) {
      router.push(notification.targetPath);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#18191a] text-zinc-900 dark:text-zinc-100 flex transition-colors duration-300">
      {showSidebar && (
        <div className="hidden lg:block">
          <Sidebar activeItem={activeItemId} isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />
        </div>
      )}

      {showSidebar && isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex animate-fade-in">
          <div onClick={() => setIsMobileOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative flex flex-col w-72 h-full bg-white dark:bg-[#242526] animate-slide-right">
            <div className="absolute top-3.5 right-4 z-50">
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-xl bg-white dark:bg-[#3a3b3c] text-zinc-500 hover:text-zinc-800 dark:hover:text-white border border-[#dfe3ea] dark:border-[#3a3b3c] cursor-pointer transition-all duration-200 active:scale-95 transform-gpu"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <Sidebar activeItem={activeItemId} isCollapsed={false} onCloseMobile={() => setIsMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 border-b border-[#dfe3ea] dark:border-[#3a3b3c] bg-white/85 dark:bg-[#242526]/85 backdrop-blur-md sticky top-0 z-40 shrink-0 flex items-center justify-between px-4 md:px-6 transition-colors duration-300">
          <div className="flex items-center gap-3">
            {showSidebar && (
              <>
                <button
                  onClick={() => setIsMobileOpen(true)}
                  className="lg:hidden p-2 rounded-xl bg-white dark:bg-[#3a3b3c] border border-[#dfe3ea] dark:border-[#3a3b3c] text-zinc-500 hover:bg-zinc-100 dark:hover:bg-[#4e4f50] cursor-pointer transition-all duration-200 active:scale-95 transform-gpu"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <button
                  onClick={handleToggleCollapse}
                  className="hidden lg:flex p-2 rounded-xl bg-white dark:bg-[#3a3b3c] border border-[#dfe3ea] dark:border-[#3a3b3c] text-zinc-500 hover:bg-zinc-100 dark:hover:bg-[#4e4f50] cursor-pointer transition-all duration-200 active:scale-95 transform-gpu"
                  title={isCollapsed ? 'Mở rộng menu' : 'Thu nhỏ menu'}
                >
                  <Menu className="w-4 h-4" />
                </button>
              </>
            )}

            <div className="flex items-center gap-2">
              <h2 className="text-[16px] md:text-[18px] font-bold text-zinc-950 dark:text-white tracking-tight">
                {pageTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {showSidebar ? (
              <>
                {mounted && (
                  <button
                    onClick={toggleTheme}
                    aria-pressed={theme === 'dark'}
                    className={`inline-flex items-center justify-center p-2 rounded-xl border cursor-pointer transition-all duration-200 active:scale-95 transform-gpu ${iconColorClass}`}
                    title={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
                  >
                    {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </button>
                )}

                <div className="relative" ref={notificationPanelRef}>
                  <button
                    onClick={openNotifications}
                    className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/15 cursor-pointer relative transition-all duration-200 active:scale-95 transform-gpu"
                    title="Thông báo"
                  >
                    <Bell className="w-4 h-4" />
                    {notificationBadge > 0 && (
                      <span className="absolute -top-2 -right-2 min-w-[1.35rem] h-[1.35rem] px-1.5 bg-rose-500 text-white text-[10px] font-medium leading-none rounded-full flex items-center justify-center border-2 border-white dark:border-[#242526] shadow-[0_4px_10px_rgba(244,63,94,0.45)]">
                        {notificationLabel}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 top-12 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[#dfe3ea] dark:border-[#3a3b3c] bg-white dark:bg-[#242526] shadow-2xl overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-[#edf0f5] dark:border-[#3a3b3c] flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">Thông báo</p>
                        </div>
                        <Sparkles className="w-4 h-4 text-rose-500" />
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length ? (
                          notifications.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleNotificationClick(item)}
                              className="w-full text-left px-4 py-3 border-b border-[#edf0f5] dark:border-[#3a3b3c] last:border-b-0 hover:bg-[#f5f6f8] dark:hover:bg-[#3a3b3c] transition-colors cursor-pointer"
                            >
                              <div className="flex items-start gap-3">
                                <div className={`mt-0.5 p-2 rounded-xl text-white ${
                                  item.type === 'CRITICAL' ? 'bg-rose-500' : item.type === 'WARNING' ? 'bg-amber-500' : 'bg-sky-600'
                                }`}>
                                  {item.type === 'CRITICAL' ? (
                                    <AlertTriangle className="w-4 h-4" />
                                  ) : item.title.includes('DUYỆT') ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                  ) : item.title.includes('XÁC THỰC') ? (
                                    <ShieldCheck className="w-4 h-4" />
                                  ) : (
                                    <Clock3 className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{item.title}</p>
                                    <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-[0.18em] px-2 py-1 rounded-full ${
                                      item.type === 'CRITICAL'
                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-600/20 dark:text-rose-200'
                                        : item.type === 'WARNING'
                                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-600/15 dark:text-amber-200'
                                          : 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200'
                                    }`}>
                                      {item.type}
                                    </span>
                                  </div>
                                  {item.detail ? (
                                    <p className="mt-2 text-[13px] text-zinc-600 dark:text-zinc-400">{item.detail}</p>
                                  ) : null}
                                  <p className="mt-2 text-[11px] uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-500">
                                    {item.timestamp}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                            Chưa có thông báo mới.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href={loginHref}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-all duration-200 active:scale-95 transform-gpu shadow-md shadow-blue-500/20"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        </header>

        <main ref={mainScrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scroll-smooth">
          <div key={pathname} className="max-w-[1400px] mx-auto animate-page-transition motion-reduce:animate-none">
            {children}
          </div>
          {shouldShowFooter ? (
            <div className="max-w-[1400px] mx-auto pb-4 md:pb-8">
              <DashboardFooter />
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
