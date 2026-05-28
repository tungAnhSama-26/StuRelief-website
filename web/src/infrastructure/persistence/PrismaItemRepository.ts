import { Item, CreateItemDTO as PostItemDTO, UpdateItemDTO } from '@shared/domain/Item';
import { IItemRepository } from '@shared/domain/IItemRepository';
import { FilterItemSpecification, ItemSpecification } from '@/domain/repositories/ItemSpecification';
import prisma, { runWithDatabase } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ProductStatus } from '@shared';
import { createUserNotification } from '@/lib/notifications';

type ItemFilters = {
  search?: string;
  category?: string;
  studentId?: string;
  status?: string;
};

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    media: true;
    category: true;
  };
}> & { sellerName?: string; sellerAvatarUrl?: string };

export class PrismaItemRepository implements IItemRepository {
  private mapProduct(product: ProductWithRelations): Item {
    return {
      id: product.id,
      name: product.name,
      price: product.currentPrice,
      category: product.category ? product.category.name : 'Chưa phân loại',
      images: product.media.filter((media) => media.type === 'IMAGE').map((media) => media.url),
      studentId: product.sellerId,
      sellerName: product.sellerName,
      sellerAvatarUrl: product.sellerAvatarUrl,
      isQuickSell: false,
      status: product.status as ProductStatus,
      condition: product.condition,
      description: product.description,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  async findAll(
    page: number,
    limit: number,
    specification?: ItemSpecification | ItemFilters
  ): Promise<{ items: Item[]; total: number }> {
    try {
      const skip = (page - 1) * limit;

      const where = !specification
        ? {}
        : 'toPrismaWhere' in specification
          ? specification.toPrismaWhere()
          : new FilterItemSpecification(specification).toPrismaWhere();

      const { items, total } = await runWithDatabase(
        async () => {
          const [products, total] = await Promise.all([
            prisma.product.findMany({
              where,
              skip,
              take: limit,
              orderBy: { createdAt: 'desc' },
              include: {
                media: true,
                category: true,
              },
            }),
            prisma.product.count({ where }),
          ]);

          const sellerIds = [...new Set(products.map((p) => p.sellerId))];
          const profiles = await prisma.studentProfile.findMany({
            where: { userId: { in: sellerIds } },
            select: { userId: true, fullName: true, avatarUrl: true },
          });
          const profileMap = new Map(profiles.map((p) => [p.userId, p]));

          const items = products.map((product) => {
            const profile = profileMap.get(product.sellerId);
            return this.mapProduct({
              ...product,
              sellerName: profile?.fullName || undefined,
              sellerAvatarUrl: profile?.avatarUrl || undefined,
            });
          });

          return { items, total };
        },
        () => ({ items: [], total: 0 }),
        'PrismaItemRepository.findAll'
      );

      return { items, total };
    } catch (error) {
      console.error('PrismaItemRepository.findAll fallback:', error);
      return { items: [], total: 0 };
    }
  }

  async findById(id: string): Promise<Item | null> {
    try {
      const product = await runWithDatabase(
        () =>
          prisma.product.findUnique({
            where: { id },
            include: {
              media: true,
              category: true,
            },
          }),
        null,
        'PrismaItemRepository.findById'
      );

      if (!product) return null;

      const profile = await prisma.studentProfile.findUnique({
        where: { userId: product.sellerId },
        select: { fullName: true, avatarUrl: true },
      });

      return this.mapProduct({
        ...product,
        sellerName: profile?.fullName || undefined,
        sellerAvatarUrl: profile?.avatarUrl || undefined,
      });
    } catch (error) {
      console.error('PrismaItemRepository.findById fallback:', error);
      return null;
    }
  }

  async save(data: PostItemDTO): Promise<Item> {
    const newProduct = await runWithDatabase(
      async () => {
        let category = await prisma.category.findFirst({
          where: {
            OR: [
              { name: { equals: data.category, mode: 'insensitive' } },
              { slug: { equals: data.category, mode: 'insensitive' } },
            ],
          },
        });

        if (!category) {
          category = await prisma.category.findFirst();
        }

        const createdProduct = await prisma.product.create({
          data: {
            name: data.name,
            currentPrice: data.price,
            description: data.description || '',
            sellerId: data.studentId || 'default-seller-id',
            categoryId: category ? category.id : 'default-category-id',
            condition: (data.condition as any) || 'USED_GOOD',
            status: 'DRAFT',
            media: {
              create: data.images.map((url) => ({
                url,
                type: 'IMAGE',
              })),
            },
          },
          include: {
            media: true,
            category: true,
          },
        });
        
        const profile = await prisma.studentProfile.findUnique({
          where: { userId: createdProduct.sellerId },
          select: { fullName: true }
        });
        
        const sellerName = profile?.fullName || data.studentId;

        // Fetch all admins and send them a notification
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
        await Promise.all(admins.map(admin => createUserNotification({
          userId: admin.id,
          title: 'Bài đăng mới cần duyệt',
          content: `Người dùng ${sellerName} vừa đăng một bài mới cần được duyệt.`,
          type: 'SYSTEM',
          link: `/admin/posts`
        })));
        
        return { ...createdProduct, sellerName } as ProductWithRelations;
      },
      () => {
        throw new Error('Database unavailable')
      },
      'PrismaItemRepository.save'
    );

    return this.mapProduct(newProduct);
  }

  async update(id: string, data: UpdateItemDTO): Promise<Item> {
    const finalProductWithSeller = await runWithDatabase(
      async () => {
        let categoryId: string | undefined;

        if (data.category) {
          const category = await prisma.category.findFirst({
            where: {
              OR: [
                { name: { equals: data.category, mode: 'insensitive' } },
                { slug: { equals: data.category, mode: 'insensitive' } },
              ],
            },
          });
          if (category) {
            categoryId = category.id;
          }
        }

        const updated = await prisma.product.update({
          where: { id },
          data: {
            name: data.name,
            currentPrice: data.price,
            description: data.description,
            sellerId: data.studentId,
            categoryId,
            status: data.status,
            condition: data.condition as any,
          },
          include: {
            media: true,
            category: true,
          },
        });

        if (data.images && data.images.length > 0) {
          await prisma.productMedia.deleteMany({
            where: { productId: id },
          });
          await prisma.productMedia.createMany({
            data: data.images.map((url) => ({
              productId: id,
              url,
              type: 'IMAGE',
            })),
          });
        }

        const finalProduct = await prisma.product.findUnique({
          where: { id },
          include: {
            media: true,
            category: true,
          },
        });

        if (!finalProduct) {
          throw new Error('Product not found after update');
        }

        const profile = await prisma.studentProfile.findUnique({
          where: { userId: finalProduct.sellerId },
          select: { fullName: true }
        });

        return { ...finalProduct, sellerName: profile?.fullName || undefined } as ProductWithRelations;
      },
      () => {
        throw new Error('Database unavailable')
      },
      'PrismaItemRepository.update'
    );

    return this.mapProduct(finalProductWithSeller);
  }

  async delete(id: string): Promise<void> {
    await runWithDatabase(
      async () => {
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
      },
      () => {
        throw new Error('Database unavailable')
      },
      'PrismaItemRepository.delete'
    );
  }
}
