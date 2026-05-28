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

export async function POST(request: Request) {
  try {
    const payload = await requireAdmin();
    if (!payload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const address = typeof body.address === 'string' ? body.address.trim() : '';
    let universityId = typeof body.universityId === 'string' ? body.universityId.trim() : '';
    const universityName = typeof body.universityName === 'string' ? body.universityName.trim() : '';

    if (!name || (!universityId && !universityName)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let university;
    if (universityId) {
      university = await prisma.university.findUnique({
        where: { id: universityId },
      });
    } else if (universityName) {
      // Find by name, case-insensitive if possible, but exact match for now
      university = await prisma.university.findFirst({
        where: { name: universityName },
      });
      // If not found, create it!
      if (!university) {
        university = await prisma.university.create({
          data: { name: universityName },
        });
      }
      universityId = university.id;
    }

    if (!university) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 });
    }

    const campus = await prisma.campus.create({
      data: {
        name,
        address: address || null,
        universityId,
      },
      include: {
        university: {
          select: {
            name: true,
          },
        },
      },
    });

    await recordAdminActivity({
      userId: payload.id,
      action: 'CREATE_CAMPUS',
      targetType: 'CAMPUS',
      targetId: campus.id,
      metadata: {
        actionLabel: 'TẠO CAMPUS',
        details: `Đã tạo campus "${campus.name}" cho ${campus.university.name}.`,
        severity: 'INFO',
        campusName: campus.name,
        universityName: campus.university.name,
      },
    });

    return NextResponse.json({
      id: campus.id,
      name: campus.name,
      address: campus.address,
      universityId: campus.universityId,
      universityName: campus.university.name,
    });
  } catch (error) {
    console.error('Error creating campus:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
