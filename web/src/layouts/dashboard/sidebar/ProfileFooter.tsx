'use client';

import React from 'react';
import Link from 'next/link';
import { LogOut, User } from 'lucide-react';
import { UserRole } from '@shared';

interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  avatarUrl?: string | null;
}

interface ProfileFooterProps {
  currentUser: UserSession | null;
  isCollapsed: boolean;
  onLogout: () => void;
}

export default function ProfileFooter({ currentUser, isCollapsed, onLogout }: ProfileFooterProps) {
  if (currentUser) {
    return (
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-50/50 dark:bg-[#101419]/40">
        <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'justify-between'} gap-2.5`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-2.5 min-w-0'}`}>
            <div className={`w-7 h-7 rounded-full overflow-hidden shadow-sm border flex items-center justify-center font-black text-xs shrink-0 select-none ${currentUser.role === 'ADMIN' ? 'border-red-200 dark:border-red-900/40 bg-red-600 text-white' : 'border-zinc-200 dark:border-zinc-800 bg-blue-600 text-white'}`}>
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.fullName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : currentUser.role === 'ADMIN' ? (
                <span>AD</span>
              ) : (
                <span>{currentUser.fullName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 animate-fade-in">
                <div className="flex flex-col">
                  <span className="text-[11px] leading-tight font-medium text-zinc-900 dark:text-white break-words">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[9.5px] leading-tight text-zinc-500 dark:text-zinc-400 mt-0.5 break-all">
                    {currentUser.email}
                  </span>
                  {currentUser.role && (
                    <span className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${
                      currentUser.role === 'ADMIN' 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {currentUser.role === 'ADMIN' ? 'ADMIN' : 'USER'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={onLogout}
              title="Đăng xuất"
              className="p-2 rounded-xl hover:bg-zinc-200/60 dark:hover:bg-zinc-800 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-200 active:scale-95 transform-gpu cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-50/50 dark:bg-[#101419]/40">
      <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-2.5'}`}>
        <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 shrink-0">
          <User className="w-4.5 h-4.5" />
        </div>
        {!isCollapsed && (
          <div className="flex-1 animate-fade-in">
            <Link href="/login" className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline block truncate">
              Đăng nhập Google
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
