import { Item, PostItemDTO } from '@/domain/entities/Item';
import { IItemRepository } from '@/domain/repositories/IItemRepository';

const API_BASE_URL = 'http://localhost:3000/api'; // Hoặc IP máy nếu chạy thật

export class ApiItemRepository implements IItemRepository {
  async findAll(page: number, limit: number): Promise<{ items: Item[]; total: number }> {
    const response = await fetch(`${API_BASE_URL}/products?page=${page}&limit=${limit}`);
    const result = await response.json();
    return {
      items: result.data,
      total: result.pagination.total
    };
  }

  async findById(id: string): Promise<Item | null> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!response.ok) return null;
    return await response.json();
  }

  async save(data: PostItemDTO): Promise<Item> {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to post item');
    }
    return await response.json();
  }
}
