'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ShieldAlert, AlertTriangle, ArrowLeft, Sparkles, Clock3, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import { useAuthGuard } from '@/lib/hooks/useAuthGuard';
import { UserRole, APP_ROUTES } from '@shared';
import type { SecurityLogItem } from '@/lib/adminInsights';

export default function SecurityLogsPage() {
  const router = useRouter();
  const { currentUser, loading } = useAuthGuard(UserRole.ADMIN);
  const [activityLogs, setActivityLogs] = useState<SecurityLogItem[]>([]);
  const [summary, setSummary] = useState({ critical: 0, warning: 0, info: 0 });
  const [pageLoading, setPageLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setPageLoading(true);
        const res = await fetch('/api/admin/logs?limit=20');
        if (res.ok) {
          const data = await res.json();
          setActivityLogs(data.logs || []);
          setSummary(data.summary || { critical: 0, warning: 0, info: 0 });
        }
      } catch (error) {
        console.error('Lỗi khi fetch lịch sử hoạt động & lưu ý:', error);
      } finally {
        setPageLoading(false);
      }
    };

    if (currentUser) {
      fetchLogs();
    }
  }, [currentUser]);

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
        <Activity className="w-12 h-12 text-rose-600 animate-pulse mb-4" />
        <span className="text-zinc-500 font-medium text-sm">Đang tải lịch sử hoạt động & lưu ý hệ thống...</span>
      </div>
    );
  }

  return (
    <DashboardLayout activeItemId="audit-logs" pageTitle="Lịch sử hoạt động & lưu ý">
      <div className="space-y-3">


        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/60 p-6 sm:p-8 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-semibold">Lịch Sử Hoạt Động & Lưu Ý Hệ Thống</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveFilter(activeFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
                  activeFilter === 'CRITICAL' || activeFilter === 'ALL'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 opacity-50'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                {summary.critical} nghiêm trọng
              </button>
              <button
                onClick={() => setActiveFilter(activeFilter === 'WARNING' ? 'ALL' : 'WARNING')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
                  activeFilter === 'WARNING' || activeFilter === 'ALL'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 opacity-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {summary.warning} cảnh báo
              </button>
              <button
                onClick={() => setActiveFilter(activeFilter === 'INFO' ? 'ALL' : 'INFO')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
                  activeFilter === 'INFO' || activeFilter === 'ALL'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 opacity-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {summary.info} thông tin
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {activityLogs
              .filter((log) => activeFilter === 'ALL' || log.type === activeFilter)
              .map((log) => (
              <div
                key={log.id}
                className={`p-5 rounded-2xl border flex items-start gap-4 transition-colors ${
                  log.type === 'CRITICAL'
                    ? 'bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400'
                    : log.type === 'WARNING'
                      ? 'bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-zinc-50 dark:bg-zinc-800/35 border-zinc-200 dark:border-zinc-800/50 text-zinc-800 dark:text-zinc-300'
                }`}
              >
                <div
                  className={`p-2 rounded-xl text-white ${
                    log.type === 'CRITICAL'
                      ? 'bg-rose-500'
                      : log.type === 'WARNING'
                        ? 'bg-amber-500'
                        : 'bg-blue-600'
                  }`}
                >
                  {log.type === 'CRITICAL' ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : log.type === 'WARNING' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Activity className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-zinc-950 dark:text-zinc-100 tracking-tight">{log.action}</span>
                      <span className="text-[10px] text-zinc-400 font-medium">{log.userEmail}</span>
                    </div>
                    <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">{log.details}</p>
                  </div>

                  <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap inline-flex items-center gap-1">
                    <Clock3 className="w-3 h-3" />
                    {log.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
