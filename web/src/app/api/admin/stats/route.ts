import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { env } from '@/infrastructure/config/env';
import { buildMonthlyActivitySeries, getMonthRange } from '@/lib/adminInsights';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = verifyToken(token, env.JWT_SECRET);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const now = new Date();
    const currentRange = getMonthRange(now, 0);
    const previousRange = getMonthRange(now, -1);

    const [
      verifiedStudents,
      totalProducts,
      pendingDisputes,
      safeHubs,
      pendingProductPosts,
      currentMonthOrders,
      previousMonthOrders,
      currentMonthProducts,
      previousMonthProducts,
    ] = await Promise.all([
      prisma.user.count({ where: { status: 'VERIFIED', role: 'STUDENT' } }),
      prisma.product.count({ where: { status: 'AVAILABLE' } }),
      prisma.disputeCase.count({ where: { status: { in: ['OPEN', 'PENDING', 'INVESTIGATING', 'UNDER_INVESTIGATION'] } } }),
      prisma.meetingPoint.count({ where: { isSafeZone: true } }),
      prisma.product.count({ where: { status: 'DRAFT' } }),
      prisma.order.findMany({
        where: {
          status: 'SUCCESS',
          updatedAt: { gte: currentRange.start, lt: currentRange.end },
        },
        select: {
          status: true,
          updatedAt: true,
        },
      }),
      prisma.order.findMany({
        where: {
          status: 'SUCCESS',
          updatedAt: { gte: previousRange.start, lt: previousRange.end },
        },
        select: {
          status: true,
          updatedAt: true,
        },
      }),
      prisma.product.findMany({
        where: {
          status: 'AVAILABLE',
          updatedAt: { gte: currentRange.start, lt: currentRange.end },
        },
        select: {
          status: true,
          updatedAt: true,
        },
      }),
      prisma.product.findMany({
        where: {
          status: 'AVAILABLE',
          updatedAt: { gte: previousRange.start, lt: previousRange.end },
        },
        select: {
          status: true,
          updatedAt: true,
        },
      }),
    ]);

    const chart = {
      current: buildMonthlyActivitySeries({
        key: 'current',
        label: currentRange.label,
        range: currentRange,
        orders: currentMonthOrders,
        products: currentMonthProducts,
      }),
      previous: buildMonthlyActivitySeries({
        key: 'previous',
        label: previousRange.label,
        range: previousRange,
        orders: previousMonthOrders,
        products: previousMonthProducts,
      }),
    };

    return NextResponse.json({
      verifiedStudents,
      totalProducts,
      pendingDisputes,
      safeHubs,
      pendingProductPosts,
      chart,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
