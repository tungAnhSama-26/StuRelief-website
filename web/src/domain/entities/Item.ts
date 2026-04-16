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

export type PostItemDTO = Omit<Item, 'id' | 'createdAt' | 'updatedAt'>;
