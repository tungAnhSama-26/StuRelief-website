import { ProductStatus } from '@shared';

export interface Item {
  id: string;
  name: string;
  price: number;
  category: string;
  images: string[];
  studentId: string;
  sellerName?: string;
  sellerAvatarUrl?: string;
  isQuickSell: boolean;
  status: ProductStatus;
  condition?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PostItemDTO = Omit<Item, 'id' | 'createdAt' | 'updatedAt'>;
