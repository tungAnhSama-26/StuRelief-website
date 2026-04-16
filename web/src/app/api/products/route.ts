import { NextResponse } from 'next/server';
import { PrismaItemRepository } from '@/infrastructure/persistence/PrismaItemRepository';
import { GetItemsUseCase } from '@/use-cases/items/GetItemsUseCase';
import { PostItemUseCase } from '@/use-cases/items/PostItemUseCase';

const itemRepository = new PrismaItemRepository();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '8');

    const useCase = new GetItemsUseCase(itemRepository);
    const { items, total } = await useCase.execute(page, limit);

    return NextResponse.json({
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const useCase = new PostItemUseCase(itemRepository);
    const newItem = await useCase.execute(body);

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error posting item' },
      { status: error.message?.includes('required') || error.message?.includes('Price') ? 400 : 500 }
    );
  }
}
