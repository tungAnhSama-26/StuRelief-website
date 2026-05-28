import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { env } from '@/infrastructure/config/env';
import { getAuthToken } from '@/lib/authHelper';
import { UserRole } from '@shared';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = getAuthToken(cookieStore, request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token, env.JWT_SECRET);
    if (!payload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const members = await prisma.conversationMember.findMany({
      where: { userId: user.id },
      include: {
        conversation: {
          select: {
            lastMessageAt: true
          }
        }
      }
    });
    
    let unreadMessagesCount = 0;
    for (const m of members) {
      if (m.conversation.lastMessageAt > m.lastReadAt) {
        unreadMessagesCount++;
      }
    }

    let pendingApprovalsCount = 0;
    let pendingPostsCount = 0;
    let pendingDisputesCount = 0;

    if (user.role === UserRole.ADMIN) {
      pendingApprovalsCount = await prisma.verificationRequest.count({
        where: { status: 'PENDING' },
      });
      pendingPostsCount = await prisma.product.count({
        where: { status: 'DRAFT' },
      });
      pendingDisputesCount = await prisma.disputeCase.count({
        where: { status: 'OPEN' },
      });
    }

    return NextResponse.json({
      unreadMessages: unreadMessagesCount,
      pendingApprovals: pendingApprovalsCount,
      pendingPosts: pendingPostsCount,
      pendingDisputes: pendingDisputesCount,
    });
  } catch (error) {
    console.error('Lỗi khi fetch badges:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
