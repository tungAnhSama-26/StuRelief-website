'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, 
  Search, 
  X, 
  Eye, 
  ArrowLeft,
  Camera,
  Sparkles,
  Scale
} from 'lucide-react';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import { useAuthGuard } from '@/lib/hooks/useAuthGuard';
import { UserRole, APP_ROUTES } from '@shared';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from "@/lib/alerts";

interface ProductSnapshot {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  specs: {
    cpu?: string;
    ram?: string;
    storage?: string;
    condition: string;
  };
  image: string;
  version?: number;
  updatedAt: string;
}

interface DisputeCase {
  id: string;
  orderId: string;
  buyerName: string;
  buyerEmail?: string;
  sellerName: string;
  sellerEmail?: string;
  productName: string;
  reason: string;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED';
  evidenceImage: string;
  evidenceDescription?: string;
  currentSnapshot: ProductSnapshot;
  disputeSnapshot: ProductSnapshot | null;
  date?: string;
}

export default function DisputesPage() {
  const router = useRouter();
  const { currentUser, loading } = useAuthGuard(UserRole.ADMIN);
  const [disputes, setDisputes] = useState<DisputeCase[]>([]);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [disputeSearch, setDisputeSearch] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<DisputeCase | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      showSuccessAlert('Thành công!', message);
    } else {
      showErrorAlert('Lỗi!', message);
    }
  };

  // Fetch disputes from API on mount
  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        const res = await fetch('/api/admin/disputes');
        if (res.ok) {
          const data = await res.json();
          setDisputes(data);
        }
      } catch (err) {
        console.error('Lỗi khi lấy danh sách tranh chấp:', err);
      }
    };
    if (!loading && currentUser) {
      fetchDisputes();
    }
  }, [loading, currentUser]);

  // Handle Dispute Resolution via PUT API
  const handleResolveDispute = async (id: string, action: 'RESOLVED' | 'INVESTIGATING') => {
    const confirmed = (await showConfirmAlert('Xác nhận', action === 'RESOLVED'
            ? 'Xác nhận xử lý và chốt tranh chấp này?'
            : 'Xác nhận chuyển tranh chấp sang trạng thái điều tra?')).isConfirmed;
    if (!confirmed) return;

    try {
      setRefreshLoading(true);
      const res = await fetch(`/api/admin/disputes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      if (res.ok) {
        // Refresh the list
        const freshRes = await fetch('/api/admin/disputes');
        if (freshRes.ok) {
          const data = await freshRes.json();
          setDisputes(data);
        }
        setSelectedDispute(null);
        showFeedback(action === 'RESOLVED' ? 'Xử lý vấn đề thành công!' : 'Đã chuyển sang trạng thái điều tra.');
      }
    } catch (err) {
      console.error('Failed to resolve dispute:', err);
      showFeedback('Đã có lỗi xảy ra khi xử lý vấn đề.', 'error');
    } finally {
      setRefreshLoading(false);
    }
  };

  const filteredDisputes = disputes.filter(d => 
    d.buyerName.toLowerCase().includes(disputeSearch.toLowerCase()) ||
    d.productName.toLowerCase().includes(disputeSearch.toLowerCase()) ||
    d.id.includes(disputeSearch)
  );

  if (loading || refreshLoading) {
    return (
      <DashboardLayout activeItemId="disputes" pageTitle="Xử Lý Vấn Đề & Đối Soát">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center animate-pulse">
            <Scale className="w-6 h-6 animate-spin-slow" />
          </div>
          <span className="text-zinc-500 font-medium text-sm">
            {refreshLoading ? 'Đang thực thi biện pháp xử lý vấn đề...' : 'Đang tải phân hệ xử lý vấn đề...'}
          </span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeItemId="disputes" pageTitle="Xử Lý Vấn Đề & Đối Soát">
      <div className="space-y-3">
        {/* Content Box */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/60 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-base font-semibold">Đối soát & Xử lý Vấn đề</h3>
            </div>
            
            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
              <input
                type="text"
                placeholder="Tìm mã dsp, người mua..."
                value={disputeSearch}
                onChange={(e) => setDisputeSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Disputes list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDisputes.map((caseItem) => (
              <div key={caseItem.id} className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300 bg-zinc-50/50 dark:bg-zinc-900/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium bg-rose-500 text-white px-2 py-0.5 rounded uppercase">{caseItem.id}</span>
                    <span className="text-xs text-zinc-400 font-medium">Đơn hàng: {caseItem.orderId}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                    caseItem.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    caseItem.status === 'INVESTIGATING' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' :
                    'bg-rose-500/10 text-rose-500'
                  }`}>
                    {caseItem.status === 'RESOLVED' ? 'Đã phân xử' :
                     caseItem.status === 'INVESTIGATING' ? 'Đang điều tra' : 'Mới tiếp nhận'}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">{caseItem.productName}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                  <strong>Lý do khiếu nại:</strong> {caseItem.reason}
                </p>

                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/60 pt-4">
                  <div className="flex flex-col text-[10px] font-medium text-zinc-400 uppercase">
                    <span>Người tố cáo: {caseItem.buyerName}</span>
                    <span className="mt-0.5">Người bị tố: {caseItem.sellerName}</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      setSelectedDispute(caseItem);
                    }}
                    className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 font-medium text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Xem chi tiết</span>
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {filteredDisputes.length === 0 && (
              <div className="col-span-2 py-12 text-center text-xs text-zinc-400">
                Không tìm thấy khiếu nại tranh chấp nào phù hợp.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DISPUTE MODAL */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 py-6 bg-black/60 backdrop-blur-sm">
          <div className="relative bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-scale-up max-h-[90vh] overflow-y-auto flex flex-col">
            
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10">
              <div className="flex flex-col">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Chi tiết đối chất Tranh Chấp</h3>
              </div>
              <button 
                onClick={() => setSelectedDispute(null)}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Side: Product Post (Bài đăng) */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded uppercase">Thông tin bài đăng</span>
                  </div>
                  
                  <div className="aspect-video w-full bg-zinc-200 dark:bg-zinc-800 rounded-xl overflow-hidden mb-4">
                    <img src={selectedDispute.currentSnapshot.image} alt="Product" className="w-full h-full object-cover" />
                  </div>
                  
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">{selectedDispute.currentSnapshot.name}</h4>
                  
                  <div className="space-y-2 text-xs mb-4">
                    <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                      <span className="text-zinc-500">Giá giao dịch:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{(selectedDispute.currentSnapshot.price).toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                      <span className="text-zinc-500">Tình trạng:</span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{selectedDispute.currentSnapshot.specs.condition}</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase mb-1 block">Mô tả chi tiết:</span>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                      {selectedDispute.currentSnapshot.description || 'Không có mô tả chi tiết.'}
                    </p>
                  </div>
                </div>

                {/* Right Side: Complaint & Evidence (Khiếu nại & Chứng cứ) */}
                <div className="space-y-6">
                  {/* Lý do khiếu nại */}
                  <div className="bg-rose-500/5 border border-rose-500/20 p-5 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      <span className="text-xs font-bold uppercase text-rose-500">Lý do khiếu nại (Từ người mua)</span>
                    </div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
                      "{selectedDispute.reason}"
                    </p>
                  </div>

                  {/* Ảnh chứng cứ */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-2 mb-4">
                      <Camera className="w-4 h-4 text-zinc-500" />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">Ảnh chứng cứ đính kèm</span>
                    </div>
                    
                    <div className="relative h-48 w-full bg-zinc-200 dark:bg-zinc-800 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                      <img
                        src={selectedDispute.evidenceImage}
                        alt="Ảnh chứng cứ"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {selectedDispute.evidenceDescription && (
                      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 italic">
                        Mô tả ảnh: {selectedDispute.evidenceDescription}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {selectedDispute.status !== 'RESOLVED' && (
                <div className="flex items-center justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-6">
                  <button
                    onClick={() => setSelectedDispute(null)}
                    className="px-6 py-2.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-semibold rounded-xl transition-colors"
                  >
                    Đóng cửa sổ
                  </button>
                  <button
                    onClick={() => handleResolveDispute(selectedDispute.id, 'RESOLVED')}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-rose-500/20"
                  >
                    Xử lý khiếu nại
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
