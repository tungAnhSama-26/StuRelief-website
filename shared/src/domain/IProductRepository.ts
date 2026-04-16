import { Product, CreateProductDTO } from './Product';

export interface IProductRepository {
  findAll(page: number, limit: number): Promise<{ products: Product[]; total: number }>;
  findById(id: string): Promise<Product | null>;
  save(data: CreateProductDTO): Promise<Product>;
}
