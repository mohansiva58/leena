import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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

import { productService } from '@/services/productService';
import { saleService } from '@/services/saleService';

import logo from '@/assets/logo.png';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] =
    useState<Product | null>(null);

  const [recentProducts, setRecentProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] = useState(true);

  const [selectedSize, setSelectedSize] =
    useState<string | null>(null);

  const [selectedColor, setSelectedColor] =
    useState<string | null>(null);

  const [selectedImage, setSelectedImage] =
    useState<string>();

  const [quantity, setQuantity] = useState(1);
  const [sizeCounts, setSizeCounts] = useState<Record<string, number>>({});

  const [showAuthModal, setShowAuthModal] =
    useState(false);

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

  const addSelectionsToCart = () => {
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
    const totalRequested = selections.reduce((sum, entry) => sum + entry.quantity, 0);
    const productId = getProductId(product);
    const existingQuantity = useCartStore.getState().items.reduce((sum, item) => {
      return getProductId(item.product) === productId &&
        item.color === (selectedColor || undefined) &&
        getCartItemImage(item) === cartImage
        ? sum + item.quantity
        : sum;
    }, 0);

    if (product.stock !== undefined && existingQuantity + totalRequested > product.stock) {
      toast.error(`Only ${product.stock} total item(s) available in stock.`);
      return false;
    }

    if (selectedSize && product.sizeCounts) {
      const selectedRemaining = product.sizeCounts[selectedSize] ?? 0;
      if (selectedRemaining <= 0) {
        toast.error(`${selectedSize} is out of stock`);
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

  const {
    addItem: addToWishlist,
    removeItem: removeFromWishlist,
    isInWishlist,
  } = useWishlistStore();

  const { isAuthenticated } = useAuth();

  const isWishlisted = product
    ? isInWishlist(
      product.productId ||
      product.id ||
      product._id ||
      ''
    )
    : false;

  /* FETCH PRODUCT */

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      setLoading(true);
      setSelectedSize(null);
      setSelectedColor(null);
      setSelectedImage(undefined);
      setQuantity(1);
      setSizeCounts({});

      try {
        let data: Product | null = null;

        try {
          data =
            await productService.getProductById(id);
        } catch (productError: unknown) {
          const error = productError as {
            response?: { status?: number };
          };

          if (error?.response?.status === 404) {
            const saleData =
              await saleService.getSaleById(id);

            const sale = saleData as {
              saleId?: string;
              _id?: string;
            };

            data = {
              ...saleData,
              productId: sale.saleId || sale._id,
              id: sale._id,
            } as Product;
          } else {
            throw productError;
          }
        }

        if (!data) return;

        setProduct(data);

        if (data.colors && data.colors.length > 0) {
          setSelectedColor(data.colors[0].colorName);
          setSelectedImage(data.colors[0].image?.url || data.image);
        } else {
          setSelectedImage(data.image);
        }

        const recentResponse =
          await productService.getPagedProducts({
            page: 1,
            limit: 8,
          });

        const currentProductIds = new Set(
          [id, data.productId, data.id, data._id].filter(Boolean)
        );

        const filtered = recentResponse.items
          .filter(
            (p: Product) =>
              !currentProductIds.has(p.productId) &&
              !currentProductIds.has(p.id) &&
              !currentProductIds.has(p._id)
          )
          .slice(0, 4);

        setRecentProducts(filtered);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();

    window.scrollTo(0, 0);
  }, [id]);

  /* LOADING */

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />

        <div className="flex h-screen items-center justify-center">
          <img src={logo} alt="Loading..." className="h-12 w-auto animate-pulse" />
        </div>

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

  /* ADD TO CART */

  const handleAddToCart = () => {
    if (
      product.stock !== undefined &&
      product.stock <= 0
    ) {
      toast.error('Out of stock');
      return;
    }

    const success = addSelectionsToCart();

    if (success) {
      toast.success('Added to cart');
    }
  };

  /* BUY NOW */

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const success = addSelectionsToCart();

    if (success) {
      navigate('/checkout');
    }
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
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-full
                        border
                        border-green-200
                        bg-green-50
                        px-4
                        py-2
                        text-sm
                        font-medium
                        text-green-700
                      "
                    >
                      <div className="h-2 w-2 rounded-full bg-green-500" />

                      {product.stock > 0
                        ? `${product.stock} In Stock`
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
                    const remaining = sizeAvailability[size];
                    const isOutOfStock = typeof remaining === 'number' ? remaining <= 0 : (product.stock ?? 0) <= 0;

                    return (
                    <button
                      key={size}
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
                        ${isOutOfStock
                          ? 'cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400'
                          : selectedSize === size
                            ? 'border-black bg-black text-white'
                            : 'border-neutral-300 bg-white text-black'
                        }
                      `}
                    >
                      <span className="flex items-center gap-2">
                        <span>{size}</span>
                        <span className="text-[10px] opacity-75">
                          {typeof remaining === 'number' ? `${remaining} left` : ''}
                        </span>
                      </span>
                    </button>
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
                  className="
                    flex
                    flex-1
                    items-center
                    justify-center
                    gap-2
                    rounded-full
                    border
                    border-neutral-300
                    bg-white
                    py-4
                    font-semibold
                    transition-all
                    hover:bg-neutral-100
                  "
                >
                  <ShoppingBag size={18} />
                  Add To Cart
                </button>

                <button
                  onClick={handleBuyNow}
                  className="
                    flex-1
                    rounded-full
                    bg-black
                    py-4
                    font-semibold
                    text-white
                    transition-all
                    hover:opacity-90
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
            if (product && addSelectionsToCart()) {
              navigate('/checkout');
            }
        }}
      />

      <Footer />
    </div>
  );
}
