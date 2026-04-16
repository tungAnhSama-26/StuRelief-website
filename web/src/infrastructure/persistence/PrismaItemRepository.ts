import { Item, CreateItemDTO as PostItemDTO } from '@shared/domain/Item';
import { IItemRepository } from '@shared/domain/IItemRepository';
import prisma from '@/lib/prisma';

export class PrismaItemRepository implements IItemRepository {
  async findAll(page: number, limit: number): Promise<{ items: Item[]; total: number }> {
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          media: true,
          category: true,
        },
      }),
      prisma.product.count(),
    ]);
    
    return {
      items: products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.currentPrice,
        category: p.category.name,
        images: p.media.filter(m => m.type === 'IMAGE').map(m => m.url),
        studentId: p.sellerId,
        isQuickSell: false, // Field removed in new schema, default to false
        description: p.description,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })) as Item[],
      total,
    };
  }

  async findById(id: string): Promise<Item | null> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        media: true,
        category: true,
      },
    });

    if (!product) return null;

    return {
      id: product.id,
      name: product.name,
      price: product.currentPrice,
      category: product.category.name,
      images: product.media.filter(m => m.type === 'IMAGE').map(m => m.url),
      studentId: product.sellerId,
      isQuickSell: false,
      description: product.description,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  async save(data: PostItemDTO): Promise<Item> {
    const newProduct = await prisma.product.create({
      data: {
        name: data.name,
        currentPrice: data.price,
        description: data.description || '',
        sellerId: data.studentId,
        categoryId: 'default-category-id',
        condition: 'USED_GOOD',
        status: 'AVAILABLE',
        media: {
          create: data.images.map(url => ({
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

    return {
      id: newProduct.id,
      name: newProduct.name,
      price: newProduct.currentPrice,
      category: newProduct.category.name,
      images: newProduct.media.map(m => m.url),
      studentId: newProduct.sellerId,
      isQuickSell: false,
      description: newProduct.description,
      createdAt: newProduct.createdAt,
      updatedAt: newProduct.updatedAt,
    };
  }

}

