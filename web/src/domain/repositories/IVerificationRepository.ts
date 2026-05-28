import { VerificationSpecification } from './VerificationSpecification';

export interface VerificationDTO {
  id: string;
  fullName: string;
  email: string;
  mssv: string;
  campus: string;
  cardImage: string;
  status: string;
  date: string;
  dateOfBirth?: string;
  hometown?: string;
}

export interface IVerificationRepository {
  findAll(specification?: VerificationSpecification): Promise<VerificationDTO[]>;
  findById(id: string): Promise<VerificationDTO | null>;
  updateStatus(id: string, status: string, moderatorId: string, note?: string): Promise<void>;
  save(data: { 
    userId: string; 
    studentCardFront: string; 
    studentCardBack: string; 
    emailOtp?: string;
    fullName?: string;
    dateOfBirth?: Date;
    hometown?: string;
    universityId?: string;
  }): Promise<void>;
}
