import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

import { Product } from '@/lib/products';
import { useWishlistStore } from '@/lib/wishlist';

import fallbackProductImage from '@/assets/product-1.jpg';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({
  product,
  index = 0,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const { addItem, removeItem, isInWishlist } =
    useWishlistStore();

  const productId =
    product.productId || product._id || product.id || '';

  const isWishlisted = isInWishlist(productId);

  const isNew = product.newArrival || product.isNew;

  const discountPercentage =
    product.originalPrice &&
      product.price < product.originalPrice
      ? Math.round(
        ((product.originalPrice - product.price) /
          product.originalPrice) *
        100
      )
      : 0;

  // Calculate real-time available stock from embedded product data
  const counts = product.sizeCounts || {};
  const reserved = product.sizeReservedCounts || {};
  const hasSizeCounts = Object.keys(counts).length > 0;
  const available = hasSizeCounts
    ? Object.keys(counts).reduce(
        (sum, size) => sum + Math.max(0, (counts[size] || 0) - (reserved[size] || 0)),
        0
      )
    : Math.max(0, (product.stock || 0));

  // Flash animation when stock count changes in real-time (via socket → React Query cache → prop update)
  const prevAvailableRef = useRef<number | null>(null);
  const [stockFlash, setStockFlash] = useState<'down' | 'none'>('none');

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (prevAvailableRef.current !== null && prevAvailableRef.current !== available) {
      if (available < prevAvailableRef.current) {
        setStockFlash('down');
        const t = setTimeout(() => setStockFlash('none'), 900);
        cleanup = () => clearTimeout(t);
      }
    }
    prevAvailableRef.current = available;
    return cleanup;
  }, [available]);

  const handleWishlistToggle = (
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (isWishlisted) {
      removeItem(productId);
    } else {
      addItem(product);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
      }}
      className="group"
    >
      <Link to={`/product/${productId}`}>
        <div
          className="
            overflow-hidden
            rounded-[28px]
            border
            border-neutral-200
            bg-white
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-xl
          "
        >
          {/* IMAGE */}
          <div className="relative aspect-[3/3.6] overflow-hidden bg-neutral-100">
            <motion.img
              src={imageError ? fallbackProductImage : product.image}
              alt={product.name}
              onError={() => setImageError(true)}
              className={`
                h-full
                w-full
                object-cover
                transition-all
                duration-500
                group-hover:scale-105
                ${available <= 0 ? 'grayscale opacity-60' : ''}
              `}
            />

            {/* Out-of-stock overlay */}
            <AnimatePresence>
              {available <= 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/20 flex items-center justify-center"
                >
                  <span className="bg-white/90 text-black text-xs font-bold px-3 py-1 rounded-full tracking-widest uppercase shadow">
                    Sold Out
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* BADGES */}
            <div className="absolute left-3 top-3 flex flex-col gap-2">
              {isNew && (
                <span
                  className="
                    rounded-full
                    bg-blue-600
                    px-3
                    py-1
                    text-[10px]
                    font-semibold
                    tracking-[0.2em]
                    text-white
                    shadow-sm
                  "
                >
                  NEW
                </span>
              )}

              {discountPercentage > 0 && (
                <span
                  className="
                    rounded-full
                    bg-red-500
                    px-3
                    py-1
                    text-[10px]
                    font-semibold
                    text-white
                  "
                >
                  {discountPercentage}% OFF
                </span>
              )}
            </div>

            {/* WISHLIST */}
            <button
              onClick={handleWishlistToggle}
              className="
                absolute
                right-3
                top-3
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-white/90
                shadow-md
                backdrop-blur
              "
            >
              <Heart
                size={18}
                className={
                  isWishlisted
                    ? 'fill-red-500 text-red-500'
                    : 'text-neutral-700'
                }
              />
            </button>
          </div>

          {/* INFO */}
          <div className="space-y-2 p-4">
            <p
              className="
                text-[11px]
                uppercase
                tracking-[0.25em]
                text-neutral-400
              "
            >
              {product.category || 'Collection'}
            </p>

            <h3
              className="
                line-clamp-2
                text-[15px]
                font-medium
                leading-[1.4]
                text-neutral-900
              "
            >
              {product.name}
            </h3>

            {/* PRICE */}
            <div className="flex items-center gap-2 pt-1">
              <span
                className="
                  text-xl
                  font-bold
                  tracking-tight
                  text-black
                "
              >
                ₹{product.price.toLocaleString('en-IN')}
              </span>

              {/* ORIGINAL PRICE */}
              {product.originalPrice && (
                <span
                  className="
                    text-sm
                    font-medium
                    text-neutral-400
                    line-through
                  "
                >
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* STOCK STATUS — animates when stock changes in real-time */}
            <AnimatePresence mode="wait">
              {available <= 0 ? (
                <motion.span
                  key="oos"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="block text-[11px] font-semibold text-red-500 tracking-wider"
                >
                  OUT OF STOCK
                </motion.span>
              ) : available <= 5 ? (
                <motion.span
                  key={`low-${available}`}
                  initial={{ opacity: 0, scale: stockFlash === 'down' ? 1.2 : 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`block text-[11px] font-semibold tracking-wider ${stockFlash === 'down' ? 'text-red-500' : 'text-amber-600'}`}
                >
                  ONLY {available} LEFT
                </motion.span>
              ) : (
                <motion.span
                  key="in-stock"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="block text-[11px] font-medium text-green-600 tracking-wider"
                >
                  {available} IN STOCK
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
