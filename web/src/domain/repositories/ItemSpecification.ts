export interface ItemSpecification {
  toPrismaWhere(): Record<string, unknown>;
}

export class FilterItemSpecification implements ItemSpecification {
  constructor(
    private filters?: {
      search?: string;
      category?: string;
      studentId?: string;
      status?: string;
    }
  ) {}

  toPrismaWhere(): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (this.filters?.search) {
      where.OR = [
        { name: { contains: this.filters.search, mode: 'insensitive' } },
        { description: { contains: this.filters.search, mode: 'insensitive' } },
      ];
    }

    if (this.filters?.category && this.filters.category !== 'Tất cả danh mục' && this.filters.category !== 'All') {
      where.category = {
        is: {
          name: { equals: this.filters.category, mode: 'insensitive' },
        },
      };
    }

    if (this.filters?.studentId) {
      where.sellerId = this.filters.studentId;
    }

    if (this.filters?.status && this.filters.status !== 'ALL') {
      where.status = this.filters.status;
    }

    return where;
  }
}
