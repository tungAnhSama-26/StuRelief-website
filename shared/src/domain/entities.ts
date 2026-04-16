import { UserRole, UserStatus, ProductStatus, ItemCondition, OrderStatus } from '../enums';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  reputationScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  sellerId: string;
  categoryId: string;
  name: string;
  description: string;
  currentPrice: number;
  status: ProductStatus;
  condition: ItemCondition;
  isQuickRescue: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  createdAt: Date;
}

export interface Order {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  finalPrice: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  productId?: string;
  title?: string;
  lastMessageAt: Date;
  createdAt: Date;
}
