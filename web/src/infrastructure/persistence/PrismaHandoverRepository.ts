import { IHandoverRepository, HandoverDTO } from '@/domain/repositories/IHandoverRepository';
import { HandoverSpecification } from '@/domain/repositories/HandoverSpecification';
import prisma from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export class PrismaHandoverRepository implements IHandoverRepository {
  async findAll(specification?: HandoverSpecification): Promise<HandoverDTO[]> {
    const where = specification ? specification.toPrismaWhere() : {};

    const orders = await prisma.order.findMany({
      where,
      include: {
        product: true,
        evidences: true,
        history: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // We need to fetch user names. To keep it simple, we'll fetch them separately if needed or join.
    // Since we don't have direct user relation in Order (only buyerId, sellerId as Strings),
    // we fetch profiles or users.
    
    const userIds = [...new Set(orders.flatMap(o => [o.buyerId, o.sellerId]))];
    const profiles = await prisma.studentProfile.findMany({
      where: { userId: { in: userIds } },
    });
    
    const profileMap = new Map(profiles.map(p => [p.userId, p.fullName]));

    return orders.map(order => ({
      id: order.id,
      orderId: order.id,
      productName: order.product.name,
      buyerName: profileMap.get(order.buyerId) || 'Người mua ẩn danh',
      sellerName: profileMap.get(order.sellerId) || 'Người bán ẩn danh',
      finalPrice: order.finalPrice,
      status: order.status,
      evidences: order.evidences.map(e => ({
        id: e.id,
        url: e.url,
        type: e.type,
        caption: e.caption,
        createdAt: e.createdAt.toISOString(),
      })),
      history: order.history.map(h => ({
        id: h.id,
        status: h.status,
        note: h.note,
        createdAt: h.createdAt.toISOString(),
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }));
  }

  async findById(id: string): Promise<HandoverDTO | null> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        product: true,
        evidences: true,
        history: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) return null;

    const [buyerProfile, sellerProfile] = await Promise.all([
      prisma.studentProfile.findUnique({ where: { userId: order.buyerId } }),
      prisma.studentProfile.findUnique({ where: { userId: order.sellerId } }),
    ]);

    return {
      id: order.id,
      orderId: order.id,
      productName: order.product.name,
      buyerName: buyerProfile?.fullName || 'Người mua ẩn danh',
      sellerName: sellerProfile?.fullName || 'Người bán ẩn danh',
      finalPrice: order.finalPrice,
      status: order.status,
      evidences: order.evidences.map(e => ({
        id: e.id,
        url: e.url,
        type: e.type,
        caption: e.caption,
        createdAt: e.createdAt.toISOString(),
      })),
      history: order.history.map(h => ({
        id: h.id,
        status: h.status,
        note: h.note,
        createdAt: h.createdAt.toISOString(),
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  async updateStatus(id: string, status: string, note?: string): Promise<void> {
    await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: { status: status as OrderStatus },
      }),
      prisma.orderStatusLog.create({
        data: {
          orderId: id,
          status: status as OrderStatus,
          note,
        },
      }),
    ]);
  }
}
