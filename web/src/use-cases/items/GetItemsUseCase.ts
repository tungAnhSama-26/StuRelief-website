import { IItemRepository } from '@/domain/repositories/IItemRepository';

export class GetItemsUseCase {
  constructor(private itemRepository: IItemRepository) {}

  async execute(page: number = 1, limit: number = 8) {
    return await this.itemRepository.findAll(page, limit);
  }
}
