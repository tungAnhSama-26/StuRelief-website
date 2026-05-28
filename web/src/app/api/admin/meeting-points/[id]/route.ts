import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { env } from '@/infrastructure/config/env';

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token, env.JWT_SECRET);
  if (!payload || payload.role !== 'ADMIN') return null;
  return payload;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireAdmin();
    if (!payload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    const body = await request.json();
    
    const updated = await prisma.meetingPoint.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        photoUrl: body.photoUrl,
        isSafeZone: body.isSafeZone,
        campusId: body.campusId,
      }
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireAdmin();
    if (!payload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    await prisma.meetingPoint.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
