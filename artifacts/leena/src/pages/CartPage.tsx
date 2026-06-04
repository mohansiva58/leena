import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, ChevronLeft, Zap } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCartStore, getProductId, getCartItemImage, getCartLineKey } from '@/lib/cart';
import { useRealTimeStock } from '@/hooks/useRealTimeStock';

// Sub-component: renders the live stock badge for one cart line, flashes when it changes
function LiveStockBadge({ available, quantity, size }: { available: number; quantity: number; size: string }) {
  const prevRef = useRef<number | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (prevRef.current !== null && prevRef.current !== available) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 900);
      cleanup = () => clearTimeout(t);
    }
    prevRef.current = available;
    return cleanup;
  }, [available]);

  if (available <= 0) {
    return (
      <motion.span
        key={`oos-${size}`}
        initial={{ scale: 1.15, backgroundColor: '#fef2f2' }}
        animate={{ scale: 1, backgroundColor: 'transparent' }}
        className={`inline-flex items-center gap-1 text-xs font-semibold text-red-600 mt-1 ${flash ? 'animate-pulse' : ''}`}
      >
        <Zap size={10} className="fill-red-600" />
        Out of stock
      </motion.span>
    );
  }
  if (available < quantity) {
    return (
      <motion.span
        key={`low-${size}-${available}`}
        initial={{ scale: flash ? 1.12 : 1 }}
        animate={{ scale: 1 }}
        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 mt-1"
      >
        <Zap size={10} className="fill-amber-600" />
        Only {available} available
      </motion.span>
    );
  }
  return null;
}

export default function CartPage() {
  useRealTimeStock();
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore();
  const [promoCode] = useState('');
  void promoCode;

  const subtotal = getTotalPrice();
  const total = subtotal;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart size={40} className="text-muted-foreground" />
              </div>
              <h1 className="font-serif text-3xl font-bold text-foreground mb-4">
                Your cart is empty
              </h1>
              <p className="text-muted-foreground mb-8">
                Looks like you haven't added anything to your cart yet.
              </p>
              <Link to="/shop">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Start Shopping
                  <ArrowRight size={18} />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Check if any item is out of stock or has insufficient stock
  const hasStockIssues = items.some((item) => {
    const counts = item.product.sizeCounts || {};
    const reserved = item.product.sizeReservedCounts || {};
    const available = Math.max(0, (counts[item.size] || 0) - (reserved[item.size] || 0));
    return available < item.quantity;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <Link to="/shop" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft size={18} />
              Continue Shopping
            </Link>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-4xl font-bold text-foreground mb-8"
          >
            Shopping Cart ({items.length})
          </motion.h1>

          {/* Stock issues banner */}
          <AnimatePresence>
            {hasStockIssues && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-center gap-2"
              >
                <Zap size={16} className="fill-amber-500 text-amber-500 flex-shrink-0" />
                Some items have stock changes. Review before checkout.
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => {
                  const productId = getProductId(item.product);
                  const itemImage = getCartItemImage(item);
                  const counts = item.product.sizeCounts || {};
                  const reserved = item.product.sizeReservedCounts || {};
                  const available = Math.max(0, (counts[item.size] || 0) - (reserved[item.size] || 0));
                  const isOutOfStock = available <= 0;

                  return (
                    <motion.div
                      key={getCartLineKey(productId, item.size, itemImage)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`bg-card rounded-xl p-4 shadow-sm border transition-colors duration-300 ${isOutOfStock ? 'border-red-200 bg-red-50/30' : 'border-border'}`}
                    >
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <Link to={`/product/${productId}`}>
                          <div className={`w-24 h-32 rounded-lg overflow-hidden bg-secondary flex-shrink-0 transition-opacity duration-300 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}>
                            <img
                              src={itemImage}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </Link>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                {item.product.category}
                              </p>
                              <Link to={`/product/${productId}`}>
                                <h3 className="font-serif font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                                  {item.product.name}
                                </h3>
                              </Link>
                              <p className="text-sm text-muted-foreground mt-1">
                                Size: {item.size}
                              </p>
                              {item.color && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Color: {item.color}
                                </p>
                              )}

                              {/* Live stock badge — re-animates when stock changes via socket */}
                              <LiveStockBadge available={available} quantity={item.quantity} size={item.size} />
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05, backgroundColor: 'rgb(239, 68, 68)' }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => removeItem(productId, item.size, itemImage, item.color)}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 font-medium text-sm whitespace-nowrap flex-shrink-0"
                              title="Remove from cart"
                            >
                              <Trash2 size={16} />
                              <span className="hidden sm:inline">Remove</span>
                            </motion.button>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            {/* Quantity */}
                            <div className="flex items-center gap-2 bg-secondary rounded-full p-1">
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => updateQuantity(productId, item.size, item.quantity - 1, itemImage, item.color)}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors"
                              >
                                <Minus size={14} />
                              </motion.button>
                              <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                disabled={item.quantity >= available}
                                onClick={() => updateQuantity(productId, item.size, item.quantity + 1, itemImage, item.color)}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Plus size={14} />
                              </motion.button>
                            </div>

                            {/* Price */}
                            <p className="font-semibold text-foreground">
                              ₹{(item.product.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Clear Cart */}
              <button
                onClick={clearCart}
                className="text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear Cart
              </button>
            </div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="bg-secondary rounded-2xl p-6 sticky top-28">
                <h2 className="font-serif text-xl font-semibold mb-6">Order Summary</h2>

                {/* Summary */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border pt-3 mt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <motion.span
                        key={total}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="text-foreground"
                      >
                        ₹{total.toLocaleString()}
                      </motion.span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <Link to="/checkout" className="block">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={hasStockIssues}
                    className="w-full btn-primary mt-6 py-4 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {hasStockIssues ? 'Resolve Stock Issues First' : 'Proceed to Checkout'}
                  </motion.button>
                </Link>

                {hasStockIssues && (
                  <p className="mt-3 text-xs text-amber-600 text-center">
                    Remove out-of-stock items to continue
                  </p>
                )}

                {/* Payment Icons */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-muted-foreground mb-2">Secure Payment Options</p>
                  <div className="flex justify-center gap-2 text-muted-foreground text-xs">
                    <span className="px-2 py-1 bg-background rounded">UPI</span>
                    <span className="px-2 py-1 bg-background rounded">Cards</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
