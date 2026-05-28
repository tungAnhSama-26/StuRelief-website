import { IItemRepository } from '@/domain/repositories/IItemRepository';

export class DeleteItemUseCase {
  constructor(private itemRepository: IItemRepository) {}

  async execute(id: string) {
    if (!id) {
      throw new Error('Item ID is required for deletion');
    }
    return await this.itemRepository.delete(id);
  }
}
