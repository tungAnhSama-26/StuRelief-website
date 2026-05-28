import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { emails } = await request.json();
    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json({ avatars: {} }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: {
        email: { in: emails },
      },
      select: {
        email: true,
        profile: {
          select: {
            avatarUrl: true,
          },
        },
      },
    });

    const avatars: Record<string, string | null> = {};
    users.forEach((u) => {
      avatars[u.email] = u.profile?.avatarUrl || null;
    });

    return NextResponse.json({ avatars });
  } catch (error) {
    console.error('[Google Avatars API] Error:', error);
    return NextResponse.json({ avatars: {} });
  }
}
