'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Award,
  Search,
  Star,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Filter,
  Sliders,
  X,
  User,
  ShieldCheck,
  AlertTriangle,
  History,
  MessageSquare,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import { useAuthGuard } from '@/lib/hooks/useAuthGuard';
import { UserRole, APP_ROUTES } from '@shared';

interface StudentReputation {
  id: string;
  fullName: string;
  email: string;
  studentCode: string;
  reputationScore: number;
  status: string;
  avatarUrl?: string | null;
}

interface ActivityLog {
  id: string;
  userId: string;
  studentName: string;
  studentCode: string;
  delta: number;
  actionType: string;
  note: string;
  createdAt: string;
}

interface FeedbackReview {
  id: string;
  orderId: string;
  rating: number;
  body: string;
  reviewerName: string;
  reviewerAvatar?: string | null;
  reviewedName: string;
  reviewedAvatar?: string | null;
  productName: string;
  createdAt: string;
}

type StudentStatusFilter = 'all' | 'VERIFIED' | 'UNVERIFIED';
type StudentScoreFilter = 'all' | 'high' | 'good' | 'warning' | 'low';
type StudentSortOption = 'score-desc' | 'score-asc' | 'name-asc' | 'name-desc' | 'code-asc' | 'code-desc';
type FeedbackRatingFilter = 'all' | 'five' | 'four-plus' | 'three' | 'low';
type FeedbackSortOption = 'newest' | 'oldest' | 'rating-desc' | 'rating-asc' | 'reviewer-asc' | 'reviewer-desc';
type ActivityTypeFilter = 'all' | 'increase' | 'decrease';
type ActivitySortOption = 'newest' | 'oldest' | 'delta-desc' | 'delta-asc' | 'name-asc' | 'name-desc';
type PaginationItem = number | 'ellipsis';

const STUDENTS_PER_PAGE = 5;
const FEEDBACKS_PER_PAGE = 4;
const ACTIVITIES_PER_PAGE = 6;

const matchesScoreFilter = (score: number, filter: StudentScoreFilter) => {
  if (filter === 'high') return score >= 110;
  if (filter === 'good') return score >= 95 && score < 110;
  if (filter === 'warning') return score >= 85 && score < 95;
  if (filter === 'low') return score < 85;
  return true;
};

const matchesFeedbackRatingFilter = (rating: number, filter: FeedbackRatingFilter) => {
  if (filter === 'five') return rating === 5;
  if (filter === 'four-plus') return rating >= 4;
  if (filter === 'three') return rating === 3;
  if (filter === 'low') return rating <= 2;
  return true;
};

const buildPaginationItems = (currentPage: number, totalPages: number): PaginationItem[] => {
  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const validPages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const items: PaginationItem[] = [];

  validPages.forEach((page, index) => {
    const previous = validPages[index - 1];
    if (index > 0 && page - previous > 1) {
      items.push('ellipsis');
    }
    items.push(page);
  });

  return items;
};

export default function ReputationsPage() {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuthGuard(UserRole.ADMIN);
  const [activeTab, setActiveTab] = useState<'students' | 'feedbacks' | 'activities'>('students');
  
  // Data States
  const [students, setStudents] = useState<StudentReputation[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<StudentStatusFilter>('all');
  const [studentScoreFilter, setStudentScoreFilter] = useState<StudentScoreFilter>('all');
  const [studentSort, setStudentSort] = useState<StudentSortOption>('score-desc');
  const [studentPage, setStudentPage] = useState(1);
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState<FeedbackRatingFilter>('all');
  const [feedbackSort, setFeedbackSort] = useState<FeedbackSortOption>('newest');
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [activityTypeFilter, setActivityTypeFilter] = useState<ActivityTypeFilter>('all');
  const [activitySort, setActivitySort] = useState<ActivitySortOption>('newest');
  const [activityPage, setActivityPage] = useState(1);
  
  // Adjustment Modal
  const [selectedStudent, setSelectedStudent] = useState<StudentReputation | null>(null);
  const [adjustmentDelta, setAdjustmentDelta] = useState<number>(10);
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('increase');
  const [adjustmentNote, setAdjustmentNote] = useState('');
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchReputationData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/reputations');
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setActivities(data.activities || []);
        setFeedbacks(data.feedbacks || []);
      }
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu danh tiếng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchReputationData();
    }
  }, [authLoading, currentUser]);

  const handleTabChange = (tab: 'students' | 'feedbacks' | 'activities') => {
    setActiveTab(tab);
    setSearchQuery('');
    setStudentPage(1);
    setFeedbackPage(1);
    setActivityPage(1);
  };

  const closeAdjustmentModal = () => {
    setSelectedStudent(null);
    setAdjustmentNote('');
    setAdjustmentDelta(10);
    setAdjustmentType('increase');
    setAdjustmentError(null);
  };

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAdjustReputation = async (e: React.FormEvent) => {
    e.preventDefault();
    const note = adjustmentNote.trim();
    const deltaValue = Number(adjustmentDelta);

    if (!selectedStudent) {
      setAdjustmentError('Không tìm thấy sinh viên cần điều chỉnh.');
      return;
    }

    if (!Number.isFinite(deltaValue) || deltaValue < 1 || deltaValue > 100) {
      setAdjustmentError('Số điểm thay đổi phải từ 1 đến 100.');
      return;
    }

    if (!note) {
      setAdjustmentError('Vui lòng nhập lý do điều chỉnh hợp lệ.');
      return;
    }

    const confirmed = window.confirm('Xác nhận điều chỉnh điểm uy tín cho sinh viên này?');
    if (!confirmed) return;

    try {
      setActionLoading(true);
      setAdjustmentError(null);
      const signedDelta = adjustmentType === 'increase' ? Math.abs(deltaValue) : -Math.abs(deltaValue);
      
      const res = await fetch('/api/admin/reputations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedStudent.id,
          delta: signedDelta,
          note
        })
      });

      if (res.ok) {
        closeAdjustmentModal();
        // Refresh data list
        await fetchReputationData();
        showFeedback('Điều chỉnh điểm uy tín thành công!');
      } else {
        const data = await res.json().catch(() => null);
        setAdjustmentError(data?.error || 'Không thể cập nhật điểm uy tín, vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Lỗi khi điều chỉnh điểm uy tín:', err);
      setAdjustmentError('Đã có lỗi xảy ra khi cập nhật điểm uy tín.');
      showFeedback('Đã có lỗi xảy ra khi cập nhật điểm uy tín.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Calculations
  const averageReputation = students.length > 0 
    ? Math.round(students.reduce((acc, curr) => acc + curr.reputationScore, 0) / students.length)
    : 100;

  const positiveFeedbackRate = feedbacks.length > 0
    ? Math.round((feedbacks.filter(f => f.rating >= 4).length / feedbacks.length) * 100)
    : 100;

  const lowReputationCount = students.filter(s => s.reputationScore < 85).length;

  const searchedStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = searchedStudents.filter((student) => {
    if (studentStatusFilter !== 'all' && student.status !== studentStatusFilter) {
      return false;
    }
    return matchesScoreFilter(student.reputationScore, studentScoreFilter);
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    switch (studentSort) {
      case 'score-asc':
        return a.reputationScore - b.reputationScore;
      case 'score-desc':
        return b.reputationScore - a.reputationScore;
      case 'name-asc':
        return a.fullName.localeCompare(b.fullName, 'vi');
      case 'name-desc':
        return b.fullName.localeCompare(a.fullName, 'vi');
      case 'code-asc':
        return a.studentCode.localeCompare(b.studentCode, 'vi');
      case 'code-desc':
        return b.studentCode.localeCompare(a.studentCode, 'vi');
      default:
        return 0;
    }
  });

  const studentTotalPages = Math.max(1, Math.ceil(sortedStudents.length / STUDENTS_PER_PAGE));
  const currentStudentPage = Math.min(studentPage, studentTotalPages);
  const studentStartIndex = (currentStudentPage - 1) * STUDENTS_PER_PAGE;
  const studentEndIndex = Math.min(studentStartIndex + STUDENTS_PER_PAGE, sortedStudents.length);
  const paginatedStudents = sortedStudents.slice(studentStartIndex, studentEndIndex);
  const studentPaginationItems = buildPaginationItems(currentStudentPage, studentTotalPages);

  const searchedFeedbacks = feedbacks.filter(f => 
    f.reviewerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.reviewedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFeedbacks = searchedFeedbacks.filter((feedback) =>
    matchesFeedbackRatingFilter(feedback.rating, feedbackRatingFilter)
  );

  const sortedFeedbacks = [...filteredFeedbacks].sort((a, b) => {
    switch (feedbackSort) {
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'rating-desc':
        return b.rating - a.rating;
      case 'rating-asc':
        return a.rating - b.rating;
      case 'reviewer-asc':
        return a.reviewerName.localeCompare(b.reviewerName, 'vi');
      case 'reviewer-desc':
        return b.reviewerName.localeCompare(a.reviewerName, 'vi');
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const feedbackTotalPages = Math.max(1, Math.ceil(sortedFeedbacks.length / FEEDBACKS_PER_PAGE));
  const currentFeedbackPage = Math.min(feedbackPage, feedbackTotalPages);
  const feedbackStartIndex = (currentFeedbackPage - 1) * FEEDBACKS_PER_PAGE;
  const feedbackEndIndex = Math.min(feedbackStartIndex + FEEDBACKS_PER_PAGE, sortedFeedbacks.length);
  const paginatedFeedbacks = sortedFeedbacks.slice(feedbackStartIndex, feedbackEndIndex);
  const feedbackPaginationItems = buildPaginationItems(currentFeedbackPage, feedbackTotalPages);

  const searchedActivities = activities.filter(a => 
    a.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.note.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActivities = searchedActivities.filter((activity) => {
    if (activityTypeFilter === 'increase') return activity.delta > 0;
    if (activityTypeFilter === 'decrease') return activity.delta < 0;
    return true;
  });

  const sortedActivities = [...filteredActivities].sort((a, b) => {
    switch (activitySort) {
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'delta-desc':
        return b.delta - a.delta;
      case 'delta-asc':
        return a.delta - b.delta;
      case 'name-asc':
        return a.studentName.localeCompare(b.studentName, 'vi');
      case 'name-desc':
        return b.studentName.localeCompare(a.studentName, 'vi');
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const activityTotalPages = Math.max(1, Math.ceil(sortedActivities.length / ACTIVITIES_PER_PAGE));
  const currentActivityPage = Math.min(activityPage, activityTotalPages);
  const activityStartIndex = (currentActivityPage - 1) * ACTIVITIES_PER_PAGE;
  const activityEndIndex = Math.min(activityStartIndex + ACTIVITIES_PER_PAGE, sortedActivities.length);
  const paginatedActivities = sortedActivities.slice(activityStartIndex, activityEndIndex);
  const activityPaginationItems = buildPaginationItems(currentActivityPage, activityTotalPages);

  React.useEffect(() => {
    setStudentPage(1);
  }, [searchQuery, studentStatusFilter, studentScoreFilter, studentSort]);

  React.useEffect(() => {
    setFeedbackPage(1);
  }, [searchQuery, feedbackRatingFilter, feedbackSort]);

  React.useEffect(() => {
    setActivityPage(1);
  }, [searchQuery, activityTypeFilter, activitySort]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
        <Award className="w-12 h-12 text-blue-600 animate-bounce mb-4" />
        <span className="text-zinc-500 font-medium text-sm">Đang tải phân hệ uy tín & đánh giá...</span>
      </div>
    );
  }

  return (
    <DashboardLayout activeItemId="reputations" pageTitle="Uy Tín & Đánh Giá Sinh Viên">
      <div className="space-y-3">
        {feedback && (
          <div className={`fixed right-5 top-20 z-50 flex items-center gap-2 rounded-2xl border px-5 py-3 shadow-xl md:top-24 ${
            feedback.type === 'success'
              ? 'bg-emerald-500 text-white border-emerald-400'
              : 'bg-rose-500 text-white border-rose-400'
          }`}>
            <span className="text-sm font-semibold">{feedback.message}</span>
          </div>
        )}
        
        {/* Navigation Breadcrumb */}
        
        {/* Top Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Avg score */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/60 shadow-sm flex items-center justify-between group hover:border-blue-500/30 transition-all duration-300">
            <div className="space-y-2">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 tracking-tight block">Uy tín trung bình</span>
              <span className="text-3xl font-medium tracking-tight text-zinc-900 dark:text-white">{averageReputation}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-600 shadow-blue-500/10 text-white flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <Award className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Feedback rate */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/60 shadow-sm flex items-center justify-between group hover:border-blue-500/30 transition-all duration-300">
            <div className="space-y-2">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 tracking-tight block">Tỷ lệ hài lòng</span>
              <span className="text-3xl font-medium tracking-tight text-zinc-900 dark:text-white">{positiveFeedbackRate}%</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500 shadow-amber-500/10 text-white flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <Star className="w-6 h-6 fill-white" />
            </div>
          </div>

          {/* Card 3: Total reviews */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/60 shadow-sm flex items-center justify-between group hover:border-blue-500/30 transition-all duration-300">
            <div className="space-y-2">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 tracking-tight block">Tổng đánh giá</span>
              <span className="text-3xl font-medium tracking-tight text-zinc-900 dark:text-white">{feedbacks.length}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 shadow-indigo-500/10 text-white flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Low reputation */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/60 shadow-sm flex items-center justify-between group hover:border-blue-500/30 transition-all duration-300">
            <div className="space-y-2">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 tracking-tight block">Cần lưu ý</span>
              <span className="text-3xl font-medium tracking-tight text-rose-500">{lowReputationCount}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500 shadow-rose-500/10 text-white flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab Controls & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-xl w-fit self-start">
            <button
              onClick={() => handleTabChange('students')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === 'students' ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white'}`}
            >
              Bảng điểm Uy tín
            </button>
            <button
              onClick={() => handleTabChange('feedbacks')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === 'feedbacks' ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white'}`}
            >
              Phản hồi & Feedback
            </button>
            <button
              onClick={() => handleTabChange('activities')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === 'activities' ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white'}`}
            >
              Biến động & Nhật ký
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder={activeTab === 'students' ? "Tìm theo mã SV, họ tên..." : activeTab === 'feedbacks' ? "Tìm phản hồi..." : "Tìm nhật ký..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600 transition-colors shadow-sm"
            />
          </div>
        </div>

        {/* Tab 1: Students Reputation Score Table */}
        {activeTab === 'students' && (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/50 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/40">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-white">Danh sách Điểm Uy tín Sinh viên</h3>
            </div>
            
            <div className="p-4 md:p-5 border-b border-zinc-100 dark:border-zinc-800/40 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-medium tracking-tight text-zinc-950 dark:text-zinc-100">Trạng thái</span>
                  <select
                    value={studentStatusFilter}
                    onChange={(e) => setStudentStatusFilter(e.target.value as StudentStatusFilter)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-blue-600"
                  >
                    <option value="all">Tất cả</option>
                    <option value="VERIFIED">Đã xác thực</option>
                    <option value="UNVERIFIED">Chưa xác thực</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-medium tracking-tight text-zinc-950 dark:text-zinc-100">Nhóm điểm</span>
                  <select
                    value={studentScoreFilter}
                    onChange={(e) => setStudentScoreFilter(e.target.value as StudentScoreFilter)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-blue-600"
                  >
                    <option value="all">Tất cả</option>
                    <option value="high">Từ 110 trở lên</option>
                    <option value="good">95 - 109</option>
                    <option value="warning">85 - 94</option>
                    <option value="low">Dưới 85</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-medium tracking-tight text-zinc-950 dark:text-zinc-100">Sắp xếp</span>
                  <select
                    value={studentSort}
                    onChange={(e) => setStudentSort(e.target.value as StudentSortOption)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-blue-600"
                  >
                    <option value="score-desc">Điểm giảm dần</option>
                    <option value="score-asc">Điểm tăng dần</option>
                    <option value="name-asc">Tên A-Z</option>
                    <option value="name-desc">Tên Z-A</option>
                    <option value="code-asc">Mã SV tăng dần</option>
                    <option value="code-desc">Mã SV giảm dần</option>
                  </select>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setStudentStatusFilter('all');
                    setStudentScoreFilter('all');
                    setStudentSort('score-desc');
                    setStudentPage(1);
                  }}
                  className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[11px] font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5"
                >
                  <Filter className="w-3.5 h-3.5" />
                  Đặt lại bộ lọc
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/40 text-[10px] text-zinc-950 dark:text-zinc-100 font-medium tracking-tight border-b border-zinc-100 dark:border-zinc-800/50">
                    <th className="p-4 pl-6">Sinh viên</th>
                    <th className="p-4">Mã số SV</th>
                    <th className="p-4">Trạng thái xác thực</th>
                    <th className="p-4 text-center">Điểm Uy tín</th>
                    <th className="p-4 text-right pr-6">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 text-xs font-medium">
                  {paginatedStudents.map(student => (
                    <tr key={student.id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="p-4 pl-6 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium overflow-hidden">
                          {student.avatarUrl ? (
                            <img src={student.avatarUrl} alt={student.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{student.fullName.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-zinc-900 dark:text-white font-medium">{student.fullName}</span>
                          <span className="text-[10px] text-zinc-400 font-normal">{student.email}</span>
                        </div>
                      </td>
                      <td className="p-4 text-zinc-500 dark:text-zinc-400 font-mono">{student.studentCode}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium tracking-wide uppercase ${
                          student.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {student.status === 'VERIFIED' ? 'Đã Xác thực' : 'Chưa Xác thực'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-sm font-extrabold px-3 py-1 rounded-xl ${
                          student.reputationScore >= 110 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400' :
                          student.reputationScore >= 95 ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400' :
                          student.reputationScore >= 85 ? 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400' : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400'
                        }`}>
                          {student.reputationScore}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          Điều chỉnh điểm
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sortedStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-400">
                        Không tìm thấy sinh viên nào phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 md:px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-[11px] text-zinc-400 font-medium">
                Trang {currentStudentPage} / {studentTotalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStudentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentStudentPage <= 1}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Trước
                </button>

                <div className="flex items-center gap-1">
                  {studentPaginationItems.map((item, index) =>
                    item === 'ellipsis' ? (
                      <span key={`student-ellipsis-${index}`} className="px-2 text-zinc-400 text-xs font-medium">
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setStudentPage(item)}
                        className={`min-w-9 h-9 px-3 rounded-xl text-xs font-medium transition-colors ${
                          item === currentStudentPage
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() => setStudentPage((prev) => Math.min(studentTotalPages, prev + 1))}
                  disabled={currentStudentPage >= studentTotalPages}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Sau
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Feedback & Reviews Feed */}
        {activeTab === 'feedbacks' && (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/50 shadow-sm overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/40">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-white">Phản hồi & Feedback</h3>
            </div>

            <div className="p-4 md:p-5 border-b border-zinc-100 dark:border-zinc-800/40 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-medium tracking-tight text-zinc-950 dark:text-zinc-100">Mức đánh giá</span>
                  <select
                    value={feedbackRatingFilter}
                    onChange={(e) => setFeedbackRatingFilter(e.target.value as FeedbackRatingFilter)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-blue-600"
                  >
                    <option value="all">Tất cả</option>
                    <option value="five">5 sao</option>
                    <option value="four-plus">4 sao trở lên</option>
                    <option value="three">3 sao</option>
                    <option value="low">2 sao trở xuống</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-medium tracking-tight text-zinc-950 dark:text-zinc-100">Sắp xếp</span>
                  <select
                    value={feedbackSort}
                    onChange={(e) => setFeedbackSort(e.target.value as FeedbackSortOption)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-blue-600"
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                    <option value="rating-desc">Đánh giá giảm dần</option>
                    <option value="rating-asc">Đánh giá tăng dần</option>
                    <option value="reviewer-asc">Người đánh giá A-Z</option>
                    <option value="reviewer-desc">Người đánh giá Z-A</option>
                  </select>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setFeedbackRatingFilter('all');
                    setFeedbackSort('newest');
                    setFeedbackPage(1);
                  }}
                  className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[11px] font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5"
                >
                  <Filter className="w-3.5 h-3.5" />
                  Đặt lại bộ lọc
                </button>
              </div>
            </div>

            <div className="p-4 md:p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paginatedFeedbacks.map((review) => (
              <div key={review.id} className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/50 p-5 rounded-3xl space-y-4 shadow-sm flex flex-col justify-between">
                
                {/* Header review details */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8.5 h-8.5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium text-xs">
                      {review.reviewerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-zinc-950 dark:text-white font-medium text-xs">{review.reviewerName}</span>
                      <span className="text-[10px] text-zinc-400 font-normal">Người mua đánh giá</span>
                    </div>
                  </div>
                  
                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5 bg-amber-500/5 px-2 py-1 rounded-xl">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-black text-amber-600">{review.rating}</span>
                  </div>
                </div>

                {/* Review Body */}
                <div className="bg-zinc-50 dark:bg-zinc-800/30 p-3.5 rounded-2xl text-xs text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed italic">
                  "{review.body}"
                </div>

                {/* Target Information */}
                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/40 pt-3 text-[10px]">
                  <div className="flex flex-col">
                    <span className="text-zinc-400">Người bán nhận: <strong className="text-zinc-700 dark:text-zinc-300 font-medium">{review.reviewedName}</strong></span>
                    <span className="text-zinc-400 mt-0.5">Sản phẩm: <strong className="text-zinc-500 dark:text-zinc-400">{review.productName}</strong></span>
                  </div>
                  <span className="text-zinc-400 font-medium font-mono">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>

              </div>
            ))}
            {sortedFeedbacks.length === 0 && (
              <div className="col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center text-xs text-zinc-400 shadow-sm">
                Không tìm thấy đánh giá phản hồi nào.
              </div>
            )}
          </div>
            </div>

          <div className="px-4 md:px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-[11px] text-zinc-400 font-medium">
              Trang {currentFeedbackPage} / {feedbackTotalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFeedbackPage((prev) => Math.max(1, prev - 1))}
                disabled={currentFeedbackPage <= 1}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Trước
              </button>

              <div className="flex items-center gap-1">
                {feedbackPaginationItems.map((item, index) =>
                  item === 'ellipsis' ? (
                    <span key={`feedback-ellipsis-${index}`} className="px-2 text-zinc-400 text-xs font-medium">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setFeedbackPage(item)}
                      className={`min-w-9 h-9 px-3 rounded-xl text-xs font-medium transition-colors ${
                        item === currentFeedbackPage
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setFeedbackPage((prev) => Math.min(feedbackTotalPages, prev + 1))}
                disabled={currentFeedbackPage >= feedbackTotalPages}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Sau
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          </div>
        )}

        {/* Tab 3: Activity Fluctuations logs */}
        {activeTab === 'activities' && (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/50 shadow-sm overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/40">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-white">Lịch sử Biến động Uy tín Hệ thống</h3>
            </div>
            
            <div className="p-4 md:p-5 border-b border-zinc-100 dark:border-zinc-800/40 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-medium tracking-tight text-zinc-950 dark:text-zinc-100">Loại biến động</span>
                  <select
                    value={activityTypeFilter}
                    onChange={(e) => setActivityTypeFilter(e.target.value as ActivityTypeFilter)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-blue-600"
                  >
                    <option value="all">Tất cả</option>
                    <option value="increase">Tăng điểm</option>
                    <option value="decrease">Giảm điểm</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-medium tracking-tight text-zinc-950 dark:text-zinc-100">Sắp xếp</span>
                  <select
                    value={activitySort}
                    onChange={(e) => setActivitySort(e.target.value as ActivitySortOption)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-blue-600"
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                    <option value="delta-desc">Biến động giảm dần</option>
                    <option value="delta-asc">Biến động tăng dần</option>
                    <option value="name-asc">Tên A-Z</option>
                    <option value="name-desc">Tên Z-A</option>
                  </select>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setActivityTypeFilter('all');
                    setActivitySort('newest');
                    setActivityPage(1);
                  }}
                  className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[11px] font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Đặt lại bộ lọc
                </button>
              </div>

              <div className="space-y-3">
              {paginatedActivities.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3.5 border border-zinc-100 dark:border-zinc-800/50 hover:border-blue-500/20 bg-zinc-50/40 dark:bg-zinc-900/30 rounded-2xl transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      log.delta > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {log.delta > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-900 dark:text-white">{log.studentName}</span>
                        <span className="text-[9px] font-mono text-zinc-400">({log.studentCode})</span>
                      </div>
                      <span className="text-[10.5px] text-zinc-500 dark:text-zinc-400 mt-0.5">{log.note}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                      log.delta > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                    }`}>
                      {log.delta > 0 ? `+${log.delta}` : log.delta} điểm
                    </span>
                    <span className="text-[9px] text-zinc-400 font-medium font-mono">
                      {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              ))}
              {sortedActivities.length === 0 && (
                <div className="py-12 text-center text-xs text-zinc-400">
                  Không tìm thấy biến động nào phù hợp.
                </div>
              )}
            </div>
            </div>

            <div className="px-4 md:px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-[11px] text-zinc-400 font-medium">
                Trang {currentActivityPage} / {activityTotalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivityPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentActivityPage <= 1}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Trước
                </button>

                <div className="flex items-center gap-1">
                  {activityPaginationItems.map((item, index) =>
                    item === 'ellipsis' ? (
                      <span key={`activity-ellipsis-${index}`} className="px-2 text-zinc-400 text-xs font-medium">
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setActivityPage(item)}
                        className={`min-w-9 h-9 px-3 rounded-xl text-xs font-medium transition-colors ${
                          item === currentActivityPage
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() => setActivityPage((prev) => Math.min(activityTotalPages, prev + 1))}
                  disabled={currentActivityPage >= activityTotalPages}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Sau
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ADJUST REPUTATION SCORE MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 py-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-scale-up">
            
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/40 flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-white">Điều chỉnh Điểm Uy tín</h3>
              <button 
                onClick={closeAdjustmentModal}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustReputation} noValidate className="p-6 space-y-5">
              
              {/* Profile Overview */}
              <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800/40">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium text-sm">
                  {selectedStudent.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-medium text-zinc-900 dark:text-white truncate">{selectedStudent.fullName}</h4>
                  <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">{selectedStudent.studentCode}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-zinc-950 dark:text-zinc-100 block tracking-tight">Hiện tại</span>
                  <span className="text-xs font-black text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 px-2 py-0.5 rounded-lg">{selectedStudent.reputationScore}đ</span>
                </div>
              </div>

              {/* Increase / Decrease Toggle */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-medium text-zinc-950 dark:text-zinc-100 tracking-tight block">Loại điều chỉnh</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustmentType('increase');
                      setAdjustmentError(null);
                    }}
                    className={`py-2 px-3 text-xs font-medium rounded-xl transition-all border cursor-pointer ${
                      adjustmentType === 'increase'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    Cộng thêm điểm (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustmentType('decrease');
                      setAdjustmentError(null);
                    }}
                    className={`py-2 px-3 text-xs font-medium rounded-xl transition-all border cursor-pointer ${
                      adjustmentType === 'decrease'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-500'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    Trừ bớt điểm (-)
                  </button>
                </div>
              </div>

              {/* Delta Value */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-medium text-zinc-950 dark:text-zinc-100 tracking-tight block">Số điểm thay đổi</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={adjustmentDelta}
                  onChange={(e) => {
                    setAdjustmentDelta(Number(e.target.value));
                    setAdjustmentError(null);
                  }}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>

              {/* Note / Justification */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-medium text-zinc-950 dark:text-zinc-100 tracking-tight block">Lý do điều chỉnh</span>
                <textarea
                  required
                  rows={3}
                  placeholder="Ghi rõ lý do (ví dụ: Vi phạm quy định giao dịch, Phản hồi tiêu cực từ người mua, Tích cực tham gia sàn...)"
                  value={adjustmentNote}
                  onChange={(e) => {
                    setAdjustmentNote(e.target.value);
                    setAdjustmentError(null);
                  }}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-normal focus:outline-none focus:border-blue-600 transition-colors leading-relaxed resize-none"
                ></textarea>
              </div>

              {adjustmentError && (
                <div className="flex items-start gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-3 py-2.5 text-[11px] text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{adjustmentError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 dark:border-zinc-800/40 pt-4">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`py-2.5 text-xs font-medium text-white rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center justify-center gap-1.5 ${
                    adjustmentType === 'increase'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10'
                      : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/10'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {actionLoading ? 'Đang cập nhật...' : 'Xác nhận thay đổi'}
                </button>
                
                <button
                  type="button"
                  onClick={closeAdjustmentModal}
                  className="py-2.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-300 text-xs font-medium rounded-xl cursor-pointer transition-colors"
                >
                  Hủy bỏ
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </DashboardLayout>
  );
}





