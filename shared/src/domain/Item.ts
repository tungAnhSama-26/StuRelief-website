import { ProductStatus } from '../enums';

export interface Item {
  id: string;
  name: string;
  price: number;
  category: string;
  images: string[];
  studentId: string;
  sellerName?: string;
  sellerAvatarUrl?: string;
  condition?: string;
  isQuickSell: boolean;
  status: ProductStatus;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateItemDTO = Omit<Item, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateItemDTO = Partial<CreateItemDTO>;
