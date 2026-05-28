import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { env } from '@/infrastructure/config/env';
import { aiImageUrl } from '@/lib/aiImage';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = verifyToken(token, env.JWT_SECRET);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const disputes = await prisma.disputeCase.findMany({
      include: {
        evidences: true,
        order: {
          include: {
            product: {
              include: {
                snapshots: true,
                media: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const enrichedDisputes = await Promise.all(
      disputes.map(async (dispute) => {
        const buyer = await prisma.user.findUnique({
          where: { id: dispute.order.buyerId },
          include: { profile: true }
        });
        const seller = await prisma.user.findUnique({
          where: { id: dispute.order.sellerId },
          include: { profile: true }
        });
        const initiator = await prisma.user.findUnique({
          where: { id: dispute.initiatorId },
          include: { profile: true }
        });

        // Parse product original snapshot (it was stored as JSON or in productSnapshots table)
        const originalSnapshot = dispute.order.product.snapshots.find(
          s => s.versionName === 'ORIGINAL_DEAL'
        );

        return {
          id: dispute.id,
          orderId: dispute.orderId,
          reason: dispute.reason,
          status: dispute.status,
          createdAt: dispute.createdAt,
          updatedAt: dispute.updatedAt,
          evidenceImage: dispute.evidences[0]?.url || aiImageUrl(`realistic AI evidence photo for dispute review of ${dispute.order.product.name}`, { width: 400, height: 400, seed: `evidence-${dispute.id}` }),
          evidenceDescription: dispute.evidences[0]?.description || '',
          buyerName: buyer?.profile?.fullName || 'Sinh viên A',
          buyerEmail: buyer?.email || 'studentA@edu.vn',
          sellerName: seller?.profile?.fullName || 'Sinh viên B',
          sellerEmail: seller?.email || 'studentB@edu.vn',
          productName: dispute.order.product.name,
          currentSnapshot: {
            id: dispute.order.product.id,
            name: dispute.order.product.name,
            price: dispute.order.finalPrice,
            category: 'Đồ dùng học tập',
            description: dispute.order.product.description,
            specs: {
              ram: '8GB',
              cpu: 'Intel Core i5',
              condition: dispute.order.product.condition === 'USED_GOOD' ? 'USED_GOOD (Có trầy xước nhẹ)' : dispute.order.product.condition
            },
            image: dispute.order.product.media[0]?.url || aiImageUrl(`realistic AI product photo of ${dispute.order.product.name}`, { width: 400, height: 400, seed: `current-${dispute.id}` }),
            updatedAt: 'Thời điểm bàn giao giao dịch'
          },
          disputeSnapshot: originalSnapshot ? {
            id: dispute.order.product.id,
            name: (originalSnapshot.data as any).name || dispute.order.product.name,
            price: (originalSnapshot.data as any).price || dispute.order.finalPrice,
            category: 'Đồ dùng học tập',
            description: (originalSnapshot.data as any).description || dispute.order.product.description,
            specs: {
              ram: (originalSnapshot.data as any).ram || '16GB',
              cpu: (originalSnapshot.data as any).cpu || 'Intel Core i7',
              condition: (originalSnapshot.data as any).condition || 'USED_LIKE_NEW'
            },
            image: dispute.order.product.media[0]?.url || aiImageUrl(`realistic AI product photo of ${dispute.order.product.name}`, { width: 400, height: 400, seed: `snapshot-${dispute.id}` }),
            updatedAt: 'Thời điểm chốt cọc giữ chỗ (Bản gốc)'
          } : null
        };
      })
    );

    return NextResponse.json(enrichedDisputes);
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
