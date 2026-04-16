import { NextResponse } from 'next/server';
import { PrismaItemRepository } from '@/infrastructure/persistence/PrismaItemRepository';
import { GetItemDetailUseCase } from '@/use-cases/items/GetItemDetailUseCase';

const itemRepository = new PrismaItemRepository();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const useCase = new GetItemDetailUseCase(itemRepository);
    const item = await useCase.execute(id);

    return NextResponse.json(item);
  } catch (error: any) {
    if (error.message === 'Item not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
