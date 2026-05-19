import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, ChevronLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCartStore, getProductId, getCartItemImage, getCartLineKey } from '@/lib/cart';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore();
  const [promoCode, setPromoCode] = useState('');

  const subtotal = getTotalPrice();
  const shipping = subtotal > 2000 ? 0 : 99;
  const total = subtotal + shipping;

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

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => {
                  const productId = getProductId(item.product);
                  const itemImage = getCartItemImage(item);
                  return (
                    <motion.div
                      key={getCartLineKey(productId, item.size, itemImage)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card rounded-xl p-4 shadow-sm border border-border"
                    >
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <Link to={`/product/${productId}`}>
                          <div className="w-24 h-32 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
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
                              {item.product.weight && (
                                <p className="text-xs text-orange-600 font-medium mt-1">
                                  ⚖️ {item.product.weight} kg × {item.quantity} = {(item.product.weight * item.quantity).toFixed(2)} kg
                                </p>
                              )}
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
                                onClick={() => updateQuantity(productId, item.size, item.quantity + 1, itemImage, item.color)}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors"
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

                {/* Promo Code */}
                {/* <div className="mb-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Promo code"
                      className="flex-1 px-4 py-3 bg-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-3 bg-foreground text-background rounded-lg font-medium text-sm"
                    >
                      Apply
                    </motion.button>
                  </div>
                </div> */}

                {/* Summary */}
                <div className="space-y-3 text-sm">
                  {/* Calculate and display total weight */}
                  {(() => {
                    const totalWeight = items.reduce((sum, item) => {
                      return sum + ((item.product.weight || 0.5) * item.quantity);
                    }, 0);
                    return totalWeight > 0 ? (
                      <div className="flex justify-between bg-orange-50 px-3 py-2 rounded">
                        <span className="text-orange-700 text-xs font-medium">Total Weight:</span>
                        <span className="text-orange-700 font-semibold">{totalWeight.toFixed(2)} kg</span>
                      </div>
                    ) : null;
                  })()}
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? (
                        <span className="text-primary">FREE</span>
                      ) : (
                        `₹${shipping}`
                      )}
                    </span>
                  </div>
                  {subtotal < 2000 && (
                    <p className="text-xs text-muted-foreground">
                      Add ₹{(2000 - subtotal).toLocaleString()} more for free shipping!
                    </p>
                  )}
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
                    className="w-full btn-primary mt-6 py-4 font-semibold"
                  >
                    Proceed to Checkout
                  </motion.button>
                </Link>

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
