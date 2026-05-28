import { Item, PostItemDTO } from '../entities/Item';
import { ItemSpecification } from './ItemSpecification';

export interface IItemRepository {
  findAll(page: number, limit: number, specification?: ItemSpecification): Promise<{ items: Item[]; total: number }>;
  findById(id: string): Promise<Item | null>;
  save(data: PostItemDTO): Promise<Item>;
  update(id: string, data: Partial<PostItemDTO>): Promise<Item>;
  delete(id: string): Promise<void>;
}
