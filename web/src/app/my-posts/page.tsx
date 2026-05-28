import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Suspense } from 'react';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import ProductDashboardWrapper from '@/components/products/ProductDashboardWrapper';
import prisma, { runWithDatabase } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { env } from '@/infrastructure/config/env';
import { PrismaItemRepository } from '@/infrastructure/persistence/PrismaItemRepository';
import { GetItemsUseCase } from '@/use-cases/items/GetItemsUseCase';
import { APP_ROUTES } from '@shared';
import type { Item } from '@shared/domain/Item';

interface SearchParams {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
}

const itemRepository = new PrismaItemRepository();
const getItemsUseCase = new GetItemsUseCase(itemRepository);

export default async function MyPostsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 8;
  const search = params.search || undefined;
  const category = params.category || undefined;

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const currentUser = token ? verifyToken(token, env.JWT_SECRET) : null;

  if (!currentUser) {
    redirect(APP_ROUTES.LOGIN);
  }

  const currentUserId = currentUser.id;

  let items: Item[] = [];
  let total = 0;
  let categoriesList: string[] = [];
  let myProductsCount = 0;
  let draftCount = 0;
  let availableCount = 0;
  let hiddenCount = 0;

  try {
    const { catalogData, dbCategories, sellerPostsCount, draftPosts, availablePosts, hiddenPosts } =
      await runWithDatabase(
        async () => {
          const [catalogData, dbCategories, sellerPostsCount, draftPosts, availablePosts, hiddenPosts] =
            await Promise.all([
              getItemsUseCase.execute(page, limit, { search, category, studentId: currentUserId, status: 'ALL' }),
              prisma.category.findMany({ orderBy: { name: 'asc' } }),
              prisma.product.count({ where: { sellerId: currentUserId } }),
              prisma.product.count({ where: { sellerId: currentUserId, status: 'DRAFT' } }),
              prisma.product.count({ where: { sellerId: currentUserId, status: 'AVAILABLE' } }),
              prisma.product.count({ where: { sellerId: currentUserId, status: 'HIDDEN' } }),
            ]);

          return { catalogData, dbCategories, sellerPostsCount, draftPosts, availablePosts, hiddenPosts };
        },
        () => ({
          catalogData: { items: [], total: 0 },
          dbCategories: [],
          sellerPostsCount: 0,
          draftPosts: 0,
          availablePosts: 0,
          hiddenPosts: 0,
        }),
        'My posts page data load'
      );

    items = catalogData.items;
    total = catalogData.total;
    categoriesList = dbCategories.map((c) => c.name);
    myProductsCount = sellerPostsCount;
    draftCount = draftPosts;
    availableCount = availablePosts;
    hiddenCount = hiddenPosts;
  } catch (error) {
    console.error('My posts page DB fallback:', error);
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const getPageNumbers = (current: number, totalPageCount: number) => {
    const pages: (number | string)[] = [];
    if (totalPageCount <= 5) {
      for (let i = 1; i <= totalPageCount; i += 1) pages.push(i);
      return pages;
    }

    if (current <= 5) {
      for (let i = 1; i <= 5; i += 1) pages.push(i);
      pages.push('...');
      pages.push(totalPageCount);
      return pages;
    }

    if (current >= totalPageCount - 4) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPageCount - 4; i <= totalPageCount; i += 1) pages.push(i);
      return pages;
    }

    pages.push(1);
    pages.push('...');
    pages.push(current - 1, current, current + 1);
    pages.push('...');
    pages.push(totalPageCount);
    return pages;
  };

  const pageNumbers = getPageNumbers(page, totalPages);

  const buildPageUrl = (targetPage: number) => {
    const queryParams = new URLSearchParams();
    queryParams.set('page', String(targetPage));
    if (limit !== 8) queryParams.set('limit', String(limit));
    if (search) queryParams.set('search', search);
    if (category && category !== 'Tất cả danh mục') queryParams.set('category', category);
    return `${APP_ROUTES.MY_POSTS}?${queryParams.toString()}`;
  };

  return (
    <DashboardLayout activeItemId="my-posts" pageTitle="Quản lý bài đăng">
      <section className="space-y-6 pb-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={APP_ROUTES.HOME}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-950 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại chợ đồ cũ</span>
          </Link>

          <div className="rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <Sparkles className="mr-1 inline h-3 w-3 text-blue-500" />
            Bài đăng của tôi
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-blue-500/15 bg-white p-5 shadow-sm dark:border-blue-500/20 dark:bg-zinc-900">
            <div className="text-xs font-semibold text-zinc-500">Tổng bài đăng</div>
            <div className="mt-2 text-3xl font-black text-zinc-950 dark:text-white">{myProductsCount}</div>
          </div>
          <div className="rounded-3xl border border-emerald-500/15 bg-white p-5 shadow-sm dark:border-emerald-500/20 dark:bg-zinc-900">
            <div className="text-xs font-semibold text-zinc-500">Đang hiển thị</div>
            <div className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">{availableCount}</div>
          </div>
          <div className="rounded-3xl border border-amber-500/15 bg-white p-5 shadow-sm dark:border-amber-500/20 dark:bg-zinc-900">
            <div className="text-xs font-semibold text-zinc-500">Chờ duyệt</div>
            <div className="mt-2 text-3xl font-black text-amber-600 dark:text-amber-400">{draftCount}</div>
          </div>
          <div className="rounded-3xl border border-rose-500/15 bg-white p-5 shadow-sm dark:border-rose-500/20 dark:bg-zinc-900">
            <div className="text-xs font-semibold text-zinc-500">Đã ẩn</div>
            <div className="mt-2 text-3xl font-black text-rose-600 dark:text-rose-400">{hiddenCount}</div>
          </div>
        </div>

        <Suspense fallback={<div className="py-10 text-center">Đang tải...</div>}>
          <ProductDashboardWrapper
            initialItems={items}
            total={total}
            myTotal={myProductsCount}
            page={page}
            limit={limit}
            search={search}
            category={category}
            categories={categoriesList}
          />
        </Suspense>

        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-1 md:gap-2">
            <Link
              href={buildPageUrl(Math.max(1, page - 1))}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition-all hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 ${
                page === 1 ? 'pointer-events-none opacity-40' : ''
              }`}
              aria-label="Trang trước"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>

            {pageNumbers.map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`ell-${idx}`} className="flex h-10 w-10 items-center justify-center font-medium text-zinc-400">
                    ...
                  </span>
                );
              }

              const pageNum = p as number;
              const isActive = pageNum === page;

              return (
                <Link
                  key={pageNum}
                  href={buildPageUrl(pageNum)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'scale-105 bg-blue-600 text-white shadow-md shadow-blue-500/20 dark:bg-blue-500'
                      : 'border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {pageNum}
                </Link>
              );
            })}

            <Link
              href={buildPageUrl(Math.min(totalPages, page + 1))}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition-all hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 ${
                page === totalPages ? 'pointer-events-none opacity-40' : ''
              }`}
              aria-label="Trang sau"
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
