export interface VerificationSpecification {
  toPrismaWhere(): Record<string, unknown>;
}

export class FilterVerificationSpecification implements VerificationSpecification {
  constructor(
    private filters?: {
      status?: string;
      userId?: string;
      search?: string;
    }
  ) {}

  toPrismaWhere(): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (this.filters?.status) {
      where.status = this.filters.status;
    }

    if (this.filters?.userId) {
      where.userId = this.filters.userId;
    }

    if (this.filters?.search) {
      where.user = {
        profile: {
          fullName: { contains: this.filters.search, mode: 'insensitive' }
        }
      };
    }

    return where;
  }
}
