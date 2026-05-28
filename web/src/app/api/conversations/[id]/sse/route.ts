import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { env } from '@/infrastructure/config/env';
import { getAuthToken } from '@/lib/authHelper';
import { sseEmitter } from '@/lib/sse';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await context.params;
    const cookieStore = await cookies();
    const token = getAuthToken(cookieStore, request);
    if (!token) return new Response('Unauthorized', { status: 401 });

    const payload = verifyToken(token, env.JWT_SECRET);
    if (!payload) return new Response('Forbidden', { status: 403 });

    const currentUserId = payload.id;

    const member = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId: currentUserId,
      },
    });

    if (!member) {
      return new Response('Forbidden', { status: 403 });
    }

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        // Gửi sự kiện kết nối thành công ban đầu
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

        // Lắng nghe sự kiện có tin nhắn mới cho conversationId này
        const eventName = `new_message_${conversationId}`;
        
        const onMessage = (message: any) => {
          try {
            // Đẩy dữ liệu qua SSE
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'new_message', message })}\n\n`));
          } catch (e) {
            // Xử lý lỗi nếu stream bị đóng
            console.error('Lỗi khi gửi SSE', e);
          }
        };

        sseEmitter.on(eventName, onMessage);

        // Xóa listener khi client ngắt kết nối
        request.signal.addEventListener('abort', () => {
          sseEmitter.off(eventName, onMessage);
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('SSE Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
