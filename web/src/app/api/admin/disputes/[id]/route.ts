import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { env } from '@/infrastructure/config/env';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = verifyToken(token, env.JWT_SECRET);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { action, penaltyPoints = 20 } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    // Fetch dispute details to get order and seller ID
    const dispute = await prisma.disputeCase.findUnique({
      where: { id },
      include: {
        order: true
      }
    });

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute case not found' }, { status: 404 });
    }

    const sellerId = dispute.order.sellerId;

    if (action === 'RESOLVED') {
      // 1. Update dispute status to RESOLVED
      await prisma.disputeCase.update({
        where: { id },
        data: { status: 'RESOLVED' }
      });

      // 2. Update order status to CANCELLED (as a system refund resolution for buyer protection)
      await prisma.order.update({
        where: { id: dispute.orderId },
        data: { status: 'CANCELLED' }
      });

      // 3. System penalty: deduct reputation points from fraudulent seller
      if (penaltyPoints > 0) {
        await prisma.reputationRecord.create({
          data: {
            userId: sellerId,
            delta: -penaltyPoints,
            actionType: 'SYSTEM_PENALTY',
            referenceId: id,
            note: `Bị trừ ${penaltyPoints} điểm uy tín do vi phạm tranh chấp mã giao dịch #${dispute.orderId}`
          }
        });

        await prisma.user.update({
          where: { id: sellerId },
          data: {
            reputationScore: {
              decrement: penaltyPoints
            }
          }
        });
      }
    } else if (action === 'INVESTIGATING') {
      // Update dispute status to INVESTIGATING
      await prisma.disputeCase.update({
        where: { id },
        data: { status: 'INVESTIGATING' }
      });
    }

    return NextResponse.json({ success: true, status: action });
  } catch (error) {
    console.error('Error updating dispute:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
