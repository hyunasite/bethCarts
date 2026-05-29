import React, { useState } from 'react';
import { ShoppingBag, Check, Sparkles } from 'lucide-react';
import { Product, Order } from '../types';
import ProductDetailModal from './ProductDetailModal';

interface ProductCardProps {
  key?: string;
  product: Product;
  onAddToCart: (p: Product) => void;
  isAdded: boolean;
  onReserveInstant: (p: Product) => void;
  orders: Order[];
  onReserveDirect: (product: Product, name: string, queuingNumber: number, quantity: number) => Promise<void>;
}

export default function ProductCard({
  product,
  onAddToCart,
  isAdded,
  onReserveInstant,
  orders,
  onReserveDirect
}: ProductCardProps) {
  const isSoldOut = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'reserve'>('view');

  const handleOpenDetail = (mode: 'view' | 'reserve') => {
    setModalMode(mode);
    setIsDetailOpen(true);
  };

  // Determine explicit status matching user requirements:
  // Available (green), Reserved (yellow if stock = 0 but not paid), Sold (red if already paid)
  const getStatusDetails = () => {
    if (product.stock > 0) {
      return {
        label: 'AVAILABLE',
        colorClass: 'text-emerald-600',
        bgClass: 'bg-emerald-50 border-emerald-200',
        dotClass: 'bg-emerald-500 animate-pulse'
      };
    } else if (product.status === 'sold') {
      return {
        label: 'SOLD',
        colorClass: 'text-red-600',
        bgClass: 'bg-red-50 border-red-200',
        dotClass: 'bg-red-500'
      };
    } else {
      return {
        label: 'RESERVED',
        colorClass: 'text-amber-600',
        bgClass: 'bg-amber-50 border-amber-200',
        dotClass: 'bg-amber-500'
      };
    }
  };

  const statusInfo = getStatusDetails();

  return (
    <div 
      className="group bg-white rounded-2xl border border-purple-100/60 overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full"
      id={`product-card-${product.id}`}
    >
      {/* Product Image Stage */}
      <div 
        className="relative aspect-[3/4] bg-[#F7F5FA] overflow-hidden"
      >
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover ${
            isSoldOut ? 'opacity-50 grayscale-[10%]' : ''
          }`}
          loading="lazy"
        />

        {/* Category Pill - Top Right, Grey semi-transparent */}
        <span className="absolute top-3 right-3 bg-stone-700/75 backdrop-blur-xs text-white text-[9px] font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded">
          {product.category}
        </span>

        {/* Floating Low Stock Alert / Spark - Only 1 left! */}
        {!isSoldOut && product.stock === 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-amber-950 text-[10px] whitespace-nowrap font-sans font-semibold tracking-wide py-1 px-3 rounded-full flex items-center gap-1 shadow-sm border border-amber-300 animate-pulse">
            <Sparkles className="w-3 h-3 text-amber-850" />
            <span>Only 1 left!</span>
          </div>
        )}
      </div>

      {/* Product info details */}
      <div className="px-4.5 pb-4 pt-3.5 flex flex-col flex-grow">
        {/* Full-width Title that wraps */}
        <h3 className="font-sans text-sm font-bold text-stone-800 tracking-tight leading-snug line-clamp-2 mb-1.5 min-h-[36px]" title={product.name}>
          {product.name}
        </h3>

        {/* Stock Status Indicator Row with Bullet Dot */}
        <div className="flex items-center mb-0.5 select-none">
          <span className={`text-xs font-semibold tracking-wide ${statusInfo.colorClass}`}>
            • {statusInfo.label === 'AVAILABLE' ? 'Available' : statusInfo.label === 'SOLD' ? 'Sold Out' : 'Reserved Hold'}
          </span>
        </div>

        {/* Price and Stock Count Badge Row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-sans font-bold text-purple-600 tracking-tight">
            ₱{product.price}
          </span>
          <span className="text-xs font-sans text-stone-400 font-medium">
            {product.stock} {product.stock === 1 ? 'pc' : 'pcs'} left
          </span>
        </div>

        {/* Action buttons */}
        <div className="mt-auto pt-2 border-t border-stone-100/70 flex flex-col gap-2 w-full">
          {isSoldOut ? (
            <>
              {/* Disabled Cart Button */}
              <button
                disabled
                className="w-full bg-stone-50 border border-stone-200 text-stone-300 text-xs font-semibold py-3 px-3 rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5 min-h-[44px]"
                id={`add-btn-${product.id}`}
              >
                <ShoppingBag className="w-4 h-4 text-stone-200" />
                <span>Cart</span>
              </button>
              {/* Disabled Hold Button (as stock = 0, reserve button is disabled) */}
              <button
                disabled
                className="w-full bg-stone-100 border border-stone-200 text-stone-400 text-xs py-3 px-3 rounded-xl font-bold cursor-not-allowed text-center min-h-[44px]"
              >
                {statusInfo.label === 'SOLD' ? 'Sold Out' : 'Reserved Hold'}
              </button>
            </>
          ) : (
            <>
              {/* Cart Toggle Button */}
              <button
                onClick={() => onAddToCart(product)}
                className={`w-full border text-xs font-semibold py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all min-h-[44px] ${
                  isAdded 
                    ? 'bg-purple-50 text-purple-900 border-purple-300 font-bold'
                    : 'bg-white border-stone-200 hover:border-purple-300 text-stone-700 hover:text-purple-900'
                }`}
                id={`add-btn-${product.id}`}
              >
                <ShoppingBag className={`w-3.5 h-3.5 ${isAdded ? 'text-purple-700' : 'text-stone-500'}`} />
                <span>{isAdded ? 'In Cart' : 'Cart'}</span>
              </button>

              {/* Reserve Now Button - Gradient Purple inline */}
              <button
                onClick={() => handleOpenDetail('reserve')}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-98 transition-all text-white text-xs py-3 px-3 rounded-xl font-semibold flex items-center justify-center cursor-pointer shadow-sm text-center min-h-[44px]"
              >
                Reserve Now
              </button>
            </>
          )}
        </div>
      </div>

      {/* Dynamic Product Detail & Reservation Modal */}
      <ProductDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        product={product}
        orders={orders}
        onReserveDirect={async (customerName, queuingNumber, quantity) => {
          await onReserveDirect(product, customerName, queuingNumber, quantity);
        }}
        initialMode={modalMode}
      />
    </div>
  );
}
