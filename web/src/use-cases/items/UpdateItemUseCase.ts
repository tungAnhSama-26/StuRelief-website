import { PostItemDTO } from '@/domain/entities/Item';
import { IItemRepository } from '@/domain/repositories/IItemRepository';

export class UpdateItemUseCase {
  constructor(private itemRepository: IItemRepository) {}

  async execute(id: string, data: Partial<PostItemDTO>) {
    if (data.price !== undefined && data.price < 0) {
      throw new Error('Price cannot be negative');
    }
    if (data.name !== undefined && !data.name?.trim()) {
      throw new Error('Item name is required');
    }
    return await this.itemRepository.update(id, data);
  }
}
