import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { env } from '@/infrastructure/config/env';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = verifyToken(token, env.JWT_SECRET);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // 1. Fetch all student users and their reputation scores
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT'
      },
      include: {
        profile: true
      },
      orderBy: {
        reputationScore: 'desc'
      }
    });

    const studentList = students.map(student => ({
      id: student.id,
      fullName: student.profile?.fullName || 'Sinh viên',
      email: student.email,
      studentCode: student.profile?.studentCode || 'SV' + student.id.slice(0, 4).toUpperCase(),
      reputationScore: student.reputationScore,
      status: student.status,
      avatarUrl: student.profile?.avatarUrl
    }));

    // 2. Fetch recent reputation activity logs
    const reputationLogs = await prisma.reputationRecord.findMany({
      include: {
        user: {
          include: {
            profile: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    const activityLogs = reputationLogs.map(log => ({
      id: log.id,
      userId: log.userId,
      studentName: log.user.profile?.fullName || 'Sinh viên',
      studentCode: log.user.profile?.studentCode || 'N/A',
      delta: log.delta,
      actionType: log.actionType,
      note: log.note || '',
      createdAt: log.createdAt
    }));

    // 3. Fetch recent reviews / feedbacks
    const reviews = await prisma.review.findMany({
      include: {
        order: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    const feedbacks = await Promise.all(
      reviews.map(async (review) => {
        const reviewer = await prisma.user.findUnique({
          where: { id: review.reviewerId },
          include: { profile: true }
        });
        const reviewed = await prisma.user.findUnique({
          where: { id: review.reviewedId },
          include: { profile: true }
        });

        return {
          id: review.id,
          orderId: review.orderId,
          rating: review.rating,
          body: review.body || '',
          imageUrl: review.imageUrl,
          reviewerName: reviewer?.profile?.fullName || 'Người mua',
          reviewerAvatar: reviewer?.profile?.avatarUrl,
          reviewedName: reviewed?.profile?.fullName || 'Người bán',
          reviewedAvatar: reviewed?.profile?.avatarUrl,
          productName: review.order.product.name,
          createdAt: review.createdAt
        };
      })
    );

    return NextResponse.json({
      students: studentList,
      activities: activityLogs,
      feedbacks: feedbacks
    });
  } catch (error) {
    console.error('Error fetching reputations statistics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = verifyToken(token, env.JWT_SECRET);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { userId, delta, note } = body;

    if (!userId || delta === undefined || !note) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Adjust user reputation score
    await prisma.user.update({
      where: { id: userId },
      data: {
        reputationScore: {
          increment: Number(delta)
        }
      }
    });

    // Create reputation record log
    const record = await prisma.reputationRecord.create({
      data: {
        userId,
        delta: Number(delta),
        actionType: 'ADMIN_ADJUSTMENT',
        note: `[Admin Điều chỉnh] ${note}`
      }
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('Error adjusting user reputation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
