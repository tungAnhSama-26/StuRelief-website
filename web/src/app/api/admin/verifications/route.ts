import { NextResponse } from 'next/server';
import { PrismaVerificationRepository } from '@/infrastructure/persistence/PrismaVerificationRepository';
import { GetVerificationsUseCase } from '@/use-cases/admin/GetVerificationsUseCase';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { env } from '@/infrastructure/config/env';

const verificationRepository = new PrismaVerificationRepository();

export async function GET(request: Request) {
  try {
    // Basic auth check for admin
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = verifyToken(token, env.JWT_SECRET);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const useCase = new GetVerificationsUseCase(verificationRepository);
    const verifications = await useCase.execute({ status, search });

    return NextResponse.json(verifications);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = verifyToken(token, env.JWT_SECRET);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { id, status, note } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await verificationRepository.updateStatus(id, status, payload.id, note);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
