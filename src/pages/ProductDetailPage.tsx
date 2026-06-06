import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  ShieldCheck,
  Truck,
  ChevronLeft,
  Star,
  Sparkles,
  CreditCard,
} from 'lucide-react';

import { toast } from 'sonner';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { ProductGallery } from '@/components/ProductGallery';
import { AuthModal } from '@/components/AuthModal';

import { Product, ColorVariant } from '@/lib/products';

import { useCartStore, getProductId, getCartItemImage } from '@/lib/cart';
import { useWishlistStore } from '@/lib/wishlist';

import { useAuth } from '@/hooks/useAuth';
import { useRealTimeStock } from '@/hooks/useRealTimeStock';

import { productService } from '@/services/productService';
import { saleService } from '@/services/saleService';
import { cartService } from '@/services/cartService';
import { applyServerCartToLocal, notifyCartChangedAcrossTabs } from '@/lib/cartServerSync';
import { Skeleton } from '@/components/ui/skeleton';

import logo from '@/assets/logo.png';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  useRealTimeStock();

  const [selectedImage, setSelectedImage] = useState<string | undefined>();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeCounts, setSizeCounts] = useState<Record<string, number>>({});
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Fetch product using React Query
  const { data: product, isLoading: loading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        return await productService.getProductById(id);
      } catch (err: unknown) {
        const error = err as { response?: { status?: number } };
        if (error?.response?.status === 404) {
          const sale = await saleService.getSaleById(id);
          return {
            ...sale,
            productId: sale.saleId || sale._id,
            id: sale._id,
          } as Product;
        }
        throw err;
      }
    },
    enabled: !!id,
  });

  // Fetch recent products
  const { data: recentProducts = [] } = useQuery({
    queryKey: ['products', 'recent', id],
    queryFn: async () => {
      const response = await productService.getPagedProducts({ page: 1, limit: 8 });
      const currentProductIds = new Set([id, product?.productId, product?.id, product?._id].filter(Boolean));
      return response.items
        .filter((p: Product) => !currentProductIds.has(p.productId) && !currentProductIds.has(p.id) && !currentProductIds.has(p._id))
        .slice(0, 4);
    },
    enabled: !!product,
  });

  const addItem = useCartStore(
    (state) => state.addItem
  );

  const updateBulkSizeCount = (size: string, delta: number) => {
    setSizeCounts((current) => {
      const nextValue = Math.max(0, (current[size] || 0) + delta);
      return { ...current, [size]: nextValue };
    });
  };

  const clearBulkSizeCounts = () => {
    setSizeCounts({});
  };

  const getSelectedSizeEntries = () => {
    if (!product) return [] as Array<{ size: string; quantity: number }>;

    const sizeList = Array.isArray(product.sizes)
      ? product.sizes
      : String(product.sizes || '').split(',').map((size) => size.trim()).filter(Boolean);
    const bulkEntries = sizeList
      .map((size) => ({ size, quantity: sizeCounts[size] || 0 }))
      .filter((entry) => entry.quantity > 0);

    if (bulkEntries.length > 0) {
      return bulkEntries;
    }

    if (!selectedSize) {
      return [] as Array<{ size: string; quantity: number }>;
    }

    return [{ size: selectedSize, quantity }];
  };

  const addSelectionsToCart = async () => {
    if (!product) return false;

    const selections = getSelectedSizeEntries();
    if (selections.length === 0) {
      toast.error('Please select a size');
      return false;
    }

    const activeColorVariant = product.colors?.find(
      (c) => c.colorName === selectedColor
    );
    const cartImage = selectedImage || activeColorVariant?.image?.url || product.image;
    const productId = getProductId(product);

    for (const selection of selections) {
      const existingQuantity = useCartStore.getState().items.reduce((sum, item) => {
        return getProductId(item.product) === productId &&
          item.size === selection.size &&
          item.color === (selectedColor || undefined) &&
          getCartItemImage(item) === cartImage
          ? sum + item.quantity
          : sum;
      }, 0);

      const availableForSize = product.sizeCounts && Object.prototype.hasOwnProperty.call(product.sizeCounts, selection.size)
        ? Math.max(0, Number(product.sizeCounts[selection.size] || 0) - Number(product.sizeReservedCounts?.[selection.size] || 0))
        : product.stock;

      if (availableForSize !== undefined && availableForSize <= 0) {
        toast.error(`${selection.size} is out of stock`);
        return false;
      }

      if (availableForSize !== undefined && existingQuantity + selection.quantity > availableForSize) {
        const remaining = Math.max(0, availableForSize - existingQuantity);
        if (remaining === 0) {
          toast.error(`You already have all available ${selection.size} item(s) in your cart.`);
        } else {
          toast.error(`Only ${remaining} more item(s) available for size ${selection.size}.`);
        }
        return false;
      }
    }

    if (isAuthenticated) {
      try {
        const cart = await cartService.addToCart(
          productId,
          selections[0].size,
          selections[0].quantity,
          cartImage,
          selectedColor || undefined,
          selections
        );
        applyServerCartToLocal(cart);
        notifyCartChangedAcrossTabs();
        return true;
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { error?: string } } };
        toast.error(apiError.response?.data?.error || 'Failed to add item to cart');
        return false;
      }
    }

    for (const selection of selections) {
      const success = addItem(
        product,
        selection.size,
        selection.quantity,
        cartImage,
        selectedColor || undefined
      );

      if (!success) {
        return false;
      }
    }

    return true;
  };

  const { isAuthenticated } = useAuth();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const isWishlisted = isInWishlist(id || '');

  // Update selected color/image when product loads
  useEffect(() => {
    if (product) {
      if (product.colors && product.colors.length > 0 && !selectedColor) {
        setSelectedColor(product.colors[0].colorName);
        setSelectedImage(product.colors[0].image?.url || product.image);
      } else if (!selectedImage) {
        setSelectedImage(product.image);
      }
    }
  }, [product, selectedColor, selectedImage]);

  useEffect(() => {
    // Reset selections when product ID changes
    setSelectedSize(null);
    setSelectedColor(null);
    setSelectedImage(undefined);
    setQuantity(1);
    setSizeCounts({});
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8 pt-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Skeleton className="aspect-[3/4] rounded-3xl" />
            <div className="space-y-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <div className="space-y-4">
                <Skeleton className="h-6 w-20" />
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-16 rounded-full" />)}
                </div>
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-14 flex-1 rounded-full" />
                <Skeleton className="h-14 flex-1 rounded-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* NOT FOUND */

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />

        <div className="flex h-screen flex-col items-center justify-center">
          <h2 className="mb-3 text-2xl font-semibold">
            Product Not Found
          </h2>

          <Link
            to="/shop"
            className="text-black underline"
          >
            Back to Shop
          </Link>
        </div>

        <Footer />
      </div>
    );
  }

  /* GALLERY */

  const galleryImages = (() => {
    const images: string[] = [];

    const activeColorVariant = product.colors?.find(
      (c) => c.colorName === selectedColor
    );

    if (activeColorVariant) {
      if (activeColorVariant.image?.url?.trim()) {
        images.push(activeColorVariant.image.url);
      }
      if (Array.isArray(activeColorVariant.images)) {
        activeColorVariant.images.forEach((img) => {
          if (img?.url?.trim()) {
            images.push(img.url);
          }
        });
      }
    } else {
      if (product.image?.trim()) {
        images.push(product.image);
      }

      if (
        Array.isArray(product.images) &&
        product.images.length > 0
      ) {
        const additional = product.images.filter(
          (img: string) =>
            img?.trim() && img !== product.image
        );

        images.push(...additional);
      }
    }

    return [...new Set(images)].filter(Boolean);
  })();

  const availableSizes = Array.isArray(product.sizes)
    ? product.sizes
    : String(product.sizes || '').split(',').map((size) => size.trim()).filter(Boolean);
  const sizeAvailability = product.sizeCounts || {};
  const sizeReserved = product.sizeReservedCounts || {};

  // Available stock per size: Total - Reserved
   const getAvailableStock = (size: string) => {
     const total = sizeAvailability[size] || 0;
     const reserved = sizeReserved[size] || 0;
     return Math.max(0, total - reserved);
   };

   const totalAvailableStock = Object.keys(sizeAvailability).length > 0
    ? Object.keys(sizeAvailability).reduce((acc, size) => acc + getAvailableStock(size), 0)
    : Math.max(0, (product.stock || 0) - Object.values(sizeReserved).reduce((a, b) => a + b, 0));

  /* ADD TO CART */

  const handleAddToCart = async () => {
    if (totalAvailableStock <= 0) {
      toast.error('Out of stock');
      return;
    }

    const success = await addSelectionsToCart();

    if (success) {
      toast.success('Added to cart');
    }
  };

  /* BUY NOW */

  const performBuyNow = async () => {
    useCartStore.getState().clearReservations();
    const success = await addSelectionsToCart();
    if (success) {
      navigate('/checkout');
    }
  };

  const handleBuyNow = async () => {
    if (totalAvailableStock <= 0) {
      toast.error('Out of stock');
      return;
    }
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const selections = getSelectedSizeEntries();
    if (selections.length === 0) {
      toast.error('Please select a size');
      return;
    }

    await performBuyNow();
  };

  /* WISHLIST */

  const handleWishlistToggle = () => {
    const productId =
      product.productId ||
      product.id ||
      product._id ||
      '';

    if (isWishlisted) {
      removeFromWishlist(productId);

      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);

      toast.success('Added to wishlist');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="bg-white pt-16 lg:pt-20 pb-8">
        <div className="mx-auto max-w-7xl px-4">
          {/* BREADCRUMB */}

          <div className="mb-5">
            <Link
              to="/shop"
              className="
                inline-flex
                items-center
                gap-2
                text-sm
                font-medium
                text-neutral-500
                transition-colors
                hover:text-black
              "
            >
              <ChevronLeft size={18} />
              Back to Shop
            </Link>
          </div>

          {/* MAIN GRID */}

          <div
            className="
              grid
              gap-6
              lg:grid-cols-[0.9fr_1fr]
            "
          >
            {/* GALLERY */}

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="
                relative
                lg:sticky
                lg:top-24
              "
            >
              <div
                className="
                  overflow-hidden
                  rounded-[32px]
                  border
                  border-neutral-200
                  bg-neutral-50
                "
              >
                <ProductGallery
                  images={galleryImages}
                  productName={product.name}
                  selectedImage={selectedImage}
                  onSelectedImageChange={(img) =>
                    setSelectedImage(img)
                  }
                />
              </div>

              {/* BADGES */}

              <div className="absolute left-4 top-4 flex flex-col gap-2">
                {(product.isNew ||
                  product.newArrival) && (
                    <span
                      className="
                      rounded-full
                      bg-black
                      px-4
                      py-1.5
                      text-[10px]
                      font-semibold
                      tracking-[0.2em]
                      text-white
                    "
                    >
                      NEW
                    </span>
                  )}
              </div>

              {/* WISHLIST */}

              <button
                onClick={handleWishlistToggle}
                className="
                  absolute
                  right-4
                  top-4
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-full
                  bg-white/90
                  shadow-lg
                  backdrop-blur
                "
              >
                <Heart
                  size={20}
                  className={
                    isWishlisted
                      ? 'fill-red-500 text-red-500'
                      : 'text-black'
                  }
                />
              </button>
            </motion.div>

            {/* INFO SECTION */}

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              {/* CATEGORY */}

              <div>
                <p
                  className="
                    mb-2
                    text-xs
                    font-medium
                    uppercase
                    tracking-[0.3em]
                    text-neutral-400
                  "
                >
                  {product.category}
                </p>

                {/* TITLE */}

                <h1
                  className="
                    text-3xl
                    font-semibold
                    leading-tight
                    tracking-tight
                    text-black
                    sm:text-4xl
                  "
                >
                  {product.name}
                </h1>

                {/* RATING */}

                <div className="mt-3 flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={
                          i <
                            Math.floor(
                              product.rating || 5
                            )
                            ? 'fill-black text-black'
                            : 'text-neutral-300'
                        }
                      />
                    ))}
                  </div>

                  <span className="text-sm text-neutral-500">
                    Premium Quality
                  </span>
                </div>

                {/* PRICE */}

                <div className="mt-5 flex items-center gap-3 flex-wrap">
                  <span
                    className="
                      text-3xl
                      font-bold
                      tracking-tight
                      text-black
                    "
                  >
                    ₹
                    {product.price.toLocaleString()}
                  </span>

                  {product.originalPrice && (
                    <>
                      <span
                        className="
                          text-lg
                          text-neutral-400
                          line-through
                        "
                      >
                        ₹
                        {product.originalPrice.toLocaleString()}
                      </span>

                      <span
                        className="
                          rounded-full
                          bg-red-50
                          px-3
                          py-1
                          text-xs
                          font-semibold
                          text-red-500
                        "
                      >
                        {Math.round(
                          (1 -
                            product.price /
                            product.originalPrice) *
                          100
                        )}
                        % OFF
                      </span>
                    </>
                  )}
                </div>

                {/* STOCK */}

                {product.stock !== undefined && (
                  <div className="mt-4">
                    <div
                      className={`
                        inline-flex
                        items-center
                        gap-2
                        rounded-full
                        border
                        px-4
                        py-2
                        text-sm
                        font-medium
                        transition-all
                        duration-300
                        ${totalAvailableStock > 0 
                          ? 'border-green-200 bg-green-50 text-green-700' 
                          : 'border-red-200 bg-red-50 text-red-700'
                        }
                      `}
                    >
                      <div className={`h-2 w-2 rounded-full ${totalAvailableStock > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />

                      {totalAvailableStock > 0
                        ? `${totalAvailableStock} In Stock`
                        : 'Out Of Stock'}
                    </div>
                  </div>
                )}
              </div>

              {/* DETAILS CARD */}

              <div
                className="
                  rounded-[28px]
                  border
                  border-neutral-200
                  bg-neutral-50
                  p-5
                "
              >
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles size={16} />

                  <h2
                    className="
                      text-sm
                      font-semibold
                      uppercase
                      tracking-[0.2em]
                    "
                  >
                    Product Details
                  </h2>
                </div>

                <p
                  className="
                    text-sm
                    leading-7
                    text-neutral-600
                  "
                >
                  {product.description}
                </p>
              </div>

              {/* SIZE */}

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">
                    Select Size
                  </h3>

                  {/* <button
                    className="
                      text-sm
                      text-neutral-500
                    "
                  >
                    Size Guide
                  </button> */}
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => {
                    const remaining = getAvailableStock(size);
                    const isOutOfStock = remaining <= 0;

                    return (
                    <motion.button
                      key={`${size}-${remaining}`}
                      initial={false}
                      animate={remaining === 0 ? {
                        backgroundColor: ["#ffffff", "#fee2e2", "#f9fafb"],
                        transition: { duration: 0.8 }
                      } : {}}
                      disabled={isOutOfStock}
                      onClick={() =>
                        setSelectedSize(size)
                      }
                      className={`
                        h-11
                        min-w-[84px]
                        rounded-full
                        border
                        px-4
                        text-sm
                        font-medium
                        transition-all
                        relative
                        overflow-hidden
                        ${isOutOfStock
                          ? 'cursor-not-allowed border-neutral-200 bg-neutral-50 text-neutral-400'
                          : selectedSize === size
                            ? 'border-black bg-black text-white'
                            : 'border-neutral-300 bg-white text-black hover:border-black'
                        }
                      `}
                    >
                      {/* Strike-through for Out of Stock */}
                      <AnimatePresence>
                        {isOutOfStock && (
                          <motion.div 
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: "140%", opacity: 1 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                          >
                            <div className="w-full h-[2px] bg-red-500 -rotate-[35deg] transform origin-center shadow-sm" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      <span className="flex items-center gap-2 relative z-10">
                        <span>{size}</span>
                        <motion.span 
                          key={remaining}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`text-[10px] ${isOutOfStock ? 'text-neutral-400' : 'opacity-75'}`}
                        >
                          {isOutOfStock ? 'Out' : `${remaining} left`}
                        </motion.span>
                      </span>
                    </motion.button>
                  )})}
                </div>

             
              </div>

              {/* COLORS */}

              {product.colors &&
                product.colors.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-semibold">
                      Select Color
                    </h3>

                    <div className="flex flex-wrap gap-4">
                      {product.colors.map(
                        (
                          color: ColorVariant,
                          idx: number
                        ) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedColor(
                                color.colorName
                              );

                              setSelectedImage(
                                color.image?.url
                              );
                            }}
                            className="flex flex-col items-center gap-2"
                          >
                            <div
                              className={`
                              h-10
                              w-10
                              rounded-full
                              border-2
                              ${selectedColor ===
                                  color.colorName
                                  ? 'border-black'
                                  : 'border-neutral-300'
                                }
                            `}
                              style={{
                                backgroundColor:
                                  color.colorCode ||
                                  '#ddd',
                              }}
                            />

                            <span className="text-xs text-neutral-500">
                              {color.colorName}
                            </span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* QUANTITY */}

              <div>
                <h3 className="mb-3 font-semibold">
                  Quantity
                </h3>
                <p className="mb-3 text-xs text-neutral-500">
                  Use this for a single selected size. Bulk counts above will override this section.
                </p>

                <div
                  className="
                    inline-flex
                    items-center
                    rounded-full
                    border
                    border-neutral-200
                    bg-neutral-50
                    p-1
                  "
                >
                  <button
                    onClick={() =>
                      setQuantity(
                        Math.max(
                          1,
                          quantity - 1
                        )
                      )
                    }
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                    "
                  >
                    <Minus size={16} />
                  </button>

                  <span className="w-10 text-center font-semibold">
                    {quantity}
                  </span>

                  <button
                    onClick={() =>
                      setQuantity(quantity + 1)
                    }
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                    "
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* ACTION BUTTONS */}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={totalAvailableStock <= 0}
                  className="
                    flex
                    flex-1
                    items-center
                    justify-center
                    gap-2
                    rounded-full
                    border
                    border-neutral-200
                    bg-white
                    py-4
                    font-semibold
                    text-black
                    transition-all
                    hover:bg-neutral-50
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >
                  <ShoppingBag size={18} />
                  Add To Cart
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={totalAvailableStock <= 0}
                  className="
                    flex-1
                    rounded-full
                    bg-black
                    py-4
                    font-semibold
                    text-white
                    transition-all
                    hover:opacity-90
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >
                  Buy Now
                </button>
              </div>

              {/* FEATURES */}

              <div
                className="
                  grid
                  grid-cols-3
                  gap-3
                  border-t
                  border-neutral-200
                  pt-5
                "
              >
                <div className="text-center">
                  <Truck
                    className="mx-auto mb-2"
                    size={20}
                  />

                  <p className="text-xs text-neutral-500">
                    Fast Shipping
                  </p>
                </div>

                <div className="text-center">
                  <CreditCard
                    className="mx-auto mb-2"
                    size={20}
                  />

                  <p className="text-xs text-neutral-500">
                    Secure Payment
                  </p>
                </div>

                <div className="text-center">
                  <ShieldCheck
                    className="mx-auto mb-2"
                    size={20}
                  />

                  <p className="text-xs text-neutral-500">
                    Premium Quality
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RECENT PRODUCTS */}

          {recentProducts.length > 0 && (
            <section className="mt-12">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p
                    className="
                      mb-2
                      text-xs
                      font-medium
                      uppercase
                      tracking-[0.25em]
                      text-neutral-400
                    "
                  >
                    Recently Posted
                  </p>

                <h2
                  className="
                    text-2xl
                    font-semibold
                    tracking-tight
                    text-black
                  "
                >
                  Latest Arrivals
                </h2>
                </div>

                <Link
                  to="/shop?filter=new"
                  className="
                    hidden
                    text-sm
                    font-medium
                    text-neutral-500
                    transition-colors
                    hover:text-black
                    sm:inline
                  "
                >
                  View All
                </Link>
              </div>

              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                  sm:grid-cols-3
                  lg:grid-cols-4
                "
              >
                {recentProducts.map(
                  (product, index) => (
                    <ProductCard
                      key={
                        product.productId ||
                        product.id ||
                        product._id
                      }
                      product={product}
                      index={index}
                    />
                  )
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* AUTH MODAL */}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() =>
          setShowAuthModal(false)
        }
        onSuccess={() => {
          if (product) {
            performBuyNow();
          }
        }}
      />

      <Footer />
    </div>
  );
}
