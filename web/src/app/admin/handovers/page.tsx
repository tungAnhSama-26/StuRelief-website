'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileBadge, 
  Search, 
  Check, 
  AlertCircle, 
  ArrowLeft,
  Package,
  Clock,
  User,
  Image as ImageIcon,
  ChevronRight,
  ExternalLink,
  Loader2
} from 'lucide-react';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import { useAuthGuard } from '@/lib/hooks/useAuthGuard';
import { UserRole } from '@shared';
import Image from 'next/image';

interface HandoverEvidence {
  id: string;
  url: string;
  type: string;
  caption: string | null;
  createdAt: string;
}

interface OrderHistory {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
}

interface Handover {
  id: string;
  orderId: string;
  productName: string;
  buyerName: string;
  sellerName: string;
  finalPrice: number;
  status: string;
  evidences: HandoverEvidence[];
  history: OrderHistory[];
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  'WAITING_CONFIRM': 'Chờ xác nhận',
  'PAYMENT_PENDING': 'Chờ thanh toán',
  'MEETING': 'Hẹn gặp mặt',
  'DELIVERING': 'Đang giao hàng',
  'SUCCESS': 'Thành công',
  'CANCELLED': 'Đã hủy',
  'DISPUTED': 'Khiếu nại',
};

const STATUS_COLORS: Record<string, string> = {
  'WAITING_CONFIRM': 'text-amber-600 bg-amber-50 border-amber-200',
  'PAYMENT_PENDING': 'text-blue-600 bg-blue-50 border-blue-200',
  'MEETING': 'text-indigo-600 bg-indigo-50 border-indigo-200',
  'DELIVERING': 'text-purple-600 bg-purple-50 border-purple-200',
  'SUCCESS': 'text-emerald-600 bg-emerald-50 border-emerald-200',
  'CANCELLED': 'text-zinc-600 bg-zinc-50 border-zinc-200',
  'DISPUTED': 'text-rose-600 bg-rose-50 border-rose-200',
};

export default function HandoversPage() {
  const { currentUser, loading: authLoading } = useAuthGuard(UserRole.ADMIN);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHandover, setSelectedHandover] = useState<Handover | null>(null);
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHandovers = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/handovers');
        if (res.ok) {
          const data = await res.json();
          setHandovers(data);
        }
      } catch (err) {
        console.error('Lỗi khi fetch handovers:', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchHandovers();
    }
  }, [currentUser]);

  const filteredHandovers = handovers.filter(h => 
    h.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.sellerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <span className="text-zinc-500 font-medium text-sm">Đang tải phân hệ bàn giao & bằng chứng...</span>
      </div>
    );
  }

  return (
    <DashboardLayout activeItemId="handovers" pageTitle="Quản Lý Bàn Giao & Bằng Chứng">
      <div className="space-y-3">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm theo Mã đơn, Sản phẩm, Người mua..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'SUCCESS', 'DISPUTED', 'MEETING', 'DELIVERING'].map((status) => (
              <button 
                key={status}
                className="px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 transition-all"
              >
                {status === 'ALL' ? 'Tất cả' : STATUS_LABELS[status] || status}
              </button>
            ))}
          </div>
        </div>

        {/* Handovers List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredHandovers.length > 0 ? (
            filteredHandovers.map((handover) => (
              <div 
                key={handover.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 hover:border-blue-500/30 transition-all group cursor-pointer"
                onClick={() => setSelectedHandover(handover)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">#{handover.id.slice(-8).toUpperCase()}</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border ${STATUS_COLORS[handover.status] || 'bg-zinc-100 text-zinc-600'}`}>
                          {STATUS_LABELS[handover.status] || handover.status}
                        </span>
                      </div>
                      <h3 className="font-medium text-zinc-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">{handover.productName}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                        <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Bán: {handover.sellerName}</span>
                        <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Mua: {handover.buyerName}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(handover.updatedAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:self-center shrink-0">
                    <div className="text-right hidden md:block mr-4">
                      <div className="text-sm font-black text-zinc-900 dark:text-white">{handover.finalPrice.toLocaleString()}đ</div>
                      <div className="text-[10px] text-zinc-500 uppercase font-medium tracking-tighter">{handover.evidences.length} bằng chứng</div>
                    </div>
                    <button className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[32px] p-16 text-center">
              <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-3xl flex items-center justify-center text-zinc-400 mx-auto mb-6">
                <FileBadge className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">Chưa có dữ liệu bàn giao</h3>
              <p className="text-zinc-500 text-sm max-w-xs mx-auto">Hệ thống chưa ghi nhận bất kỳ đơn hàng hoặc bằng chứng bàn giao nào phù hợp.</p>
            </div>
          )}
        </div>

        {/* Detail Sidebar / Modal */}
        {selectedHandover && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
            <div 
              className="absolute inset-0" 
              onClick={() => setSelectedHandover(null)}
            />
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-950 shadow-2xl overflow-y-auto rounded-3xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-300">
              
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSelectedHandover(null)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="font-black text-lg text-zinc-900 dark:text-white leading-tight">Chi tiết bàn giao</h2>
                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mt-0.5">Mã đơn: #{selectedHandover.id.toUpperCase()}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-xl text-[10px] font-black border uppercase tracking-widest ${STATUS_COLORS[selectedHandover.status] || 'bg-zinc-100 text-zinc-600'}`}>
                  {STATUS_LABELS[selectedHandover.status] || selectedHandover.status}
                </div>
              </div>

              <div className="p-8 space-y-10">
                {/* Product Summary */}
                <section className="bg-zinc-50 dark:bg-zinc-900/50 rounded-[32px] p-6 border border-zinc-100 dark:border-zinc-800">
                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Package className="w-3.5 h-3.5" /> Thông tin giao dịch
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-xl text-zinc-900 dark:text-white">{selectedHandover.productName}</h4>
                        <p className="text-sm text-blue-600 font-black mt-1">{selectedHandover.finalPrice.toLocaleString()}đ</p>
                      </div>
                      <button className="text-zinc-400 hover:text-blue-600 transition-colors">
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                        <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">Người bán</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{selectedHandover.sellerName}</p>
                      </div>
                      <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                        <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">Người mua</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{selectedHandover.buyerName}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Evidence Showcase */}
                <section>
                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5" /> Bằng chứng bàn giao ({selectedHandover.evidences.length})
                  </h3>
                  {selectedHandover.evidences.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {selectedHandover.evidences.map((evidence) => (
                        <div key={evidence.id} className="group relative">
                          <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={evidence.url} 
                              alt={evidence.caption || 'Handover Evidence'} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button className="p-3 bg-white rounded-full text-zinc-900 shadow-xl scale-90 group-hover:scale-100 transition-transform">
                                <Search className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-3 px-2">
                            <p className="text-xs font-medium text-zinc-900 dark:text-white truncate">{evidence.caption || (evidence.type === 'PICKUP_PROOF' ? 'Ảnh bàn giao trực tiếp' : 'Ảnh xác nhận')}</p>
                            <p className="text-[10px] text-zinc-500 mt-1">{new Date(evidence.createdAt).toLocaleString('vi-VN')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[32px] text-center">
                      <ImageIcon className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
                      <p className="text-sm text-zinc-500 font-medium">Chưa có hình ảnh bằng chứng nào được tải lên cho đơn này.</p>
                    </div>
                  )}
                </section>

                {/* Activity History */}
                <section>
                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Lịch sử trạng thái
                  </h3>
                  <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-100 dark:before:bg-zinc-800">
                    {selectedHandover.history.map((log) => (
                      <div key={log.id} className="relative pl-10">
                        <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white dark:border-zinc-950 flex items-center justify-center shadow-sm ${
                          log.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
                        }`}>
                          {log.status === 'SUCCESS' && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tighter">{STATUS_LABELS[log.status] || log.status}</span>
                            <span className="text-[10px] text-zinc-400 font-medium">{new Date(log.createdAt).toLocaleString('vi-VN')}</span>
                          </div>
                          {log.note && <p className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 mt-2">{log.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Dispute / Resolution Action */}
                {selectedHandover.status === 'DISPUTED' && (
                  <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-[32px] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-rose-700 dark:text-rose-400 text-sm">Đang có tranh chấp!</h4>
                      <p className="text-xs text-rose-600/70 dark:text-rose-400/60 mt-0.5 font-medium leading-relaxed">Đơn hàng này đang được gắn cờ tranh chấp. Quản trị viên cần kiểm tra kỹ bằng chứng trước khi xử lý.</p>
                    </div>
                    <button className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95">
                      Xử lý ngay
                    </button>
                  </div>
                )}
                
                <div className="h-20" /> {/* Spacer */}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
