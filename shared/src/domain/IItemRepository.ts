import { Item, CreateItemDTO, UpdateItemDTO } from './Item';

export interface IItemRepository {
  findAll(
    page: number,
    limit: number,
    filters?: { search?: string; category?: string; studentId?: string; status?: string }
  ): Promise<{ items: Item[]; total: number }>;
  findById(id: string): Promise<Item | null>;
  save(data: CreateItemDTO): Promise<Item>;
  update(id: string, data: UpdateItemDTO): Promise<Item>;
  delete(id: string): Promise<void>;
}
