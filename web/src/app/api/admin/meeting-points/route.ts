import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { env } from '@/infrastructure/config/env';
import { recordAdminActivity } from '@/lib/adminActivityLog';

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) {
    return null;
  }

  const payload = verifyToken(token, env.JWT_SECRET);
  if (!payload || payload.role !== 'ADMIN') {
    return null;
  }

  return payload;
}

export async function GET() {
  try {
    const payload = await requireAdmin();
    if (!payload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [meetingPoints, campuses, universities] = await Promise.all([
      prisma.meetingPoint.findMany({
        orderBy: [{ isSafeZone: 'desc' }, { name: 'asc' }],
        include: {
          campus: {
            select: {
              id: true,
              name: true,
              address: true,
              university: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.campus.findMany({
        orderBy: [{ university: { name: 'asc' } }, { name: 'asc' }],
        include: {
          university: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.university.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
    ]);

    return NextResponse.json({
      data: meetingPoints.map((meetingPoint) => ({
        id: meetingPoint.id,
        name: meetingPoint.name,
        description: meetingPoint.description,
        photoUrl: meetingPoint.photoUrl,
        isSafeZone: meetingPoint.isSafeZone,
        campusId: meetingPoint.campusId,
        campusName: meetingPoint.campus.name,
        campusAddress: meetingPoint.campus.address,
        universityName: meetingPoint.campus.university.name,
      })),
      campuses: campuses.map((campus) => ({
        id: campus.id,
        name: campus.name,
        address: campus.address,
        universityId: campus.university.id,
        universityName: campus.university.name,
      })),
      universities,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await requireAdmin();
    if (!payload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const photoUrl = typeof body.photoUrl === 'string' ? body.photoUrl.trim() : '';
    const campusId = typeof body.campusId === 'string' ? body.campusId.trim() : '';
    const isSafeZone = Boolean(body.isSafeZone);

    if (!name || !campusId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const campus = await prisma.campus.findUnique({
      where: { id: campusId },
      include: {
        university: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!campus) {
      return NextResponse.json({ error: 'Campus not found' }, { status: 404 });
    }

    const meetingPoint = await prisma.meetingPoint.create({
      data: {
        name,
        description: description || null,
        photoUrl: photoUrl || null,
        campusId,
        isSafeZone,
      },
      include: {
        campus: {
          select: {
            name: true,
            address: true,
            university: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    await recordAdminActivity({
      userId: payload.id,
      action: 'CREATE_MEETING_POINT',
      targetType: 'MEETING_POINT',
      targetId: meetingPoint.id,
      metadata: {
        actionLabel: 'TẠO ĐIỂM HẸN GIAO DỊCH',
        details: `Đã tạo điểm hẹn "${meetingPoint.name}" cho ${campus.name} - ${campus.university.name}.`,
        severity: 'INFO',
        meetingPointName: meetingPoint.name,
        campusName: campus.name,
        universityName: campus.university.name,
      },
    });

    return NextResponse.json({
      id: meetingPoint.id,
      name: meetingPoint.name,
      description: meetingPoint.description,
      photoUrl: meetingPoint.photoUrl,
      isSafeZone: meetingPoint.isSafeZone,
      campusId: meetingPoint.campusId,
      campusName: meetingPoint.campus.name,
      campusAddress: meetingPoint.campus.address,
      universityName: meetingPoint.campus.university.name,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
