import { Product, CreateProductDTO } from '@shared/domain/Product';
import { IProductRepository } from '@shared/domain/IProductRepository';
import { ApiClient } from '../api/ApiClient';

export class ApiProductRepository implements IProductRepository {
  async findAll(page: number, limit: number): Promise<{ products: Product[]; total: number }> {
    const data = await ApiClient.get<{ products: any[]; total: number }>(
      `/products?page=${page}&limit=${limit}`
    );
    
    return {
      products: data.products.map(p => this.mapDateFields(p)),
      total: data.total,
    };
  }

  async findById(id: string): Promise<Product | null> {
    try {
      const product = await ApiClient.get<any>(`/products/${id}`);
      return this.mapDateFields(product);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async save(data: CreateProductDTO): Promise<Product> {
    const newProduct = await ApiClient.post<any>('/products', data);
    return this.mapDateFields(newProduct);
  }

  private mapDateFields(product: any): Product {
    return {
      ...product,
      createdAt: new Date(product.createdAt),
      updatedAt: new Date(product.updatedAt),
    };
  }
}
