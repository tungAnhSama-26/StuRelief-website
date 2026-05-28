import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { env } from '@/infrastructure/config/env';
import prisma from '@/lib/prisma';
import { PrismaItemRepository } from '@/infrastructure/persistence/PrismaItemRepository';
import { GetItemsUseCase } from '@/use-cases/items/GetItemsUseCase';
import { recordAdminActivity } from '@/lib/adminActivityLog';
import { createUserNotification } from '@/lib/notifications';

const itemRepository = new PrismaItemRepository();

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token, env.JWT_SECRET);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '8');
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || 'DRAFT';

    const useCase = new GetItemsUseCase(itemRepository);
    const { items, total } = await useCase.execute(page, limit, { search, status });

    return NextResponse.json({
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
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
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['AVAILABLE', 'HIDDEN'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    await prisma.product.update({
      where: { id },
      data: { status },
    });

    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        sellerId: true,
      },
    });

    await recordAdminActivity({
      userId: payload.id,
      action: status === 'AVAILABLE' ? 'APPROVE_POST' : 'HIDE_POST',
      targetType: 'PRODUCT',
      targetId: id,
      metadata: {
        actionLabel: status === 'AVAILABLE' ? 'DUYỆT BÀI VIẾT' : 'ẨN BÀI VIẾT',
        details: `${status === 'AVAILABLE' ? 'Đã duyệt' : 'Đã ẩn'} bài đăng "${updatedProduct?.name || id}".`,
        severity: status === 'AVAILABLE' ? 'INFO' : 'WARNING',
        productName: updatedProduct?.name || null,
        status,
      },
    });

    if (updatedProduct?.sellerId) {
      await createUserNotification({
        userId: updatedProduct.sellerId,
        title: status === 'AVAILABLE' ? 'Bài đăng của bạn đã được duyệt' : 'Bài đăng của bạn chưa được duyệt',
        content: status === 'AVAILABLE'
          ? `Bài đăng "${updatedProduct.name}" của bạn đã được duyệt và sẽ hiển thị trên hệ thống.`
          : `Bài đăng "${updatedProduct.name}" của bạn chưa được duyệt hoặc đã bị ẩn. Vui lòng kiểm tra lại nội dung.`,
        type: status === 'AVAILABLE' ? 'SYSTEM' : 'ALARM',
        link: `/products/${updatedProduct.id}`,
      });
    }

    const updated = await itemRepository.findById(id);
    return NextResponse.json({ message: 'Success' });
  } catch (error) {
    console.error('Lỗi khi duyệt bài đăng:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token, env.JWT_SECRET);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const orders = await prisma.order.findMany({ where: { productId: id }, select: { id: true } });
    const orderIds = orders.map(o => o.id);

    // Delete all child relations of Orders first to avoid Foreign Key violations
    if (orderIds.length > 0) {
      const disputes = await prisma.disputeCase.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } });
      const disputeIds = disputes.map(d => d.id);
      
      await prisma.$transaction([
        prisma.disputeEvidence.deleteMany({ where: { disputeCaseId: { in: disputeIds } } }),
        prisma.disputeCase.deleteMany({ where: { orderId: { in: orderIds } } }),
        prisma.reviewAttribute.deleteMany({ where: { review: { orderId: { in: orderIds } } } }),
        prisma.review.deleteMany({ where: { orderId: { in: orderIds } } }),
        prisma.orderStatusLog.deleteMany({ where: { orderId: { in: orderIds } } }),
        prisma.orderEvidence.deleteMany({ where: { orderId: { in: orderIds } } }),
        prisma.escrowSession.deleteMany({ where: { orderId: { in: orderIds } } }),
      ]);
    }

    await prisma.$transaction([
      prisma.productMedia.deleteMany({ where: { productId: id } }),
      prisma.productAttribute.deleteMany({ where: { productId: id } }),
      prisma.productSnapshot.deleteMany({ where: { productId: id } }),
      prisma.priceHistory.deleteMany({ where: { productId: id } }),
      prisma.tradeOffer.deleteMany({ where: { productId: id } }),
      prisma.productReservation.deleteMany({ where: { productId: id } }),
      prisma.order.deleteMany({ where: { productId: id } }),
      prisma.wishlist.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    await recordAdminActivity({
      userId: payload.id,
      action: 'DELETE_POST',
      targetType: 'PRODUCT',
      targetId: id,
      metadata: {
        actionLabel: 'XÓA BÀI VIẾT',
        details: `Đã xóa bài đăng "${product.name}".`,
        severity: 'WARNING',
        productName: product.name,
      },
    });

    if (product.sellerId) {
      await createUserNotification({
        userId: product.sellerId,
        title: 'Bài đăng của bạn đã bị xóa',
        content: `Bài đăng "${product.name}" của bạn đã bị xóa bởi quản trị viên do vi phạm quy định hoặc không phù hợp.`,
        type: 'SYSTEM',
      });
    }

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Lỗi khi xóa bài đăng:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
