'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Scale } from 'lucide-react';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import { useAuthGuard } from '@/lib/hooks/useAuthGuard';
import { showSuccessAlert, showErrorAlert } from "@/lib/alerts";

interface UserDispute {
  id: string;
  orderId: string;
  productName: string;
  reason: string;
  status: string;
  date: string;
}

export default function UserDisputesPage() {
  const { currentUser, loading } = useAuthGuard();
  const [disputes, setDisputes] = useState<UserDispute[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDisputeOrderId, setNewDisputeOrderId] = useState('');
  const [newDisputeReason, setNewDisputeReason] = useState('');
  const [eligibleOrders, setEligibleOrders] = useState<any[]>([]);

  const fetchEligibleOrders = async () => {
    try {
      const res = await fetch('/api/disputes/eligible-orders');
      if (res.ok) {
        const data = await res.json();
        setEligibleOrders(data);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', err);
    }
  };

  const fetchDisputes = async () => {
    try {
      const res = await fetch('/api/disputes');
      if (res.ok) {
        const data = await res.json();
        setDisputes(data);
      }
    } catch (err) {
      console.error('Lỗi khi lấy khiếu nại:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchDisputes();
    }
  }, [currentUser]);

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisputeOrderId || !newDisputeReason) {
      showErrorAlert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: newDisputeOrderId, reason: newDisputeReason })
      });
      if (res.ok) {
        showSuccessAlert('Thành công', 'Đã gửi khiếu nại');
        setIsModalOpen(false);
        setNewDisputeOrderId('');
        setNewDisputeReason('');
        fetchDisputes();
      } else {
        const err = await res.json();
        showErrorAlert('Lỗi', err.error || 'Đã có lỗi xảy ra');
      }
    } catch (error) {
      showErrorAlert('Lỗi', 'Không thể gửi khiếu nại');
    }
  };

  if (loading) {
    return (
      <DashboardLayout activeItemId="disputes" pageTitle="Khiếu nại">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Scale className="w-6 h-6 text-blue-600 animate-spin-slow" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeItemId="disputes" pageTitle="Khiếu nại">
      <div className="space-y-6 animate-page-transition">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/60 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-semibold">Danh sách khiếu nại của bạn</h3>
            </div>
            <button
              onClick={() => {
                setIsModalOpen(true);
                fetchEligibleOrders();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tạo khiếu nại mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {disputes.map((d) => (
              <div key={d.id} className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 bg-zinc-50/50 dark:bg-zinc-900/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-medium bg-rose-500 text-white px-2 py-0.5 rounded uppercase">{d.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                    d.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-600' :
                    d.status === 'INVESTIGATING' ? 'bg-indigo-500/10 text-indigo-600' :
                    'bg-rose-500/10 text-rose-500'
                  }`}>
                    {d.status === 'RESOLVED' ? 'Đã giải quyết' : d.status === 'INVESTIGATING' ? 'Đang điều tra' : 'Mới tạo'}
                  </span>
                </div>
                <h4 className="text-sm font-semibold mb-2">{d.productName}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2"><strong>Mã đơn hàng:</strong> {d.orderId}</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-300"><strong>Lý do:</strong> {d.reason}</p>
                <div className="mt-4 text-[10px] text-zinc-400">Tạo ngày: {new Date(d.date).toLocaleDateString()}</div>
              </div>
            ))}
            {disputes.length === 0 && (
              <div className="col-span-1 md:col-span-2 py-12 text-center text-xs text-zinc-400">
                Bạn chưa có khiếu nại nào.
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-md shadow-xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-semibold mb-4">Tạo khiếu nại mới</h3>
            <form onSubmit={handleSubmitDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Sản phẩm cần khiếu nại</label>
                <select
                  required
                  value={newDisputeOrderId}
                  onChange={e => setNewDisputeOrderId(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                >
                  <option value="" disabled>-- Chọn sản phẩm --</option>
                  {eligibleOrders.map(order => (
                    <option key={order.id} value={order.id}>
                      {order.productName} ({order.role === 'BUYER' ? 'Bạn là người mua' : 'Bạn là người bán'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Lý do khiếu nại</label>
                <textarea
                  required
                  value={newDisputeReason}
                  onChange={e => setNewDisputeReason(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm h-24"
                  placeholder="Mô tả chi tiết vấn đề..."
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium"
                >
                  Gửi khiếu nại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
