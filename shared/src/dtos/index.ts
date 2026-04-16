import { Product, User } from '../domain/entities';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
}

export interface UserProfileResponse {
  user: User;
  stats: {
    totalSales: number;
    totalPurchases: number;
    rating: number;
  };
}
