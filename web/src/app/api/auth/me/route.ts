import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { env } from '@/infrastructure/config/env';
import prisma from '@/lib/prisma';
import { getAuthToken } from '@/lib/authHelper';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = getAuthToken(cookieStore, request);

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const payload = verifyToken(token, env.JWT_SECRET);
    if (!payload) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Fetch the latest user status and verification requests from DB
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { 
        status: true,
        verificationRequests: {
          where: { status: 'PENDING' },
          take: 1
        }
      },
    });

    return NextResponse.json({
      user: {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        fullName: payload.fullName,
        avatarUrl: payload.avatarUrl || null,
        status: dbUser?.status || 'UNVERIFIED',
        hasPendingVerification: dbUser?.verificationRequests && dbUser.verificationRequests.length > 0
      },
    }, { status: 200 });
  } catch {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
