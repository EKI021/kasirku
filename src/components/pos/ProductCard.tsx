import React from 'react';
import { Plus, Package, AlertTriangle } from 'lucide-react';
import { Product } from '../../types';
import { formatRupiah } from '../../utils/currency';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  cartQuantity?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  cartQuantity = 0,
}) => {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.minStock;

  return (
    <div
      onClick={() => !isOutOfStock && onAddToCart(product)}
      className={`group relative bg-white rounded-2xl border transition-all duration-200 p-3.5 flex flex-col justify-between cursor-pointer select-none ${
        isOutOfStock
          ? 'border-slate-200 opacity-60 cursor-not-allowed bg-slate-50/70'
          : 'border-slate-200/90 hover:border-orange-300 hover:shadow-md hover:shadow-orange-500/5'
      }`}
    >
      {/* Top Image area */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center mb-3">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <Package className="w-12 h-12 text-slate-300" />
        )}

        {/* Stock status badge */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isOutOfStock ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white shadow-xs">
              Habis
            </span>
          ) : isLowStock ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-amber-500 text-white flex items-center gap-1 shadow-xs">
              <AlertTriangle className="w-2.5 h-2.5" />
              Sisa {product.stock}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/60 text-white backdrop-blur-xs">
              Stok: {product.stock} {product.unit}
            </span>
          )}
        </div>

        {/* Category Tag */}
        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/90 text-slate-700 shadow-2xs backdrop-blur-xs">
          {product.category}
        </span>

        {/* Cart Quantity indicator badge */}
        {cartQuantity > 0 && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
            {cartQuantity}
          </div>
        )}
      </div>

      {/* Info area */}
      <div>
        <div className="flex items-center justify-between gap-1 mb-1">
          <span
            className="text-[10px] font-mono text-slate-500 truncate bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100"
            title={`Barcode: ${product.barcode || '-'} | SKU: ${product.sku}`}
          >
            {product.barcode || product.sku}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">{product.unit}</span>
        </div>
        <h3
          className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors h-8"
          title={product.name}
        >
          {product.name}
        </h3>
      </div>

      {/* Price & Action Button matching reference */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-600 uppercase font-medium">Harga</span>
          <p className="text-sm font-bold text-slate-900 leading-tight">
            {formatRupiah(product.price)}
          </p>
        </div>

        <button
          type="button"
          disabled={isOutOfStock}
          onClick={(e) => {
            e.stopPropagation();
            if (!isOutOfStock) onAddToCart(product);
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isOutOfStock
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-500/30 group-hover:scale-105 active:scale-95'
          }`}
          title="Tambah ke Keranjang"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
