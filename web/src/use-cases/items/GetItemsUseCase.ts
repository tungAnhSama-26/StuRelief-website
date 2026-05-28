import { IItemRepository } from '@/domain/repositories/IItemRepository';
import { FilterItemSpecification } from '@/domain/repositories/ItemSpecification';

export class GetItemsUseCase {
  constructor(private itemRepository: IItemRepository) {}

  async execute(page: number = 1, limit: number = 8, filters?: { search?: string; category?: string; studentId?: string; status?: string }) {
    const specification = new FilterItemSpecification(filters);
    return await this.itemRepository.findAll(page, limit, specification);
  }
}
