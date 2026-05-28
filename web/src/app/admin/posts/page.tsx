'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, PackageCheck, Search, X } from 'lucide-react';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import { useAuthGuard } from '@/lib/hooks/useAuthGuard';
import { APP_ROUTES, PRODUCT_STATUS_CLASSES, PRODUCT_STATUS_LABELS, UserRole } from '@shared';
import { Item } from '@/domain/entities/Item';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from "@/lib/alerts";

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const buildPageNumbers = (current: number, total: number) => {
  const pages: (number | 'ellipsis')[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i += 1) pages.push(i);
    return pages;
  }

  pages.push(1);
  if (current > 3) pages.push('ellipsis');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i += 1) pages.push(i);

  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
};

export default function AdminPostsPage() {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuthGuard(UserRole.ADMIN);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Item[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 8, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'DRAFT' | 'AVAILABLE'>('DRAFT');
  const [selectedPost, setSelectedPost] = useState<Item | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      showSuccessAlert('Thành công!', message);
    } else {
      showErrorAlert('Lỗi!', message);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '8',
        status: activeTab,
      });

      if (search.trim()) {
        params.set('search', search.trim());
      }

      const res = await fetch(`/api/admin/posts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.data || []);
        setPagination(data.pagination || { total: 0, page: 1, limit: 8, totalPages: 0 });
      }
    } catch (error) {
      console.error('Lỗi khi fetch bài đăng:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchPosts();
    }
  }, [currentUser, page, search, activeTab]);

  const handleReview = async (id: string, status: 'AVAILABLE' | 'HIDDEN') => {
    const confirmed = (await showConfirmAlert('Xác nhận', status === 'AVAILABLE'
            ? 'Xác nhận duyệt bài đăng này?'
            : 'Xác nhận từ chối bài đăng này?')).isConfirmed;
    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      if (res.ok) {
        setSelectedPost(null);
        await fetchPosts();
        showFeedback(status === 'AVAILABLE' ? 'Đã duyệt bài đăng' : 'Đã từ chối bài đăng');
      }
    } catch (error) {
      console.error('Lỗi khi duyệt bài đăng:', error);
      showFeedback('Đã có lỗi xảy ra khi xử lý bài đăng.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = (await showConfirmAlert('Xác nhận', 'Bạn có chắc chắn muốn xóa bài đăng này không?')).isConfirmed;
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/posts?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSelectedPost(null);
        await fetchPosts();
        showFeedback('Đã xóa bài đăng thành công');
      } else {
        showFeedback('Lỗi khi xóa bài đăng', 'error');
      }
    } catch (error) {
      console.error('Lỗi khi xóa bài đăng:', error);
      showFeedback('Đã có lỗi xảy ra khi xóa bài đăng.', 'error');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
        <PackageCheck className="w-12 h-12 text-blue-600 animate-pulse mb-4" />
        <span className="text-zinc-500 font-medium text-sm">Đang tải danh sách bài đăng...</span>
      </div>
    );
  }

  const pageNumbers = buildPageNumbers(pagination.page, pagination.totalPages);

  return (
    <DashboardLayout activeItemId="posts" pageTitle="Duyệt Bài Đăng">
      <div className="space-y-3">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/60 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold">Danh sách bài đăng</h3>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên bài..."
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <button
                onClick={() => { setActiveTab('DRAFT'); setPage(1); }}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[9px] ${
                  activeTab === 'DRAFT' 
                  ? 'text-blue-600 border-blue-600' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Chờ duyệt
              </button>
              <button
                onClick={() => { setActiveTab('AVAILABLE'); setPage(1); }}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[9px] ${
                  activeTab === 'AVAILABLE' 
                  ? 'text-blue-600 border-blue-600' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Đã duyệt
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-950 dark:text-zinc-100 tracking-tight">
                  <th className="py-3 px-4">Bài đăng</th>
                  <th className="py-3 px-4">Danh mục</th>
                  <th className="py-3 px-4">Người đăng</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-zinc-100 dark:border-zinc-800/40 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/25 transition-colors cursor-pointer" onClick={() => setSelectedPost(post)}>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                          <img
                            src={post.images[0] || `https://placehold.co/120x120?text=Post`}
                            alt={post.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-zinc-900 dark:text-white truncate">{post.name}</span>
                          <span className="text-[10px] text-zinc-400 mt-0.5">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(post.price)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium text-zinc-500 dark:text-zinc-400">{post.category}</td>
                    <td className="py-4 px-4 font-medium text-zinc-900 dark:text-zinc-100">{post.sellerName || post.studentId}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium uppercase ${PRODUCT_STATUS_CLASSES[post.status]}`}>
                        {PRODUCT_STATUS_LABELS[post.status]}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {activeTab === 'DRAFT' ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReview(post.id, 'AVAILABLE');
                            }}
                            className="h-9 w-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center transition-colors"
                            aria-label="Duyệt"
                            title="Duyệt"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReview(post.id, 'HIDDEN');
                            }}
                            className="h-9 w-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 flex items-center justify-center transition-colors"
                            aria-label="Từ chối"
                            title="Từ chối"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(post.id);
                            }}
                            className="h-9 w-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 flex items-center justify-center transition-colors"
                            aria-label="Xóa bài đăng"
                            title="Xóa bài đăng"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {posts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-zinc-400">
                      Không có bài đăng nào trong mục này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-1 md:gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className={`w-10 h-10 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-150 dark:hover:bg-zinc-900 transition-all text-zinc-500 dark:text-zinc-400 ${page === 1 ? 'pointer-events-none opacity-40' : ''}`}
                aria-label="Trang trước"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {pageNumbers.map((item, index) => {
                if (item === 'ellipsis') {
                  return (
                    <span key={`ellipsis-${index}`} className="w-10 h-10 flex items-center justify-center text-zinc-400 font-medium">
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={item}
                    onClick={() => setPage(item as number)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl font-semibold text-sm transition-all ${
                      page === item
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 border-transparent'
                        : 'border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}

              <button
                onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                className={`w-10 h-10 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-150 dark:hover:bg-zinc-900 transition-all text-zinc-500 dark:text-zinc-400 ${page === pagination.totalPages ? 'pointer-events-none opacity-40' : ''}`}
                aria-label="Trang sau"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* REVIEW MODAL POPUP */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 py-6 bg-black/60 backdrop-blur-sm">
          <div className="relative bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="relative h-64 md:h-80 w-full bg-zinc-100 dark:bg-zinc-800">
              <img
                src={selectedPost.images[0] || `https://placehold.co/1200x800?text=Post`}
                alt={selectedPost.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium px-3 py-1.5 rounded-full">
                  {selectedPost.category}
                </span>
                <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${PRODUCT_STATUS_CLASSES[selectedPost.status]}`}>
                  {PRODUCT_STATUS_LABELS[selectedPost.status]}
                </span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-zinc-950 dark:text-white mb-2 leading-snug">{selectedPost.name}</h2>
              <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mb-4">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedPost.price)}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Người đăng: {selectedPost.sellerName || selectedPost.studentId}</p>
              <hr className="border-zinc-200 dark:border-zinc-800 my-4" />
              <div className="mb-6">
                <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2 tracking-tight">Mô tả chi tiết</h4>
                <p className="text-zinc-600 dark:text-zinc-300 text-sm whitespace-pre-line leading-relaxed">
                  {selectedPost.description || 'Bài đăng này chưa có mô tả chi tiết.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {activeTab === 'DRAFT' ? (
                  <>
                    <button
                      onClick={() => handleReview(selectedPost.id, 'HIDDEN')}
                      className="py-3 border border-rose-500/20 hover:bg-rose-500/5 text-rose-500 text-xs font-semibold rounded-2xl cursor-pointer transition-colors"
                    >
                      Từ chối
                    </button>
                    <button
                      onClick={() => handleReview(selectedPost.id, 'AVAILABLE')}
                      className="py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-2xl cursor-pointer transition-colors shadow-md shadow-blue-500/10"
                    >
                      Duyệt bài
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleDelete(selectedPost.id)}
                    className="col-span-2 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-2xl cursor-pointer transition-colors shadow-md shadow-rose-500/10"
                  >
                    Xóa bài đăng
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
