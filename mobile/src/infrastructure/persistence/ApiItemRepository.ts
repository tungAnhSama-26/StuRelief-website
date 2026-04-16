import { Item, CreateItemDTO } from '@shared/domain/Item';
import { IItemRepository } from '@shared/domain/IItemRepository';
import { ApiClient } from '../api/ApiClient';

export class ApiItemRepository implements IItemRepository {
  async findAll(page: number, limit: number): Promise<{ items: Item[]; total: number }> {
    const data = await ApiClient.get<{ items: any[]; total: number }>(
      `/items?page=${page}&limit=${limit}`
    );
    
    return {
      items: data.items.map(item => this.mapDateFields(item)),
      total: data.total,
    };
  }

  async findById(id: string): Promise<Item | null> {
    try {
      const item = await ApiClient.get<any>(`/items/${id}`);
      return this.mapDateFields(item);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async save(data: CreateItemDTO): Promise<Item> {
    const newItem = await ApiClient.post<any>('/items', data);
    return this.mapDateFields(newItem);
  }

  private mapDateFields(item: any): Item {
    return {
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    };
  }
}
