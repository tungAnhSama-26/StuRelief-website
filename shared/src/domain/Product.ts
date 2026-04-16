import { ProductStatus, ItemCondition } from '../enums';

export interface Product {
  id: string;
  sellerId: string;
  categoryId: string;
  name: string;
  description: string;
  status: ProductStatus;
  condition: ItemCondition;
  currentPrice: number;
  isQuickRescue: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductMedia {
  id: string;
  productId: string;
  url: string;
  type: string;
  isPrimary: boolean;
  order: number;
}

export type CreateProductDTO = Omit<Product, 'id' | 'viewCount' | 'createdAt' | 'updatedAt'>;
export type UpdateProductDTO = Partial<CreateProductDTO>;
