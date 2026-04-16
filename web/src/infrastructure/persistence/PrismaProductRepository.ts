import { Product, CreateProductDTO } from '@shared/domain/Product';
import { IProductRepository } from '@shared/domain/IProductRepository';
import prisma from '@/lib/prisma';

export class PrismaProductRepository implements IProductRepository {
  async findAll(page: number, limit: number): Promise<{ products: Product[]; total: number }> {
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count(),
    ]);
    
    return {
      products: products as unknown as Product[],
      total,
    };
  }

  async findById(id: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { id },
    });
    return (product as unknown as Product) || null;
  }

  async save(data: CreateProductDTO): Promise<Product> {
    const newProduct = await prisma.product.create({
      data: {
        name: data.name,
        currentPrice: data.currentPrice,
        categoryId: data.categoryId,
        sellerId: data.sellerId,
        status: data.status,
        condition: data.condition,
        description: data.description,
        isQuickRescue: data.isQuickRescue,
      },
    });
    return newProduct as unknown as Product;
  }
}
