import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { env } from '@/infrastructure/config/env';
import { getAuthToken } from '@/lib/authHelper';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = getAuthToken(cookieStore, request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token, env.JWT_SECRET);
    if (!payload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { sellerId, productId } = await request.json();
    if (!sellerId) {
      return NextResponse.json({ error: 'Missing sellerId' }, { status: 400 });
    }

    const currentUserId = payload.id;

    if (currentUserId === sellerId) {
      return NextResponse.json({ error: 'Cannot chat with yourself' }, { status: 400 });
    }

    // Tìm xem cuộc hội thoại liên quan đến sản phẩm này giữa 2 người dùng đã tồn tại chưa
    let conversation = await prisma.conversation.findFirst({
      where: {
        productId: productId || null,
        AND: [
          { members: { some: { userId: currentUserId } } },
          { members: { some: { userId: sellerId } } },
        ],
      },
      include: {
        members: true,
      },
    });

    if (!conversation) {
      // Nếu chưa có, tạo cuộc hội thoại mới cùng 2 thành viên
      conversation = await prisma.conversation.create({
        data: {
          productId: productId || null,
          title: null,
          members: {
            create: [
              { userId: currentUserId },
              { userId: sellerId },
            ],
          },
        },
        include: {
          members: true,
        },
      });
    }

    return NextResponse.json({ conversationId: conversation.id });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = getAuthToken(cookieStore, request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token, env.JWT_SECRET);
    if (!payload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const currentUserId = payload.id;

    // Lấy tất cả các cuộc hội thoại mà user hiện tại tham gia
    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: { userId: currentUserId },
        },
      },
      include: {
        members: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    // Populate thông tin người chat cùng và sản phẩm
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherMember = conv.members.find((m) => m.userId !== currentUserId);
        const otherUserId = otherMember?.userId;

        let otherUser = null;
        if (otherUserId) {
          otherUser = await prisma.user.findUnique({
            where: { id: otherUserId },
            include: { profile: true },
          });
        }

        let product = null;
        if (conv.productId) {
          product = await prisma.product.findUnique({
            where: { id: conv.productId },
            include: {
              media: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          });
        }

        return {
          id: conv.id,
          productId: conv.productId,
          lastMessageAt: conv.lastMessageAt.toISOString(),
          createdAt: conv.createdAt.toISOString(),
          otherUser: otherUser
            ? {
                id: otherUser.id,
                email: otherUser.email,
                fullName: otherUser.profile?.fullName || 'Người dùng StuRelief',
                avatarUrl: otherUser.profile?.avatarUrl || null,
              }
            : null,
          product: product
            ? {
                id: product.id,
                name: product.name,
                price: product.currentPrice,
                imageUrl: product.media[0]?.url || null,
                sellerId: product.sellerId,
                status: product.status,
              }
            : null,
          lastMessage: conv.messages[0]
            ? {
                id: conv.messages[0].id,
                senderId: conv.messages[0].senderId,
                content: conv.messages[0].content,
                createdAt: conv.messages[0].createdAt.toISOString(),
              }
            : null,
        };
      })
    );

    return NextResponse.json({ conversations: populatedConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
