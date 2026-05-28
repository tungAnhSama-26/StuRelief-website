import { IVerificationRepository } from '@/domain/repositories/IVerificationRepository';
import { FilterVerificationSpecification } from '@/domain/repositories/VerificationSpecification';

export class GetVerificationsUseCase {
  constructor(private verificationRepository: IVerificationRepository) {}

  async execute(filters?: { status?: string; userId?: string; search?: string }) {
    const specification = new FilterVerificationSpecification(filters);
    return await this.verificationRepository.findAll(specification);
  }
}
