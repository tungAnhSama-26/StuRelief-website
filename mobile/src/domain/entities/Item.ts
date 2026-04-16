export interface Item {
  id: string;
  name: string;
  price: number;
  category: string;
  images: string[];
  studentId: string;
  isQuickSell: boolean;
  description?: string;
  createdAt: string; // Trong mobile thường nhận từ JSON nên là string
  updatedAt: string;
}

export type PostItemDTO = Omit<Item, 'id' | 'createdAt' | 'updatedAt'>;
