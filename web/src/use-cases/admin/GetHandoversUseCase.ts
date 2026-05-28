import { IHandoverRepository } from '@/domain/repositories/IHandoverRepository';
import { FilterHandoverSpecification } from '@/domain/repositories/HandoverSpecification';

export class GetHandoversUseCase {
  constructor(private handoverRepository: IHandoverRepository) {}

  async execute(filters?: { status?: string; orderId?: string; search?: string }) {
    const specification = new FilterHandoverSpecification(filters);
    return await this.handoverRepository.findAll(specification);
  }
}
