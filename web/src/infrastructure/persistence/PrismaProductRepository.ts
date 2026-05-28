import { Product, CreateProductDTO } from '@shared/domain/Product';
import { IProductRepository } from '@shared/domain/IProductRepository';
import prisma, { runWithDatabase } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type ProductRecord = Prisma.ProductGetPayload<Prisma.ProductDefaultArgs>;

const toDomainProduct = (product: ProductRecord): Product => {
  return {
    ...(product as unknown as Record<string, unknown>),
    isQuickRescue: false,
  } as unknown as Product;
};

export class PrismaProductRepository implements IProductRepository {
  async findAll(page: number, limit: number): Promise<{ products: Product[]; total: number }> {
    const skip = (page - 1) * limit;
    const { products, total } = await runWithDatabase(
      async () => {
        const [products, total] = await Promise.all([
          prisma.product.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.product.count(),
        ]);

        return { products, total };
      },
      () => ({ products: [], total: 0 }),
      'PrismaProductRepository.findAll'
    );
    
    return {
      products: products.map((product) => toDomainProduct(product)),
      total,
    };
  }

  async findById(id: string): Promise<Product | null> {
    const product = await runWithDatabase(
      () =>
        prisma.product.findUnique({
          where: { id },
        }),
      null,
      'PrismaProductRepository.findById'
    );
    return product ? toDomainProduct(product) : null;
  }

  async save(data: CreateProductDTO): Promise<Product> {
    const newProduct = await runWithDatabase(
      () =>
        prisma.product.create({
          data: {
            name: data.name,
            currentPrice: data.currentPrice,
            categoryId: data.categoryId,
            sellerId: data.sellerId,
            status: data.status,
            condition: data.condition,
            description: data.description,
          },
        }),
      () => {
        throw new Error('Database unavailable')
      },
      'PrismaProductRepository.save'
    );
    return toDomainProduct(newProduct);
  }
}
