'use client';

import React from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

interface RoleSwitcherProps {
  activeRole: 'STUDENT' | 'ADMIN';
  onRoleChange: (role: 'STUDENT' | 'ADMIN') => void;
}

export default function RoleSwitcher({ activeRole, onRoleChange }: RoleSwitcherProps) {
  return (
    <div className="px-4 py-3 mx-3 mb-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 shrink-0">
      <div className="flex items-center gap-1.5 mb-2 text-amber-600 dark:text-amber-400">
        <Sparkles className="w-3.5 h-3.5" />
        <span className="text-[10px] font-black uppercase tracking-wider">Demo Screen Preview</span>
      </div>
      <div className="relative">
        <select
          value={activeRole}
          onChange={(e) => onRoleChange(e.target.value as 'STUDENT' | 'ADMIN')}
          className="w-full appearance-none rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 pr-9 text-[11px] font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-200 outline-none transition focus:border-blue-500"
        >
          <option value="STUDENT">User</option>
          <option value="ADMIN">Admin</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      </div>
    </div>
  );
}
