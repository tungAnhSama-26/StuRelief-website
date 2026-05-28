'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { HeartHandshake, ChevronLeft } from 'lucide-react';
import { getMenuGroups } from './sidebar/menuConfig';
import ProfileFooter from './sidebar/ProfileFooter';
import { UserRole } from '@shared';

interface SidebarProps {
  activeItem?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  activeItem,
  isCollapsed = false,
  onToggleCollapse,
  onCloseMobile,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; role: UserRole; fullName: string; avatarUrl?: string | null; status?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user status on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
          }
        }
      } catch (err) {
        console.error('Lỗi khi lấy thông tin người dùng trong Sidebar:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const activeRole = currentUser?.role || UserRole.STUDENT;

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        sessionStorage.removeItem('sturelief_user');
        router.push('/');
        window.location.reload();
      }
    } catch (err) {
      console.error('Lỗi khi đăng xuất:', err);
    }
  };

  const menuItems = getMenuGroups(activeRole, currentUser?.status).flatMap((group) => group.items);

  return (
    <aside
      className={`h-screen flex flex-col justify-between border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#12161b] text-zinc-800 dark:text-zinc-200 transition-all duration-300 z-50 sticky top-0 ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      <div className={`p-4 flex items-center border-b border-zinc-200 dark:border-zinc-800 h-16 shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <Link href="/" className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} overflow-hidden select-none`}>
          <div className="w-9 h-9 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <HeartHandshake className="w-5.5 h-5.5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-fade-in">
              <span className="font-black text-sm tracking-wider uppercase text-zinc-950 dark:text-white leading-none">
                StuRelief
              </span>
            </div>
          )}
        </Link>

        {onToggleCollapse && !isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hidden lg:block cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
        {menuItems.map((item) => {
          const isItemActive = activeItem === item.id || pathname === item.path;
          const IconComponent = item.icon;

          return (
            <Link
              key={item.id}
              href={item.path}
              onClick={onCloseMobile}
              title={isCollapsed ? item.label : undefined}
              aria-label={item.label}
              className={`flex items-center transition-all duration-200 group relative rounded-xl transform-gpu active:scale-95 ${
                isCollapsed ? 'justify-center mx-auto w-12 h-12 p-0 rounded-2xl' : 'gap-3.5 px-3 py-2.5 w-full'
              } ${
                isItemActive
                  ? `bg-blue-600 text-white shadow-md shadow-blue-500/10 ${isCollapsed ? '' : 'scale-102'}`
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              <IconComponent
                className={`w-5 h-5 shrink-0 ${
                  isItemActive
                    ? 'text-white'
                    : 'text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors'
                }`}
              />
              {!isCollapsed && (
                <div className="flex flex-col min-w-0 animate-fade-in">
                  <span className="text-[13px] font-medium truncate leading-snug">
                    {item.label}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      <ProfileFooter
        currentUser={currentUser}
        isCollapsed={isCollapsed}
        onLogout={handleLogout}
      />
    </aside>
  );
}
