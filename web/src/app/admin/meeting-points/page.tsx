'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Camera,
  Map,
  MapPin,
  Plus, Pencil, Trash2, Eye,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import { useAuthGuard } from '@/lib/hooks/useAuthGuard';
import { APP_ROUTES, UserRole } from '@shared';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from "@/lib/alerts";

type MeetingPoint = {
  id: string;
  name: string;
  description?: string | null;
  photoUrl?: string | null;
  isSafeZone: boolean;
  campusId: string;
  campusName: string;
  campusAddress?: string | null;
  universityName: string;
};

type CampusOption = {
  id: string;
  name: string;
  address?: string | null;
  universityId: string;
  universityName: string;
};

const INITIAL_FORM = {
  name: '',
  campusId: '',
  description: '',
  photoUrl: '',
  isSafeZone: true,
};

export default function AdminMeetingPointsPage() {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuthGuard(UserRole.ADMIN);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCampus, setFilterCampus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingPoint, setViewingPoint] = useState<MeetingPoint | null>(null);
  const [points, setPoints] = useState<MeetingPoint[]>([]);
  const [campuses, setCampuses] = useState<CampusOption[]>([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [universities, setUniversities] = useState<{ id: string; name: string }[]>([]);
  const [showCampusModal, setShowCampusModal] = useState(false);
  const [campusForm, setCampusForm] = useState({ name: '', address: '', universityName: '' });
  const [creatingCampus, setCreatingCampus] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {

                if (type === 'success') {
                  showSuccessAlert('Thành công!', message);
                } else {
                  showErrorAlert('Lỗi!', message);
                }
              
  };

  const fetchMeetingPoints = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/meeting-points');
      if (!res.ok) {
        throw new Error('Fetch failed');
      }

      const data = await res.json();
      const nextPoints = Array.isArray(data.data) ? data.data : [];
      const nextCampuses = Array.isArray(data.campuses) ? data.campuses : [];
      const nextUniversities = Array.isArray(data.universities) ? data.universities : [];

      setPoints(nextPoints);
      setCampuses(nextCampuses);
      setUniversities(nextUniversities);
      setForm((prev) => ({
        ...prev,
        campusId: prev.campusId || nextCampuses[0]?.id || '',
      }));
    } catch (error) {
      console.error('Lỗi khi tải điểm hẹn giao dịch:', error);
      showFeedback('Không tải được danh sách điểm hẹn.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchMeetingPoints();
    }
  }, [currentUser]);

  const filteredPoints = useMemo(() => {
    let result = points;
    
    if (filterCampus !== 'all') {
      result = result.filter(p => p.campusId === filterCampus);
    }
    
    const keyword = search.trim().toLowerCase();
    if (keyword) {
      result = result.filter((point) => {
        const haystack = `${point.name} ${point.campusName} ${point.universityName} ${point.description ?? ''}`.toLowerCase();
        return haystack.includes(keyword);
      });
    }

    return result;
  }, [points, search, filterCampus]);

  const safeCount = points.filter((point) => point.isSafeZone).length;


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      
      setForm(prev => ({ ...prev, photoUrl: data.url || '' }));
      showFeedback('Tải ảnh lên thành công!');
    } catch (err) {
      console.error(err);
      showFeedback('Không thể tải ảnh lên.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCreateCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campusForm.name.trim() || !campusForm.universityName.trim()) {
      showFeedback('Tên Campus và Trường Đại học là bắt buộc.', 'error');
      return;
    }
    try {
      setCreatingCampus(true);
      const res = await fetch('/api/admin/campuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campusForm),
      });
      if (!res.ok) throw new Error('Create campus failed');
      const newCampus = await res.json();
      
      showFeedback('Đã tạo Campus thành công.');
      setShowCampusModal(false);
      setCampusForm({ name: '', address: '', universityName: '' });
      
      // Refresh list & set selected
      await fetchMeetingPoints();
      setForm(prev => ({ ...prev, campusId: newCampus.id }));
    } catch (err) {
      console.error(err);
      showFeedback('Không tạo được Campus.', 'error');
    } finally {
      setCreatingCampus(false);
    }
  };

    const handleEdit = (point: MeetingPoint) => {
    setEditingId(point.id);
    setForm({
      name: point.name,
      campusId: point.campusId,
      description: point.description || '',
      photoUrl: point.photoUrl || '',
      isSafeZone: point.isSafeZone,
    });
    setViewMode('form');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa điểm hẹn này?')) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/meeting-points/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      showFeedback('Đã xóa điểm hẹn.');
      await fetchMeetingPoints();
    } catch (err) {
      console.error(err);
      showFeedback('Không thể xóa điểm hẹn.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.campusId) {
      showFeedback('Tên điểm hẹn và campus là bắt buộc.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const url = editingId ? `/api/admin/meeting-points/${editingId}` : '/api/admin/meeting-points';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          campusId: form.campusId,
          description: form.description,
          photoUrl: form.photoUrl,
          isSafeZone: form.isSafeZone,
        }),
      });

      if (!res.ok) {
        throw new Error('Create failed');
      }

      setForm({
        ...INITIAL_FORM,
        campusId: campuses[0]?.id || '',
      });
      await fetchMeetingPoints();
      showFeedback(editingId ? 'Đã cập nhật điểm hẹn.' : 'Đã tạo điểm hẹn giao dịch mới.');
      setEditingId(null);
      setViewMode('list');
    } catch (error) {
      console.error('Lỗi khi tạo điểm hẹn:', error);
      showFeedback('Không tạo được điểm hẹn.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
        <Map className="mb-4 h-12 w-12 animate-pulse text-blue-600" />
        <span className="text-sm font-medium text-zinc-500">Đang tải điểm hẹn giao dịch...</span>
      </div>
    );
  }

  return (
    <DashboardLayout activeItemId="meeting-points" pageTitle="Điểm hẹn giao dịch">
      <div className="space-y-3">
        

        <div className="flex items-center justify-end gap-4">

          <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800">
            <Sparkles className="h-3 w-3 text-emerald-500" />
            <span>{points.length} điểm hẹn</span>
          </div>
        </div>

        <div>
          {viewMode === 'form' ? (
          <section className="mx-auto max-w-2xl w-full rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-950 dark:text-white">{editingId ? 'Cập nhật điểm hẹn' : 'Tạo điểm hẹn mới'}</h2>
                </div>
              </div>
              <button 
                onClick={() => { setViewMode('list'); setEditingId(null); setForm({...INITIAL_FORM, campusId: campuses[0]?.id || ''}); }}
                className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors px-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Quay lại
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tên điểm hẹn</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ví dụ: Sảnh thư viện tầng 1"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-blue-400"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Campus</label>
                  <button type="button" onClick={() => setShowCampusModal(true)} className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Tạo mới
                  </button>
                </div>
                <select
                  value={form.campusId}
                  onChange={(e) => setForm((prev) => ({ ...prev, campusId: e.target.value }))}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-blue-400"
                >
                  <option value="">Chọn campus</option>
                  {campuses.map((campus) => (
                    <option key={campus.id} value={campus.id}>
                      {campus.universityName} - {campus.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả ngắn về vị trí, cách tìm, bảo vệ hoặc camera."
                  rows={4}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-blue-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Vị trí</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="flex-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-blue-400 file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-500/10 dark:file:text-blue-400"
                  />
                  {uploadingPhoto && <span className="text-xs font-medium text-blue-500 flex-shrink-0 animate-pulse">Đang tải lên...</span>}
                </div>
                {form.photoUrl && (
                  <div className="relative mt-2 h-24 w-24 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <img src={form.photoUrl} alt="Preview" className="h-full w-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, photoUrl: '' }))}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <input
                  type="checkbox"
                  checked={form.isSafeZone}
                  onChange={(e) => setForm((prev) => ({ ...prev, isSafeZone: e.target.checked }))}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Đánh dấu là điểm an toàn</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Ưu tiên các khu có camera, bảo vệ hoặc đông người qua lại.</div>
                </div>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {submitting ? (editingId ? 'Đang cập nhật...' : 'Đang tạo...') : (editingId ? 'Lưu thay đổi' : 'Tạo điểm hẹn')}
              </button>
            </form>
          </section>
          ) : (
          <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-2/3">
                <div className="relative w-full md:flex-1">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Tìm điểm hẹn..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-blue-400"
                  />
                </div>

                <select
                  value={filterCampus}
                  onChange={(e) => setFilterCampus(e.target.value)}
                  className="w-full md:w-96 lg:w-[400px] rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-blue-400"
                >
                  <option value="all">Tất cả Campus</option>
                  {campuses.map(c => (
                    <option key={c.id} value={c.id}>{c.universityName} - {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end w-full lg:w-auto">
                <button
                  onClick={() => setViewMode('form')}
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 shadow-sm"
                >
                  <Plus className="h-5 w-5" />
                  <span>Thêm điểm hẹn</span>
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {filteredPoints.map((point) => (
                <article
                  key={point.id}
                  className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-zinc-50/70 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/30"
                >
                  <div className="relative h-40 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-700">
                    {point.photoUrl ? (
                      <img src={point.photoUrl} alt={point.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <MapPin className="h-12 w-12 text-white/90" />
                      </div>
                    )}
                    <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-medium text-zinc-900">
                      {point.isSafeZone ? 'An toàn' : 'Công khai'}
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <div className="text-[11px] font-semibold text-zinc-400">{point.universityName}</div>
                      <h3 className="mt-1 text-base font-medium text-zinc-950 dark:text-white">{point.name}</h3>
                      <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{point.campusName}</div>
                    </div>

                    <div className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                      {point.description || 'Chưa có mô tả cho điểm hẹn này.'}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                        {point.isSafeZone ? 'Ưu tiên an toàn' : 'Điểm công khai'}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Camera className="h-3.5 w-3.5 text-blue-500" />
                        {point.photoUrl ? 'Có ảnh' : 'Chưa có ảnh'}
                      </span>
                    </div>

                    {point.campusAddress ? (
                      <div className="rounded-2xl bg-white px-4 py-3 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                        {point.campusAddress}
                      </div>
                    ) : null}

                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
                      <button
                        onClick={() => setViewingPoint(point)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors dark:text-emerald-400 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20"
                      >
                        <Eye className="w-3.5 h-3.5" /> Xem
                      </button>
                      <button
                        onClick={() => handleEdit(point)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors dark:text-blue-400 dark:bg-blue-500/10 dark:hover:bg-blue-500/20"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(point.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors dark:text-rose-400 dark:bg-rose-500/10 dark:hover:bg-rose-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xóa
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {filteredPoints.length === 0 && (
                <div className="col-span-full rounded-3xl border border-dashed border-zinc-200 py-16 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  Chưa có điểm hẹn nào phù hợp.
                </div>
              )}
            </div>
          </section>
          )}
        </div>
      </div>

      {/* Campus Modal */}
      {showCampusModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Tạo Campus mới</h3>
              <button
                onClick={() => setShowCampusModal(false)}
                className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCampus} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Trường Đại học</label>
                <input
                  type="text"
                  list="universities-list"
                  value={campusForm.universityName}
                  onChange={(e) => setCampusForm((prev) => ({ ...prev, universityName: e.target.value }))}
                  placeholder="Chọn hoặc gõ tên trường mới..."
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-blue-400"
                />
                <datalist id="universities-list">
                  {universities.map((u) => (
                    <option key={u.id} value={u.name} />
                  ))}
                </datalist>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tên Campus</label>
                <input
                  value={campusForm.name}
                  onChange={(e) => setCampusForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ví dụ: Cơ sở 2, Dĩ An"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-blue-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Địa chỉ (tùy chọn)</label>
                <input
                  value={campusForm.address}
                  onChange={(e) => setCampusForm((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Địa chỉ cụ thể"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-blue-400"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={creatingCampus}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingCampus ? 'Đang lưu...' : 'Lưu Campus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    
      {/* View Detail Modal */}
      {viewingPoint && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 animate-fade-in backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8">
            <button
              onClick={() => setViewingPoint(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/20 p-2 text-white hover:bg-black/40 backdrop-blur-md transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="relative h-64 md:h-80 w-full bg-zinc-100 dark:bg-zinc-800">
              {viewingPoint.photoUrl ? (
                <img src={viewingPoint.photoUrl} alt={viewingPoint.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-zinc-400">
                  <MapPin className="mb-2 h-16 w-16 opacity-50" />
                  <span className="text-sm font-medium">Chưa có ảnh mô tả</span>
                </div>
              )}
              <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold text-zinc-900 shadow-sm">
                {viewingPoint.isSafeZone ? '✓ Ưu tiên an toàn' : 'Điểm công khai'}
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                    {viewingPoint.universityName}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-zinc-950 dark:text-white">{viewingPoint.name}</h2>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-zinc-100 p-2 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Campus</div>
                      <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{viewingPoint.campusName}</div>
                      {viewingPoint.campusAddress && (
                        <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{viewingPoint.campusAddress}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Trạng thái an toàn</div>
                      <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {viewingPoint.isSafeZone ? 'Khuyến nghị an toàn' : 'Khu vực tự quản'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5 dark:border-zinc-800/50 dark:bg-zinc-900/50">
                <h3 className="mb-2 text-sm font-bold text-zinc-900 dark:text-white">Mô tả chi tiết</h3>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
                  {viewingPoint.description || 'Chưa có mô tả chi tiết cho điểm hẹn này.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
