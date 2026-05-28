'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Compass,
  MapPin,
  Navigation2,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import { useAuthGuard } from '@/lib/hooks/useAuthGuard';
import { APP_ROUTES } from '@shared';

type MeetingPoint = {
  id: string;
  name: string;
  description?: string | null;
  photoUrl?: string | null;
  isSafeZone: boolean;
  campusName: string;
  campusAddress?: string | null;
  universityName: string;
};

type MeetingPointMeta = {
  scope: 'campus' | 'university' | 'all';
  campusName: string | null;
  universityName: string | null;
  totalPoints: number;
  safePoints: number;
  campusCount: number;
};

const SELECTED_POINT_KEY = 'sturelief.selectedMeetingPoint';

export default function MeetingPointsPage() {
  const router = useRouter();
  const { loading } = useAuthGuard();
  const [points, setPoints] = useState<MeetingPoint[]>([]);
  const [meta, setMeta] = useState<MeetingPointMeta | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [onlySafe, setOnlySafe] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        setPageLoading(true);
        const res = await fetch('/api/meeting-points');
        if (!res.ok) return;
        const data = await res.json();
        setPoints(Array.isArray(data.data) ? data.data : []);
        setMeta(data.meta ?? null);
      } catch (error) {
        console.error('Lỗi khi tải điểm hẹn giao dịch:', error);
      } finally {
        setPageLoading(false);
      }
    };

    fetchPoints();
  }, []);

  useEffect(() => {
    const savedId = window.localStorage.getItem(SELECTED_POINT_KEY);
    if (savedId) {
      setSelectedPointId(savedId);
    }
  }, []);

  const selectedPoint = useMemo(
    () => points.find((point) => point.id === selectedPointId) || points[0] || null,
    [points, selectedPointId]
  );

  useEffect(() => {
    if (!selectedPoint && points.length > 0) {
      setSelectedPointId(points[0].id);
      window.localStorage.setItem(SELECTED_POINT_KEY, points[0].id);
    }
  }, [points, selectedPoint]);

  const filteredPoints = useMemo(() => {
    return points.filter((point) => {
      if (onlySafe && !point.isSafeZone) return false;
      const haystack = `${point.name} ${point.campusName} ${point.universityName} ${point.description ?? ''}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [onlySafe, points, search]);

  const openMap = (point: MeetingPoint) => {
    const query = encodeURIComponent(`${point.name}, ${point.campusName}, ${point.universityName}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer');
  };

  const choosePoint = (point: MeetingPoint) => {
    setSelectedPointId(point.id);
    window.localStorage.setItem(SELECTED_POINT_KEY, point.id);
  };

  const scopeLabel =
    meta?.scope === 'campus'
      ? meta.campusName || 'Campus của bạn'
      : meta?.scope === 'university'
        ? meta.universityName || 'Trường của bạn'
        : 'Toàn hệ thống';

  if (loading || pageLoading) {
    return (
      <DashboardLayout activeItemId="meeting-points" pageTitle="Điểm hẹn giao dịch">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Route className="h-12 w-12 animate-pulse text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeItemId="meeting-points" pageTitle="Điểm hẹn giao dịch">
      <div className="mx-auto max-w-6xl space-y-6 px-2 md:px-0">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => router.push(APP_ROUTES.HOME)}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-950 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại chợ đồ cũ</span>
          </button>
          <div className="rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {scopeLabel}
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Lịch sử giao dịch</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Các điểm hẹn giao dịch bạn từng sử dụng.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm điểm hẹn..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:border-blue-400"
              />
            </div>
            <button
              type="button"
              onClick={() => setOnlySafe((prev) => !prev)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                onlySafe
                  ? 'bg-blue-600 text-white'
                  : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Chỉ điểm an toàn
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPoints.map((point) => (
            <article
              key={point.id}
              className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition-all dark:bg-zinc-900 ${
                selectedPoint?.id === point.id
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-zinc-200/80 hover:-translate-y-1 hover:shadow-md dark:border-zinc-800/60'
              }`}
            >
              <div className="relative h-40 bg-zinc-100 dark:bg-zinc-800">
                {point.photoUrl ? (
                  <img src={point.photoUrl} alt={point.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-600">
                    <MapPin className="h-10 w-10 text-white/80" />
                  </div>
                )}
                <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold text-zinc-900 shadow-sm uppercase tracking-wide">
                  {point.isSafeZone ? '🟢 Khu an toàn' : '⚪ Khu công khai'}
                </div>
              </div>

              <div className="flex flex-col p-5 h-[calc(100%-10rem)] justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">{point.universityName}</div>
                  <h3 className="mt-1 text-base font-bold text-zinc-950 dark:text-white line-clamp-1">{point.name}</h3>
                  <div className="mt-1 flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
                    <Navigation2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-1">{point.campusName}</span>
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 line-clamp-2">
                    {point.description || 'Điểm hẹn công khai, dễ tìm và thuận tiện cho giao dịch.'}
                  </p>
                </div>

                <div className="mt-6 flex gap-2">
                  <button
                    type="button"
                    onClick={() => choosePoint(point)}
                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                      selectedPoint?.id === point.id 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 cursor-default' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {selectedPoint?.id === point.id ? 'Đang chọn' : 'Chọn điểm này'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openMap(point)}
                    className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-4 py-2.5 text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    title="Mở Google Maps"
                  >
                    <Route className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
          
          {filteredPoints.length === 0 && (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 rounded-3xl border border-dashed border-zinc-200 bg-white py-16 text-center text-sm font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <Compass className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
              Chưa thấy địa điểm từng giao dịch trước đó.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
