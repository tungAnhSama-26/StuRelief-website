'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search } from 'lucide-react';

interface SearchAndFilterProps {
  initialSearch?: string;
  initialCategory?: string;
  initialLimit?: number;
  onOpenCreateModal: () => void;
  categories: string[];
  basePath?: string;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  initialSearch = '',
  initialCategory = 'Tất cả danh mục',
  initialLimit = 8,
  onOpenCreateModal,
  categories,
  basePath = '/',
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [limit, setLimit] = useState(initialLimit);

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setCategory(searchParams.get('category') || 'Tất cả danh mục');
    setLimit(Number(searchParams.get('limit')) || 8);
  }, [searchParams]);

  const applyFilters = (searchVal: string, catVal: string, limitVal: number) => {
    const params = new URLSearchParams();
    params.set('page', '1');
    if (limitVal !== 8) params.set('limit', String(limitVal));
    if (searchVal.trim()) params.set('search', searchVal.trim());
    if (catVal && catVal !== 'Tất cả danh mục') params.set('category', catVal);
    const targetBasePath = basePath || pathname || '/';
    router.push(params.toString() ? `${targetBasePath}?${params.toString()}` : targetBasePath);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(search, category, limit);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cat = e.target.value;
    setCategory(cat);
    applyFilters(search, cat, limit);
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lim = Number(e.target.value);
    setLimit(lim);
    applyFilters(search, category, lim);
  };

  const handleClear = () => {
    setSearch('');
    setCategory('Tất cả danh mục');
    setLimit(8);
    const targetBasePath = basePath || pathname || '/';
    router.push(targetBasePath);
  };

  const allCategoriesOptions = ['Tất cả danh mục', ...categories];

  return (
    <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
      <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-zinc-400">
            <Search className="h-5 w-5" />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm sách vở, đồ dùng, điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-zinc-150 bg-zinc-50 py-3 pl-12 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:focus:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/15 transition-all hover:bg-blue-700"
        >
          <Search className="h-4 w-4" />
          Tìm kiếm
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={limit}
          onChange={handleLimitChange}
          className="cursor-pointer rounded-2xl border border-zinc-150 bg-zinc-50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="8">8 tin / trang</option>
          <option value="12">12 tin / trang</option>
          <option value="16">16 tin / trang</option>
          <option value="24">24 tin / trang</option>
        </select>

        <select
          value={category}
          onChange={handleCategoryChange}
          className="cursor-pointer rounded-2xl border border-zinc-150 bg-zinc-50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
        >
          {allCategoriesOptions.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {(search.trim() || category !== 'Tất cả danh mục' || limit !== 8) && (
          <button
            onClick={handleClear}
            className="px-3 py-3 text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Xóa bộ lọc
          </button>
        )}

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-md shadow-blue-500/15 transition-all hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
          Đăng bán ngay
        </button>
      </div>
    </div>
  );
};

export default SearchAndFilter;
