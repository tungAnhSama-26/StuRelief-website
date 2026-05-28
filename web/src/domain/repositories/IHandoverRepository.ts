import { HandoverSpecification } from './HandoverSpecification';

export interface HandoverDTO {
  id: string;
  orderId: string;
  productName: string;
  buyerName: string;
  sellerName: string;
  finalPrice: number;
  status: string;
  evidences: {
    id: string;
    url: string;
    type: string;
    caption: string | null;
    createdAt: string;
  }[];
  history: {
    id: string;
    status: string;
    note: string | null;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface IHandoverRepository {
  findAll(specification?: HandoverSpecification): Promise<HandoverDTO[]>;
  findById(id: string): Promise<HandoverDTO | null>;
  updateStatus(id: string, status: string, note?: string): Promise<void>;
}
