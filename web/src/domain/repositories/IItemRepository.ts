import { Item, PostItemDTO } from '../entities/Item';

export interface IItemRepository {
  findAll(page: number, limit: number): Promise<{ items: Item[]; total: number }>;
  findById(id: string): Promise<Item | null>;
  save(data: PostItemDTO): Promise<Item>;
}
