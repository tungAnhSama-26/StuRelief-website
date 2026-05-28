export interface HandoverSpecification {
  toPrismaWhere(): Record<string, unknown>;
}

export class FilterHandoverSpecification implements HandoverSpecification {
  constructor(
    private filters?: {
      status?: string;
      orderId?: string;
      search?: string;
    }
  ) {}

  toPrismaWhere(): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (this.filters?.status && this.filters.status !== 'ALL') {
      where.status = this.filters.status;
    }

    if (this.filters?.orderId) {
      where.id = this.filters.orderId;
    }

    if (this.filters?.search) {
      where.OR = [
        { id: { contains: this.filters.search, mode: 'insensitive' } },
        { product: { name: { contains: this.filters.search, mode: 'insensitive' } } },
      ];
    }

    return where;
  }
}
