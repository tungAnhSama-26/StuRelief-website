import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

type AdminActivityInput = {
  userId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function recordAdminActivity(input: AdminActivityInput) {
  return prisma.activityLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      metadata: input.metadata,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}
