import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { env } from '@/infrastructure/config/env';
import { getAuthToken } from '@/lib/authHelper';
import { sseEmitter } from '@/lib/sse';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await context.params;
    const cookieStore = await cookies();
    const token = getAuthToken(cookieStore, request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token, env.JWT_SECRET);
    if (!payload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const currentUserId = payload.id;

    // Xác nhận user có thuộc cuộc hội thoại này hay không
    const member = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId: currentUserId,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.conversationMember.update({
      where: { id: member.id },
      data: { lastReadAt: new Date() }
    });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      senderId: msg.senderId,
      content: msg.content,
      type: msg.type,
      metadata: msg.metadata,
      createdAt: msg.createdAt.toISOString(),
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await context.params;
    const cookieStore = await cookies();
    const token = getAuthToken(cookieStore, request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token, env.JWT_SECRET);
    if (!payload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const currentUserId = payload.id;
    const { content, type = 'TEXT', metadata } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Xác nhận user thuộc cuộc hội thoại
    const member = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId: currentUserId,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Tạo tin nhắn mới và cập nhật thời gian tin nhắn cuối cùng trong Conversation
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId: currentUserId,
          content: content.trim(),
          type: type,
          metadata: metadata || null,
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
      prisma.conversationMember.update({
        where: { id: member.id },
        data: { lastReadAt: new Date() },
      }),
    ]);

    const messageResponse = {
      id: message.id,
      senderId: message.senderId,
      content: message.content,
      type: message.type,
      metadata: message.metadata,
      createdAt: message.createdAt.toISOString(),
    };

    // Bắn sự kiện SSE cho tất cả client đang kết nối tới hội thoại này
    sseEmitter.emit(`new_message_${conversationId}`, messageResponse);

    return NextResponse.json({
      message: messageResponse
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
