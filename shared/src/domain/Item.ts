export interface Item {
  id: string;
  name: string;
  price: number;
  category: string;
  images: string[];
  studentId: string;
  isQuickSell: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateItemDTO = Omit<Item, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateItemDTO = Partial<CreateItemDTO>;
