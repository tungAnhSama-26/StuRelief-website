import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { env } from '@/infrastructure/config/env';
import { getAuthToken } from '@/lib/authHelper';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await context.params;
    const cookieStore = await cookies();
    const token = getAuthToken(cookieStore, request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token, env.JWT_SECRET);
    if (!payload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const currentUserId = payload.id;
    const { rating, body, imageUrl } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // 1. Tìm sản phẩm để lấy thông tin người bán và giá
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const sellerId = product.sellerId;

    if (currentUserId === sellerId) {
      return NextResponse.json({ error: 'You cannot review your own listing' }, { status: 400 });
    }

    // 2. Tìm hoặc tự động tạo Đơn hàng giả lập (Order) để liên kết với Review
    let order = await prisma.order.findFirst({
      where: {
        productId,
        buyerId: currentUserId,
        sellerId,
      },
    });

    if (!order) {
      order = await prisma.order.create({
        data: {
          productId,
          buyerId: currentUserId,
          sellerId,
          finalPrice: product.currentPrice,
          status: 'SUCCESS',
          paymentType: 'CASH',
        },
      });
    }

    // 3. Tạo Review và cập nhật Uy tín (Reputation) cho người bán
    const review = await prisma.review.create({
      data: {
        orderId: order.id,
        reviewerId: currentUserId,
        reviewedId: sellerId,
        rating: Number(rating),
        body: body || '',
        imageUrl: imageUrl || null,
      },
    });

    // 4. Cộng điểm uy tín (+10) cho người bán và ghi vào lịch sử
    await prisma.$transaction([
      prisma.reputationRecord.create({
        data: {
          userId: sellerId,
          delta: 10,
          actionType: 'REPUTABLE_FEEDBACK',
          referenceId: order.id,
          note: `Nhận đánh giá tích cực (${rating} sao) cho sản phẩm "${product.name}"`,
        },
      }),
      prisma.user.update({
        where: { id: sellerId },
        data: {
          reputationScore: {
            increment: 10,
          },
        },
      }),
    ]);

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
// Trigger hot reload 2
