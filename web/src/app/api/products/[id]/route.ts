import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaItemRepository } from '@/infrastructure/persistence/PrismaItemRepository';
import { GetItemDetailUseCase } from '@/use-cases/items/GetItemDetailUseCase';
import { UpdateItemUseCase } from '@/use-cases/items/UpdateItemUseCase';
import { DeleteItemUseCase } from '@/use-cases/items/DeleteItemUseCase';
import { verifyToken } from '@/lib/jwt';
import { env } from '@/infrastructure/config/env';
import prisma from '@/lib/prisma';
import { createUserNotification, notifyAdmins } from '@/lib/notifications';
import { getAuthToken } from '@/lib/authHelper';

const itemRepository = new PrismaItemRepository();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const useCase = new GetItemDetailUseCase(itemRepository);
    const item = await useCase.execute(id);

    if (item.status !== 'AVAILABLE') {
      const cookieStore = await cookies();
      const token = getAuthToken(cookieStore, request);
      const payload = token ? verifyToken(token, env.JWT_SECRET) : null;

      if (!payload || (payload.role !== 'ADMIN' && payload.id !== item.studentId)) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
    }

    return NextResponse.json(item);
  } catch (error: any) {
    if (error.message === 'Item not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 1. Kiểm tra phân quyền Server-side bằng JWT Cookie
    const cookieStore = await cookies();
    const token = getAuthToken(cookieStore, request);
    if (token) {
      const payload = verifyToken(token, env.JWT_SECRET);
      if (payload) {
        // Tìm sản phẩm trong DB để đối chiếu người sở hữu
        const product = await prisma.product.findUnique({
          where: { id },
        });
        if (product && product.sellerId !== payload.id && payload.role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Bạn không có quyền chỉnh sửa sản phẩm của sinh viên khác!' },
            { status: 403 }
          );
        }

        body.status = payload.role === 'ADMIN' ? body.status ?? product?.status : 'DRAFT';
      }
    }

    const useCase = new UpdateItemUseCase(itemRepository);
    const updatedItem = await useCase.execute(id, body);

    // Notify if student updated the post
    if (token) {
      const payload = verifyToken(token, env.JWT_SECRET);
      if (payload && payload.role !== 'ADMIN') {
        // Student gets notified
        await createUserNotification({
          userId: payload.id,
          title: 'Cập nhật bài đăng',
          content: `Bài đăng "${updatedItem.name}" đã được cập nhật và đang chờ admin duyệt lại.`,
          type: 'SYSTEM',
          link: `/products/${updatedItem.id}`,
        });
        
        // Admins get notified
        const user = await prisma.user.findUnique({
          where: { id: payload.id },
          include: { profile: true },
        });
        await notifyAdmins({
          title: 'Bài đăng được cập nhật',
          content: `${user?.profile?.fullName || 'Một sinh viên'} vừa cập nhật bài đăng "${updatedItem.name}" và đang chờ duyệt lại.`,
          type: 'SYSTEM',
          link: `/admin/posts`,
        });
      }
    }

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error updating product' },
      { status: error.message?.includes('required') || error.message?.includes('Price') ? 400 : 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Kiểm tra phân quyền Server-side bằng JWT Cookie
    const cookieStore = await cookies();
    const token = getAuthToken(cookieStore, request);
    if (token) {
      const payload = verifyToken(token, env.JWT_SECRET);
      if (payload) {
        // Tìm sản phẩm trong DB để đối chiếu người sở hữu
        const product = await prisma.product.findUnique({
          where: { id },
        });
        if (product && product.sellerId !== payload.id && payload.role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Bạn không có quyền xóa sản phẩm của sinh viên khác!' },
            { status: 403 }
          );
        }
      }
    }

    // Fetch product before deleting to get sellerId
    const productToDelete = await prisma.product.findUnique({ where: { id } });

    const useCase = new DeleteItemUseCase(itemRepository);
    await useCase.execute(id);

    // Notify if admin deletes student's post
    if (token && productToDelete) {
      const payload = verifyToken(token, env.JWT_SECRET);
      if (payload && payload.role === 'ADMIN' && productToDelete.sellerId !== payload.id) {
        await createUserNotification({
          userId: productToDelete.sellerId,
          title: 'Bài đăng đã bị xóa',
          content: `Bài đăng "${productToDelete.name}" của bạn đã bị quản trị viên xóa do vi phạm chính sách hoặc không phù hợp.`,
          type: 'ALARM',
        });
      }
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deleting product' }, { status: 500 });
  }
}
