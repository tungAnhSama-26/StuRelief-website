import { IItemRepository } from '@/domain/repositories/IItemRepository';

export class GetItemDetailUseCase {
  constructor(private itemRepository: IItemRepository) {}

  async execute(id: string) {
    const item = await this.itemRepository.findById(id);
    if (!item) {
      throw new Error('Item not found');
    }
    return item;
  }
}
