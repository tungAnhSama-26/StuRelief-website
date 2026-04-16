import { Suspense } from 'react';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { PrismaItemRepository } from '@/infrastructure/persistence/PrismaItemRepository';
import { GetItemsUseCase } from '@/use-cases/items/GetItemsUseCase';

interface SearchParams {
  page?: string;
  limit?: string;
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

  const { items, total } = await getItemsUseCase.execute(page, limit);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
      {/* Hero Section - Bento Grid Style */}
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[200px]">
          <div className="md:col-span-2 md:row-span-2 rounded-3xl bg-blue-600 p-8 flex flex-col justify-end text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
              <svg className="w-40 h-40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.45l8.27 14.3H3.73L12 5.45z"/></svg>
            </div>
            <h1 className="text-4xl font-bold mb-2">Chợ đồ cũ sinh viên</h1>
            <p className="text-blue-100 max-w-xs text-lg">Nơi kết nối và thanh lý đồ dùng học tập giá tốt nhất cho cộng đồng sinh viên.</p>
          </div>
          <div className="md:col-span-2 rounded-3xl bg-zinc-900 dark:bg-zinc-800 p-6 flex items-center justify-between group overflow-hidden">
            <div>
              <h2 className="text-2xl font-semibold text-white">Đăng tin nhanh</h2>
              <p className="text-zinc-400">Tiếp cận hàng nghìn bạn sinh viên khác.</p>
            </div>
            <button className="bg-white text-black px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-transform">
              Bắt đầu ngay
            </button>
          </div>
          <div className="rounded-3xl bg-pink-100 dark:bg-pink-900/30 p-6 flex flex-col justify-center text-pink-700 dark:text-pink-300">
            <span className="text-xs font-bold uppercase tracking-wider mb-1">Mới nhất</span>
            <span className="text-3xl font-black">{total}+</span>
            <span className="text-sm">Sản phẩm hôm nay</span>
          </div>
          <div className="rounded-3xl bg-indigo-100 dark:bg-indigo-900/30 p-6 flex flex-col justify-center text-indigo-700 dark:text-indigo-300">
            <span className="text-xs font-bold uppercase tracking-wider mb-1">Tin cậy</span>
            <span className="text-3xl font-black">100%</span>
            <span className="text-sm">Verified Student ID</span>
          </div>
        </div>
      </section>

      {/* Main Content - Product Grid */}
      <main className="max-w-7xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Khám phá sản phẩm</h2>
          <div className="flex gap-2">
            <select className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm outline-none">
              <option>Tất cả danh mục</option>
              <option>Sách vở</option>
              <option>Đồ gia dụng</option>
              <option>Thiết bị điện tử</option>
            </select>
          </div>
        </div>

        <Suspense fallback={<GridSkeleton />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.length > 0 ? (
              items.map((item) => (
                <ProductCard key={item.id} product={item as any} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <p className="text-zinc-500">Chưa có sản phẩm nào được đăng bán.</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center gap-2">
              <Link
                href={`/?page=${Math.max(1, page - 1)}`}
                className={`px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900 transition-colors ${page === 1 ? 'pointer-events-none opacity-50' : ''}`}
              >
                Trang trước
              </Link>
              <div className="flex items-center px-4 font-medium">
                {page} / {totalPages}
              </div>
              <Link
                href={`/?page=${Math.min(totalPages, page + 1)}`}
                className={`px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900 transition-colors ${page === totalPages ? 'pointer-events-none opacity-50' : ''}`}
              >
                Trang sau
              </Link>
            </div>
          )}
        </Suspense>
      </main>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="animate-pulse bg-zinc-200 dark:bg-zinc-800 h-80 rounded-2xl"></div>
      ))}
    </div>
  );
}
