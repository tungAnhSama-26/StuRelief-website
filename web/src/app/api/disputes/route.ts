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

    const disputes = await prisma.disputeCase.findMany({
      where: {
        OR: [
          { initiatorId: payload.id as string },
          { order: { sellerId: payload.id as string } }
        ]
      },
      include: {
        order: {
          include: {
            product: true
          }
        },
        evidences: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedData = disputes.map(d => ({
      id: d.id,
      orderId: d.orderId,
      productName: d.order?.product?.name || 'Unknown Product',
      reason: d.reason,
      status: d.status,
      date: d.createdAt.toISOString()
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Lỗi API disputes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = getAuthToken(cookieStore, request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token, env.JWT_SECRET);
    if (!payload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { orderId, reason } = body;

    const newDispute = await prisma.disputeCase.create({
      data: {
        orderId,
        initiatorId: payload.id as string,
        reason,
        status: 'OPEN'
      }
    });

    return NextResponse.json(newDispute, { status: 201 });
  } catch (error) {
    console.error('Lỗi tạo khiếu nại:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
