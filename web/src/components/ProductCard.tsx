'use client';

import React from 'react';
import { Item } from '@/domain/entities/Item';

interface ProductCardProps {
  product: Item;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(product.price);

  return (
    <div className="group relative bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
      {/* Product Image */}
      <div className="aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 relative">
        <img
          src={product.images[0] || 'https://via.placeholder.com/400x400?text=No+Image'}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Quick Sell Tag */}
        {product.isQuickSell && (
          <div className="absolute top-3 left-3">
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider animate-pulse">
              Thanh lý gấp
            </span>
          </div>
        )}

        {/* Category Tag */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="bg-white/80 dark:bg-black/60 backdrop-blur-md text-zinc-800 dark:text-zinc-200 text-xs px-2 py-1 rounded-lg">
            {product.category}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-lg font-bold text-zinc-900 dark:text-white">
          {formattedPrice}
        </p>
        
        <button className="mt-3 w-full py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
          Xem chi tiết
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
