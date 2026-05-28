import { Suspense } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import ProductDashboardWrapper from '@/components/products/ProductDashboardWrapper';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import prisma, { runWithDatabase } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { env } from '@/infrastructure/config/env';
import { PrismaItemRepository } from '@/infrastructure/persistence/PrismaItemRepository';
import { GetItemsUseCase } from '@/use-cases/items/GetItemsUseCase';
import type { Item } from '@shared/domain/Item';

interface SearchParams {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
}

const itemRepository = new PrismaItemRepository();
const getItemsUseCase = new GetItemsUseCase(itemRepository);

export default async function Home({
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
  const currentUserId = currentUser?.id || 'guest';

  // Redirect newly registered students to verification page
  if (currentUser && currentUser.status === 'PENDING') {
    const { redirect } = await import('next/navigation');
    redirect('/verification');
  }

  let items: Item[] = [];
  let total = 0;
  let categoriesList: string[] = [];
  let totalActivePosts = 0;
  let myProductsCount = 0;

  try {
    const { catalogData, dbCategories, activePostsCount, sellerPostsCount } = await runWithDatabase(
      async () => {
        const [catalogData, dbCategories, activePostsCount, sellerPostsCount] = await Promise.all([
          getItemsUseCase.execute(page, limit, { search, category, status: 'AVAILABLE' }),
          prisma.category.findMany({ orderBy: { name: 'asc' } }),
          prisma.product.count({ where: { status: 'AVAILABLE' } }),
          currentUser
            ? prisma.product.count({
                where: {
                  sellerId: currentUserId,
                },
              })
            : Promise.resolve(0),
        ]);

        return { catalogData, dbCategories, activePostsCount, sellerPostsCount };
      },
      () => ({
        catalogData: { items: [], total: 0 },
        dbCategories: [],
        activePostsCount: 0,
        sellerPostsCount: 0,
      }),
      'Home page data load'
    );

    items = catalogData.items;
    total = catalogData.total;
    categoriesList = dbCategories.map((c) => c.name);
    totalActivePosts = activePostsCount;
    myProductsCount = sellerPostsCount;
  } catch (error) {
    console.error('Home page DB fallback:', error);
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const getPageNumbers = (current: number, totalPageCount: number) => {
    const pages: (number | string)[] = [];
    if (totalPageCount <= 5) {
      for (let i = 1; i <= totalPageCount; i += 1) {
        pages.push(i);
      }
      return pages;
    }

    if (current <= 5) {
      for (let i = 1; i <= 5; i += 1) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPageCount);
      return pages;
    }

    if (current >= totalPageCount - 4) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPageCount - 4; i <= totalPageCount; i += 1) {
        pages.push(i);
      }
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
    return `/?${queryParams.toString()}`;
  };

  return (
    <DashboardLayout activeItemId="catalog" pageTitle="Chợ Đồ Cũ Sinh Viên">
      <section className="pb-10">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4 auto-rows-[190px]">
          <div className="relative overflow-hidden rounded-[28px] border border-blue-500/20 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-700 p-8 text-white shadow-lg shadow-blue-500/10 group md:col-span-2 md:row-span-2 flex flex-col justify-between">
            <div className="pointer-events-none absolute -top-12 -right-12 h-64 w-64 rounded-full bg-white/10 blur-2xl transition-transform duration-700 group-hover:scale-110" />
            <div className="pointer-events-none absolute top-0 right-0 p-8 opacity-15 transition-all duration-500 group-hover:rotate-12 group-hover:scale-105">
              <HeartHandshake className="h-48 w-48" />
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-white/15 backdrop-blur-md">
              <HeartHandshake className="h-6 w-6 text-white" />
            </div>

            <div className="grid gap-3 lg:grid-cols-4">
              <h1 className="whitespace-nowrap text-[clamp(1.7rem,2.8vw,2.4rem)] font-black leading-none tracking-tight lg:col-span-4">
                Chợ đồ cũ sinh viên
              </h1>
              <p className="max-w-xl text-[clamp(0.72rem,1vw,0.9rem)] font-medium leading-tight text-blue-100 lg:col-span-4">
                Nơi kết nối và thanh lý đồ dùng học tập giá tốt nhất cho cộng đồng sinh viên.
                Mua bán nhanh chóng, an toàn và đáng tin cậy trong mạng lưới nội bộ.
              </p>

              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-4">
                <div className="inline-flex min-w-0 items-center gap-2 rounded-2xl bg-white/10 px-2.5 py-2 text-[11px] font-semibold text-white/90 lg:text-xs">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-200" />
                  <span>An toàn xác thực</span>
                </div>
                <div className="inline-flex min-w-0 items-center gap-2 rounded-2xl bg-white/10 px-2.5 py-2 text-[11px] font-semibold text-white/90 lg:text-xs">
                  <Zap className="h-4 w-4 shrink-0 text-cyan-200" />
                  <span>Giao dịch nhanh</span>
                </div>
                <div className="inline-flex min-w-0 items-center gap-2 rounded-2xl bg-white/10 px-2.5 py-2 text-[11px] font-semibold text-white/90 lg:text-xs">
                  <TrendingUp className="h-4 w-4 shrink-0 text-cyan-200" />
                  <span>Giá tốt cho sinh viên</span>
                </div>
                <Link
                  href="/?category=Tất cả danh mục"
                  className="inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-2xl bg-white px-3 py-2 text-[11px] font-medium text-blue-700 shadow-md transition-all hover:bg-zinc-50 hover:shadow-lg active:scale-[0.98] lg:text-xs"
                >
                  <span>Khám phá ngay</span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-blue-500/15 bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 p-6 shadow-sm group md:col-span-2 flex flex-col justify-start dark:border-blue-500/10">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />
            <div className="pointer-events-none absolute -right-10 -bottom-10 h-36 w-36 rounded-full bg-cyan-500/10 blur-2xl transition-all duration-500 group-hover:bg-cyan-500/15" />

            <div className="relative z-10 pt-4 md:pt-2">
              <h2 className="mb-2 bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-[clamp(1.05rem,1.6vw,1.25rem)] font-semibold tracking-tight text-transparent">
                Nền tảng chia sẻ đồ dùng
              </h2>
              <p className="max-w-xl text-[clamp(0.65rem,0.9vw,0.75rem)] leading-tight text-zinc-400">
                Trao đổi giáo trình, quần áo, xe cộ, đồ công nghệ tin cậy trong nội bộ các trường đại học.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2.5">
                <div className="flex items-center gap-2 whitespace-nowrap rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-[12px] font-medium text-white">
                  <HeartHandshake className="h-4 w-4 shrink-0 text-cyan-200" />
                  <span>Đồng đội SV</span>
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-[12px] font-medium text-white">
                  <TrendingUp className="h-4 w-4 shrink-0 text-cyan-200" />
                  <span>Duyệt tin nhanh</span>
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-[12px] font-medium text-white">
                  <MessageSquare className="h-4 w-4 shrink-0 text-cyan-200" />
                  <span>Phản hồi 24/7</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-blue-400/25 bg-gradient-to-br from-white via-blue-50 to-cyan-100/80 p-6 shadow-[0_18px_40px_-24px_rgba(37,99,235,0.45)] transition-all duration-300 hover:-translate-y-0.5 group flex flex-col justify-between dark:border-blue-500/20 dark:from-blue-950/30 dark:via-blue-950/40 dark:to-cyan-950/30">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-300" />
            <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-blue-500/20 blur-2xl transition-transform duration-500 group-hover:scale-125" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/12 text-blue-600 shadow-sm dark:text-blue-300">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="rounded-full border border-blue-500/15 bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-blue-600 dark:bg-white/10 dark:text-blue-300">
                Đang mở
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-4xl font-black leading-none tracking-tight text-blue-600 dark:text-blue-300">
                {totalActivePosts}+
              </span>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Tin đăng đang hoạt động trong chợ
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-cyan-400/30 bg-gradient-to-br from-cyan-50 via-sky-50 to-white p-6 shadow-[0_18px_40px_-24px_rgba(6,182,212,0.45)] transition-all duration-300 hover:-translate-y-0.5 group flex flex-col justify-between dark:border-cyan-500/20 dark:from-cyan-950/30 dark:via-sky-950/30 dark:to-zinc-950">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-400" />
            <div className="pointer-events-none absolute -left-8 -bottom-8 h-28 w-28 rounded-full bg-cyan-400/20 blur-2xl transition-transform duration-500 group-hover:scale-125" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/12 text-cyan-600 shadow-sm dark:text-cyan-300">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-cyan-500/15 bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-cyan-600 dark:bg-white/10 dark:text-cyan-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                <span>Online</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-4xl font-black leading-none tracking-tight text-cyan-600 dark:text-cyan-300">
                24/7
              </span>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Hỗ trợ và phản hồi luôn sẵn sàng
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="pb-20">
        <Suspense fallback={<GridSkeleton />}>
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

          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-1 md:gap-2">
              <Link
                href={buildPageUrl(Math.max(1, page - 1))}
                className={`w-10 h-10 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-150 dark:hover:bg-zinc-900 transition-all text-zinc-500 dark:text-zinc-400 ${
                  page === 1 ? 'pointer-events-none opacity-40' : ''
                }`}
                aria-label="Trang trước"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>

              {pageNumbers.map((p, idx) => {
                if (p === '...') {
                  return (
                    <span
                      key={`ell-${idx}`}
                      className="w-10 h-10 flex items-center justify-center text-zinc-400 font-medium"
                    >
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
                    className={`w-10 h-10 flex items-center justify-center rounded-xl font-medium text-sm transition-all ${
                      isActive
                        ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md shadow-blue-500/20 scale-105'
                        : 'border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}

              <Link
                href={buildPageUrl(Math.min(totalPages, page + 1))}
                className={`w-10 h-10 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-150 dark:hover:bg-zinc-900 transition-all text-zinc-500 dark:text-zinc-400 ${
                  page === totalPages ? 'pointer-events-none opacity-40' : ''
                }`}
                aria-label="Trang sau"
              >
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          )}
        </Suspense>
      </main>
    </DashboardLayout>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-80 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      ))}
    </div>
  );
}
