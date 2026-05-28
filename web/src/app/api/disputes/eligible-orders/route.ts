import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { env } from '@/infrastructure/config/env';
import { getAuthToken } from '@/lib/authHelper';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = getAuthToken(cookieStore, request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token, env.JWT_SECRET);
    if (!payload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { buyerId: payload.id as string },
          { sellerId: payload.id as string }
        ],
        dispute: null // Chỉ lấy đơn hàng chưa bị khiếu nại
      },
      include: {
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedData = orders.map(o => ({
      id: o.id,
      productName: o.product?.name || 'Unknown Product',
      role: o.buyerId === payload.id ? 'BUYER' : 'SELLER',
      createdAt: o.createdAt.toISOString(),
      status: o.status
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Lỗi API eligible orders:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
