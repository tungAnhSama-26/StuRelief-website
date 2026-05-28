'use client';

import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Item } from '@/domain/entities/Item';
import { aiImageUrl } from '@/lib/aiImage';
import { PRODUCT_STATUS_CLASSES, PRODUCT_STATUS_LABELS } from '@shared';

interface ProductCardProps {
  product: Item;
  onDetail?: (product: Item) => void;
  onEdit?: (product: Item) => void;
  onDelete?: (product: Item) => void;
  showActions?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onDetail,
  onEdit,
  onDelete,
  showActions = false,
}) => {
  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(product.price);

  return (
    <div
      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      onClick={() => onDetail?.(product)}
      role={onDetail ? 'button' : undefined}
      tabIndex={onDetail ? 0 : undefined}
    >
      <div>
        <div className="aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 relative">
          <img
            src={product.images[0] || aiImageUrl(`realistic AI student marketplace product photo of ${product.name}`, { width: 400, height: 400, seed: product.id })}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ cursor: 'pointer' }}
          />

          {/* Bottom Left: Status & Quick Sell */}
          <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 items-start z-10">
            {product.isQuickSell && (
              <span className="bg-red-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse shadow-sm">
                Thanh lý gấp
              </span>
            )}
            {product.status !== 'AVAILABLE' && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm backdrop-blur-md ${PRODUCT_STATUS_CLASSES[product.status]}`}>
                {PRODUCT_STATUS_LABELS[product.status]}
              </span>
            )}
          </div>
        </div>

        <div className="p-4 pb-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-medium px-2 py-0.5 rounded-md">
              {product.category}
            </span>
            {product.sellerName && (
              <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-medium px-2 py-0.5 rounded-md line-clamp-1 max-w-[120px]">
                {product.sellerName}
              </span>
            )}
          </div>
          <h3 className="mb-1 line-clamp-1 text-sm font-semibold text-zinc-900 transition-colors group-hover:text-blue-600 dark:text-zinc-100">
            {product.name}
          </h3>
          <p className="text-base font-medium text-blue-600 dark:text-blue-400">
            {formattedPrice}
          </p>
          {product.description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
              {product.description}
            </p>
          )}
        </div>
      </div>

      <div className="p-4 pt-0">
        {showActions && (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(product);
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-900/25 dark:text-blue-400 dark:hover:bg-blue-900/40"
              aria-label="Chỉnh sửa"
              title="Chỉnh sửa"
            >
              <Pencil className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(product);
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 shadow-sm transition-all hover:border-red-300 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
              aria-label="Xóa"
              title="Xóa"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
