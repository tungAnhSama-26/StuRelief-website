import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { env } from '@/infrastructure/config/env';
import { formatRelativeTime, SecurityLogItem } from '@/lib/adminInsights';

function getSeverity(action: string, metadata: Record<string, unknown>) {
  const explicit = metadata.severity as SecurityLogItem['type'] | undefined;
  if (explicit) return explicit;
  if (action.includes('CRITICAL')) return 'CRITICAL';
  if (action.includes('WARNING') || action.includes('CHANGE_PRICE') || action.includes('EDIT')) return 'WARNING';
  return 'INFO';
}

function toActionLabel(action: string, metadata: Record<string, unknown>) {
  if (typeof metadata.actionLabel === 'string') return metadata.actionLabel;

  const map: Record<string, string> = {
    LOGIN: 'ĐĂNG NHẬP',
    DELETE_PRODUCT: 'XÓA TIN',
    CHANGE_PRICE: 'THAY ĐỔI GIÁ ĐỘT NGỘT',
    EDIT_LISTING: 'SỬA TIN MÔ TẢ ĐANG GIAO DỊCH',
    APPROVE_POST: 'DUYỆT BÀI VIẾT',
    HIDE_POST: 'ẨN BÀI VIẾT',
    VERIFICATION_REQUEST: 'XÁC THỰC THÀNH VIÊN',
    DISPUTE_REVIEW: 'ĐỐI SOÁT TRANH CHẤP',
    SUSPICIOUS_EDIT: 'SỬA TIN MÔ TẢ ĐANG GIAO DỊCH',
    ADJUST_REPUTATION: 'ĐIỀU CHỈNH ĐIỂM UY TÍN',
    SYSTEM_PENALTY: 'TRỪ ĐIỂM UY TÍN',
    ORDER_STATUS_UPDATE: 'CẬP NHẬT TRẠNG THÁI ĐƠN',
  };

  return map[action] ?? action.replace(/_/g, ' ');
}

function toDetails(action: string, metadata: Record<string, unknown>) {
  if (typeof metadata.details === 'string') return metadata.details;
  if (typeof metadata.note === 'string') return metadata.note;

  switch (action) {
    case 'LOGIN':
      return 'Người dùng đăng nhập vào hệ thống.';
    case 'DELETE_PRODUCT':
      return 'Sản phẩm bị xoá khỏi danh sách hiển thị.';
    case 'CHANGE_PRICE':
      return 'Giá sản phẩm thay đổi bất thường.';
    case 'VERIFICATION_REQUEST':
      return 'Tải lên ảnh thẻ sinh viên và nhập email trường yêu cầu duyệt quyền truy cập.';
    case 'EDIT_LISTING':
    case 'SUSPICIOUS_EDIT':
      return 'Chỉnh sửa mô tả hoặc thông tin khi giao dịch đang diễn ra.';
    case 'APPROVE_POST':
      return 'Bài đăng mới đã được duyệt hiển thị trên hệ thống.';
    case 'HIDE_POST':
      return 'Bài đăng bị ẩn khỏi danh sách hiển thị.';
    case 'ADJUST_REPUTATION':
    case 'SYSTEM_PENALTY':
      return 'Điểm uy tín của sinh viên đã được điều chỉnh.';
    case 'ORDER_STATUS_UPDATE':
      return 'Trạng thái đơn hàng đã được cập nhật.';
    default:
      return 'Có thay đổi quan trọng trong hệ thống cần theo dõi.';
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token, env.JWT_SECRET);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 20), 1), 50);

    const [activityRows, verificationRows, disputeRows, reputationRows, orderStatusRows] = await Promise.all([
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.verificationRequest.findMany({
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(limit / 2),
      }),
      prisma.disputeCase.findMany({
        include: {
          evidences: true,
          order: {
            include: {
              product: {
                include: {
                  snapshots: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(limit / 2),
      }),
      prisma.reputationRecord.findMany({
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.orderStatusLog.findMany({
        include: {
          order: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(limit / 2),
      }),
    ]);

    const activityUserIds = [...new Set(activityRows.map((row) => row.userId).filter(Boolean) as string[])];
    const activityUsers = activityUserIds.length
      ? await prisma.user.findMany({
          where: { id: { in: activityUserIds } },
          include: { profile: true },
        })
      : [];
    const activityUserMap = new Map(activityUsers.map((user) => [user.id, user]));

    const activityLogs: SecurityLogItem[] = activityRows.map((row) => {
      const metadata = (row.metadata ?? {}) as Record<string, unknown>;
      const user = row.userId ? activityUserMap.get(row.userId) : null;

      return {
        id: row.id,
        userEmail: (metadata.userEmail as string) || user?.email || 'system@stu-relief.local',
        action: toActionLabel(row.action, metadata),
        details: toDetails(row.action, metadata),
        type: getSeverity(row.action, metadata),
        timestamp: formatRelativeTime(row.createdAt),
        createdAt: row.createdAt.toISOString(),
      };
    });

    const verificationLogs: SecurityLogItem[] = verificationRows.map((request) => ({
      id: `verification-${request.id}`,
      userEmail: request.user.email,
      action: 'XÁC THỰC THÀNH VIÊN',
      details:
        request.status === 'APPROVED'
          ? 'Hồ sơ xác thực sinh viên đã được duyệt.'
          : request.status === 'REJECTED'
            ? 'Hồ sơ xác thực sinh viên bị từ chối vì thiếu hoặc sai thông tin.'
            : 'Tải lên ảnh thẻ sinh viên và nhập email trường yêu cầu duyệt quyền truy cập.',
      type: request.status === 'REJECTED' ? 'WARNING' : 'INFO',
      timestamp: formatRelativeTime(request.createdAt),
      createdAt: request.createdAt.toISOString(),
    }));

    const disputeUserIds = [...new Set(
      disputeRows.flatMap((dispute) => [dispute.initiatorId, dispute.order.buyerId, dispute.order.sellerId])
    )];
    const disputeUsers = disputeUserIds.length
      ? await prisma.user.findMany({
          where: { id: { in: disputeUserIds } },
          include: { profile: true },
        })
      : [];
    const disputeUserMap = new Map(disputeUsers.map((user) => [user.id, user]));

    const disputeLogs: SecurityLogItem[] = disputeRows.map((dispute) => {
      const seller = disputeUserMap.get(dispute.order.sellerId);
      const product = dispute.order.product;
      const originalSnapshot = product.snapshots.find((snapshot) => snapshot.versionName === 'ORIGINAL_DEAL');
      const originalData = (originalSnapshot?.data ?? {}) as Record<string, unknown>;
      const previousPrice = Number(originalData.price ?? product.currentPrice);
      const currentPrice = Number(dispute.order.finalPrice || product.currentPrice);
      const priceChanged = Number.isFinite(previousPrice) && Number.isFinite(currentPrice) && previousPrice !== currentPrice;
      const descriptionChanged =
        typeof originalData.description === 'string' &&
        originalData.description.trim() !== product.description.trim();

      const isPriceAnomaly = priceChanged && Math.abs(previousPrice - currentPrice) / Math.max(previousPrice, 1) >= 0.2;
      const isCriticalEdit = descriptionChanged || /mô tả|ram|linh kiện|tráo/i.test(dispute.reason);

      return {
        id: `dispute-${dispute.id}`,
        userEmail: seller?.email || 'student@edu.vn',
        action: isPriceAnomaly ? 'THAY ĐỔI GIÁ ĐỘT NGỘT' : 'SỬA TIN MÔ TẢ ĐANG GIAO DỊCH',
        details: isPriceAnomaly
          ? `Sản phẩm "${product.name}" thay đổi giá từ ${previousPrice.toLocaleString('vi-VN')} đ xuống ${currentPrice.toLocaleString('vi-VN')} đ trong khi giao dịch đang giữ chỗ.`
          : `Chỉnh sửa mô tả của "${product.name}" khi đơn ${dispute.orderId} đang ở trạng thái xử lý. ${dispute.reason}`,
        type: isPriceAnomaly ? 'WARNING' : (isCriticalEdit ? 'CRITICAL' : 'WARNING'),
        timestamp: formatRelativeTime(dispute.createdAt),
        createdAt: dispute.createdAt.toISOString(),
      };
    });

    const reputationLogs: SecurityLogItem[] = reputationRows.map((record) => {
      const delta = Number(record.delta);
      const isNegative = delta < 0;
      const isCriticalPenalty = isNegative && Math.abs(delta) >= 20;

      return {
        id: `reputation-${record.id}`,
        userEmail: record.user.email,
        action: isNegative ? 'TRỪ ĐIỂM UY TÍN' : 'CỘNG ĐIỂM UY TÍN',
        details:
          record.note ||
          `${isNegative ? 'Trừ' : 'Cộng'} ${Math.abs(delta).toLocaleString('vi-VN')} điểm uy tín cho sinh viên.`,
        type: isNegative ? (isCriticalPenalty ? 'CRITICAL' : 'WARNING') : 'INFO',
        timestamp: formatRelativeTime(record.createdAt),
        createdAt: record.createdAt.toISOString(),
      };
    });

    const orderStatusLogs: SecurityLogItem[] = orderStatusRows.map((row) => {
      const status = row.status;
      const productName = row.order.product?.name || 'Đơn hàng';
      const isImportant = status === 'CANCELLED' || status === 'DISPUTED';

      return {
        id: `order-status-${row.id}`,
        userEmail: 'system@stu-relief.local',
        action: 'CẬP NHẬT TRẠNG THÁI ĐƠN',
        details: `${productName} đã chuyển sang trạng thái ${status}${row.note ? `. ${row.note}` : '.'}`,
        type: isImportant ? 'WARNING' : 'INFO',
        timestamp: formatRelativeTime(row.createdAt),
        createdAt: row.createdAt.toISOString(),
      };
    });

    const logs = [...activityLogs, ...verificationLogs, ...disputeLogs, ...reputationLogs, ...orderStatusLogs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    const summary = {
      critical: logs.filter((log) => log.type === 'CRITICAL').length,
      warning: logs.filter((log) => log.type === 'WARNING').length,
      info: logs.filter((log) => log.type === 'INFO').length,
    };

    return NextResponse.json({ logs, summary });
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
