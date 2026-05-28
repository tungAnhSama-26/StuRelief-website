export type MonthTabKey = 'current' | 'previous';

export interface MonthlyActivityWeek {
  week: number;
  label: string;
  successfulTransactions: number;
  approvedPosts: number;
  total: number;
}

export interface MonthlyActivitySeries {
  key: MonthTabKey;
  label: string;
  range: {
    start: string;
    end: string;
  };
  weeks: MonthlyActivityWeek[];
  totals: {
    successfulTransactions: number;
    approvedPosts: number;
    total: number;
  };
}

export interface SecurityLogItem {
  id: string;
  userEmail: string;
  action: string;
  details: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL';
  timestamp: string;
  createdAt: string;
}

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

export function getMonthRange(referenceDate: Date, monthOffset = 0): DateRange {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + monthOffset, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + monthOffset + 1, 1);
  end.setHours(0, 0, 0, 0);

  return {
    start,
    end,
    label:
      monthOffset === 0
        ? 'Tháng này'
        : monthOffset === -1
          ? 'Tháng trước'
          : `Tháng ${start.getMonth() + 1}`,
  };
}

export function formatRelativeTime(value: Date | string, referenceDate = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const diff = Math.max(0, referenceDate.getTime() - date.getTime());

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;

  return date.toLocaleDateString('vi-VN');
}

export function buildMonthlyActivitySeries(params: {
  key: MonthTabKey;
  label: string;
  range: DateRange;
  orders: Array<{ updatedAt: Date; status: string }>;
  products: Array<{ updatedAt: Date; status: string }>;
}): MonthlyActivitySeries {
  const weeks: MonthlyActivityWeek[] = Array.from({ length: 4 }, (_, index) => ({
    week: index + 1,
    label: `Tuần ${index + 1}`,
    successfulTransactions: 0,
    approvedPosts: 0,
    total: 0,
  }));

  const totals = {
    successfulTransactions: 0,
    approvedPosts: 0,
    total: 0,
  };

  const incrementWeek = (date: Date, field: 'successfulTransactions' | 'approvedPosts') => {
    if (date < params.range.start || date >= params.range.end) return;

    const weekIndex = Math.min(3, Math.floor((date.getDate() - 1) / 7));
    weeks[weekIndex][field] += 1;
    weeks[weekIndex].total += 1;
    totals[field] += 1;
    totals.total += 1;
  };

  params.orders
    .filter((order) => order.status === 'SUCCESS')
    .forEach((order) => incrementWeek(order.updatedAt, 'successfulTransactions'));

  params.products
    .filter((product) => product.status === 'AVAILABLE')
    .forEach((product) => incrementWeek(product.updatedAt, 'approvedPosts'));

  return {
    key: params.key,
    label: params.label,
    range: {
      start: params.range.start.toISOString(),
      end: params.range.end.toISOString(),
    },
    weeks,
    totals,
  };
}
