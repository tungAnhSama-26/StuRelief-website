import { PostItemDTO } from '@/domain/entities/Item';
import { IItemRepository } from '@/domain/repositories/IItemRepository';

export class PostItemUseCase {
  constructor(private itemRepository: IItemRepository) {}

  async execute(data: PostItemDTO) {
    if (data.price < 0) {
      throw new Error('Price cannot be negative');
    }
    if (!data.name?.trim()) {
      throw new Error('Item name is required');
    }
    return await this.itemRepository.save(data);
  }
}
