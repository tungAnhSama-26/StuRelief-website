import { Item, PostItemDTO } from '@/domain/entities/Item';
import { IItemRepository } from '@/domain/repositories/IItemRepository';
import prisma from '@/lib/prisma';

export class PrismaItemRepository implements IItemRepository {
  async findAll(page: number, limit: number): Promise<{ items: Item[]; total: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.item.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.item.count(),
    ]);
    
    return {
      items: items as Item[],
      total,
    };
  }

  async findById(id: string): Promise<Item | null> {
    const item = await prisma.item.findUnique({
      where: { id },
    });
    return (item as Item) || null;
  }

  async save(data: PostItemDTO): Promise<Item> {
    const newItem = await prisma.item.create({
      data: {
        name: data.name,
        price: data.price,
        category: data.category,
        images: data.images,
        studentId: data.studentId,
        isQuickSell: data.isQuickSell,
        description: data.description,
      },
    });
    return newItem as Item;
  }
}
