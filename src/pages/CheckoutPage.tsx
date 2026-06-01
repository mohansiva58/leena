import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, CreditCard, Check, AlertCircle, Plus, Pencil, Trash2, Minus } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AuthModal } from '@/components/AuthModal';
import { useCartStore, getProductId, getCartItemImage } from '@/lib/cart';
import { useAuth } from '@/hooks/useAuth';
import { useRazorpayCheckout } from '@/hooks/useRazorpayCheckout';
import { orderService } from '@/services/orderService';
import { couponService } from '@/services/couponService';
import { userService, SavedAddress } from '@/services/userService';
import { productService } from '@/services/productService';
import { saleService } from '@/services/saleService';
import { indianStates } from '@/lib/indianStates';
import { toast } from 'sonner';
import axios, { AxiosError } from 'axios';

type PaymentMethod = 'razorpay';

type CatalogStockItem = {
  productId?: string;
  saleId?: string;
  sizes?: string[];
  stock?: number;
  sizeCounts?: Record<string, number>;
};

const normalizeIndianPhone = (phone: string) => {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
};

const isValidIndianPhone = (phone: string) => /^[6-9]\d{9}$/.test(normalizeIndianPhone(phone));

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart, removeItem } = useCartStore();
  const { isAuthenticated, user } = useAuth();
  const { initiatePayment } = useRazorpayCheckout();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);

  const [savedAddress, setSavedAddress] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(true);
  const [savedAddressId, setSavedAddressId] = useState<string | null>(null);
  const [pincodeError, setPincodeError] = useState<string>('');
  const [pincodeValid, setPincodeValid] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ 
    code: string; 
    discountType: 'percentage' | 'fixed';
    discountValue: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [stockErrors, setStockErrors] = useState<Record<string, string>>({});
  const [validatingStock, setValidatingStock] = useState(false);

  const subtotal = getTotalPrice();
  const discountAmount = appliedCoupon 
    ? (appliedCoupon.discountType === 'percentage' 
        ? Math.round((subtotal * appliedCoupon.discountValue) / 100) 
        : appliedCoupon.discountValue) 
    : 0;
  const total = subtotal - discountAmount;

  // If cart becomes empty during checkout, go back to shop
  useEffect(() => {
    if (items.length === 0 && step !== 3) {
      navigate('/shop');
    }
  }, [items, step, navigate]);

  const handleApplyCoupon = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!couponCode.trim()) return;
    try {
      setCouponLoading(true);
      setCouponError(null);
      const result = await couponService.validateCoupon(couponCode, subtotal);
      setAppliedCoupon(result);
      const saved = result.discountType === 'percentage' 
        ? Math.round((subtotal * result.discountValue) / 100) 
        : result.discountValue;
      toast.success(`Coupon "${result.code}" applied! You saved ₹${saved}`);
    } catch (error: unknown) {
      console.error('Apply coupon error:', error);
      const axiosError = error as AxiosError<{ error?: string }>;
      const errorMsg = axiosError.response?.data?.error || 'Invalid coupon code';
      
      // Don't show technical routing errors to the user
      if (!errorMsg.includes('not found')) {
        setCouponError(errorMsg);
        toast.error(errorMsg);
      } else {
        toast.error('Unable to validate coupon at this time');
      }
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  const validateStockBeforePayment = async (): Promise<boolean> => {
    const validateCartItemsFromCatalog = async () => {
      const errors: Record<string, string> = {};

      await Promise.all(items.map(async (item) => {
        const productId = getProductId(item.product);
        const key = `${productId}-${item.size}`;

        if (!productId) {
          errors[key] = 'This item is missing a product ID';
          return;
        }

        let catalogItem: CatalogStockItem | null = null;
        try {
          catalogItem = await productService.getProductById(productId);
        } catch (productError) {
          if (!axios.isAxiosError(productError) || productError.response?.status !== 404) {
            throw productError;
          }

          try {
            catalogItem = await saleService.getSaleById(productId);
          } catch (saleError) {
            if (axios.isAxiosError(saleError) && saleError.response?.status === 404) {
              errors[key] = 'This item is no longer available';
              removeItem(productId, item.size, getCartItemImage(item), item.color);
              return;
            }
            throw saleError;
          }
        }

        if (!catalogItem) {
          errors[key] = 'This item is no longer available';
          removeItem(productId, item.size, getCartItemImage(item), item.color);
          return;
        }

        if (Array.isArray(catalogItem.sizes) && !catalogItem.sizes.includes(item.size)) {
          errors[key] = `${item.size} is no longer available`;
          return;
        }

        const maxAvailable = catalogItem.sizeCounts?.[item.size] ?? catalogItem.stock ?? 0;
        if (maxAvailable < item.quantity) {
          errors[key] = `Only ${Math.max(0, maxAvailable)} available (tried to order ${item.quantity})`;
        }
      }));

      if (Object.keys(errors).length > 0) {
        setStockErrors(errors);
        toast.error('Some cart items are unavailable. Please review your cart.');
        return false;
      }

      setStockErrors({});
      return true;
    };

    try {
      setValidatingStock(true);
      setStockErrors({});

      const itemsToCheck = items.map(item => ({
        productId: getProductId(item.product) || '',
        size: item.size,
        quantity: item.quantity,
      })).filter(item => item.productId);

      if (itemsToCheck.length === 0) {
        toast.error('No valid items in cart');
        return false;
      }

      const result = await productService.checkStockAvailability(itemsToCheck);

      if (!result.available) {
        const errors: Record<string, string> = {};
        result.items.forEach(item => {
          if (!item.available) {
            const key = `${item.productId}-${item.size}`;
            errors[key] = `Only ${item.maxAvailable} available (tried to order ${item.quantity})`;
          }
        });
        setStockErrors(errors);
        toast.error('Some items have insufficient stock');
        return false;
      }

      setStockErrors({});
      return true;
    } catch (error) {
      console.error('Stock validation error:', error);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return validateCartItemsFromCatalog();
      }
      toast.error('Unable to validate stock. Please try again.');
      return false;
    } finally {
      setValidatingStock(false);
    }
  };

  const handleUpdateQuantity = (productId: string, size: string, variantImage: string | undefined, color: string | undefined, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId, size, variantImage, color);
      toast.success('Item removed from cart');
      return;
    }

    // Update cart - need to modify the quantity
    // Since we don't have a direct update function, we'll remove and re-add
    removeItem(productId, size, variantImage, color);
    
    const item = items.find(
      i => getProductId(i.product) === productId && 
        i.size === size && 
        (variantImage ? getCartItemImage(i) === variantImage : true) &&
        i.color === color
    );

    if (item) {
      // Re-add with new quantity
      for (let i = 0; i < newQuantity; i++) {
        // Add back items - this is a workaround since cart store works with individual items
      }
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      const applyAddress = (addr: Partial<SavedAddress>) => {
        setFormData({
          fullName: addr.fullName || '',
          phone: addr.phone || '',
          email: addr.email || user?.email || '',
          address: addr.address || '',
          city: addr.city || '',
          state: addr.state || '',
          pincode: addr.pincode || '',
        });
        setSavedAddressId(addr._id || null);
        setSavedAddress(true);
        setIsEditingAddress(false);
      };

      const fetchSavedAddress = async () => {
        try {
          const currentUser = await userService.getCurrentUser();
          const defaultAddress = currentUser.addresses?.find((addr) => addr.isDefault) || currentUser.addresses?.[0];

          if (defaultAddress) {
            applyAddress(defaultAddress);
            return;
          }

          const response = await orderService.getOrders({ limit: 1 });
          // Check structure: response.orders (from backend) or response (if direct array)
          const orders = response.orders || response;

          if (Array.isArray(orders) && orders.length > 0) {
            // Sort by createdAt just in case, though backend usually returns sorted
            const lastOrder = orders[0]; // Assuming most recent first or taking the first one

            if (lastOrder && lastOrder.shippingAddress) {
              const addr = lastOrder.shippingAddress;
              applyAddress({
                ...addr,
                address: addr.address || addr.addressLine1 || '',
                pincode: addr.pincode || addr.postalCode || '',
              });
            }
          } else {
            // No previous orders, prefill email if available
            setFormData(prev => ({ ...prev, email: user?.email || '' }));
          }
        } catch (error) {
          console.error("Failed to fetch past orders", error);
        }
      };

      fetchSavedAddress();
    }
  }, [isAuthenticated, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Validate pincode format when it changes
    if (name === 'pincode') {
      if (value.trim() === '') {
        setPincodeError('');
        setPincodeValid(false);
      } else if (!/^\d{1,6}$/.test(value)) {
        // Allow numbers up to 6 digits, but show error if exactly 6 and invalid format
        setPincodeError('');
        setPincodeValid(false);
      } else if (value.length === 6) {
        // Valid: exactly 6 digits
        setPincodeError('');
        setPincodeValid(true);
      }
    }
  };

  const saveAddressIfNeeded = async () => {
    if (savedAddressId) return;

    try {
      const phone = normalizeIndianPhone(formData.phone);
      const userResponse = await userService.addAddress({
        ...formData,
        phone,
        pincode: formData.pincode.trim(),
        isDefault: true,
      });
      const defaultAddress = userResponse.addresses?.find((addr) => addr.isDefault) || userResponse.addresses?.[0];
      setSavedAddressId(defaultAddress?._id || null);
      setSavedAddress(true);
    } catch (error) {
      console.error('Failed to save address:', error);
      toast.error('Address saved for this order, but could not be stored for next time');
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.pincode) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!/^\d{6}$/.test(formData.pincode)) {
      toast.error('Pincode must be 6 digits');
      return;
    }
    if (!isValidIndianPhone(formData.phone)) {
      toast.error('Enter a valid 10-digit Indian mobile number');
      return;
    }
    if (!policyAccepted) {
      toast.error('Please accept the return policy');
      return;
    }
    await saveAddressIfNeeded();
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setIsProcessing(true);

    try {
      if (!isValidIndianPhone(formData.phone)) {
        toast.error('Enter a valid 10-digit Indian mobile number');
        setIsProcessing(false);
        return;
      }

      // Validate stock before proceeding
      const stockValid = await validateStockBeforePayment();
      if (!stockValid) {
        setIsProcessing(false);
        return;
      }

      const phone = normalizeIndianPhone(formData.phone);
      const orderData = {
        items: items.map(item => {
          const productId = getProductId(item.product);
          if (!productId) {
            throw new Error(`Product ${item.product.name} missing required ID`);
          }

          return {
            productId,
            name: item.product.name,
            price: item.product.price,
            image: getCartItemImage(item),
            variantImage: getCartItemImage(item),
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          };
        }),
        shippingAddress: {
          ...formData,
          phone,
          pincode: formData.pincode.trim(),
        },
        paymentMethod,
        couponCode: appliedCoupon?.code,
      };

      // Razorpay payment
      await initiatePayment({
        amount: total,
        orderData,
        onSuccess: (orderId) => {
          setStep(3);
          clearCart();
          toast.success(`Order ${orderId} placed successfully! 🎉`);
          navigate('/orders', { replace: true });
        },
        onFailure: (error) => {
          console.error('Payment failed:', error);
          setIsProcessing(false);
        },
      });
    } catch (error) {
      console.error('Order placement error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="font-serif text-3xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">Add some items to checkout</p>
            <Link to="/shop" className="btn-primary inline-block">
              Continue Shopping
            </Link>
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
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <Link to="/cart" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft size={18} />
              Back to Cart
            </Link>
          </motion.div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-12">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${step >= s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                    }`}
                >
                  {step > s ? <Check size={18} /> : s}
                </div>
                <span className={`hidden sm:inline text-sm ${step >= s ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s === 1 ? 'Address' : s === 2 ? 'Payment' : 'Confirmation'}
                </span>
                {s < 3 && <div className="w-12 h-0.5 bg-border" />}
              </div>
            ))}
          </div>

          {/* Step 1: Address */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl shadow-lg p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl font-bold">Shipping Address</h2>
                {!isEditingAddress && (
                  <button
                    onClick={() => {
                      setFormData({
                        fullName: '',
                        phone: '',
                        email: user?.email || '',
                        address: '',
                        city: '',
                        state: '',
                        pincode: '',
                      });
                      setIsEditingAddress(true);
                      setPolicyAccepted(false);
                      setSavedAddressId(null);
                    }}
                    className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Plus size={16} />
                    Add New Address
                  </button>
                )}
              </div>

              {!isEditingAddress ? (
                <div className="space-y-6">
                  <div className="bg-secondary border-2 border-primary rounded-lg p-6 relative">
                    <div className="absolute top-4 right-4">
                      {/* Radio indicator to show it's selected */}
                      <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                    </div>

                    <div className="pr-12">
                      <h3 className="font-semibold text-lg mb-1">{formData.fullName}</h3>
                      <p className="text-muted-foreground mb-1">{formData.phone}</p>
                      <p className="text-muted-foreground mb-1">{formData.address}</p>
                      <p className="text-muted-foreground">
                        {formData.city}, {formData.state ? `${formData.state} - ` : ''}{formData.pincode}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border flex justify-end">
                      <button
                        onClick={() => setIsEditingAddress(true)}
                        className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline"
                      >
                        <Pencil size={14} />
                        Edit Address
                      </button>
                    </div>
                  </div>

                  {/* Return Policy Checkbox for Saved Address View */}
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-amber-600 mt-1 flex-shrink-0" size={20} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Important Policy</h3>
                        <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                          <strong>No Returns | No Exchanges</strong> - All sales are final. Please review your order carefully before proceeding.
                        </p>
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={policyAccepted}
                            onChange={(e) => setPolicyAccepted(e.target.checked)}
                            className="mt-1"
                          />
                          <span className="text-sm text-amber-800 dark:text-amber-200">
                            I understand and accept the no return/no exchange policy
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!policyAccepted) {
                        toast.error('Please accept the return policy');
                        return;
                      }
                      setStep(2);
                    }}
                    className="w-full btn-primary py-4 font-semibold"
                    disabled={!policyAccepted}
                  >
                    Continue to Payment
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddressSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="10-digit mobile number"
                        maxLength={16}
                        required
                        className="w-full px-4 py-3 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      {formData.phone && !isValidIndianPhone(formData.phone) && (
                        <p className="text-orange-600 text-xs mt-1">Enter a valid Indian mobile number</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Address *</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-4 py-3 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">State *</label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select State</option>
                        {indianStates.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Pincode *</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                          placeholder="6-digit pincode"
                          maxLength={6}
                          required
                          className={`w-full px-4 py-3 bg-secondary rounded-lg border focus:outline-none focus:ring-2 transition-colors ${
                            formData.pincode === ''
                              ? 'border-border focus:ring-primary'
                              : pincodeValid
                              ? 'border-green-500 focus:ring-green-500'
                              : 'border-border focus:ring-primary'
                          }`}
                        />
                        {pincodeValid && formData.pincode.length === 6 && (
                          <div className="absolute right-3 top-3 text-green-500">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {formData.pincode && !pincodeValid && (
                        <p className="text-orange-600 text-xs mt-1">Enter 6 digits</p>
                      )}
                      {pincodeValid && formData.pincode.length === 6 && (
                        <p className="text-green-600 text-xs mt-1">✓ Valid</p>
                      )}
                    </div>
                  </div>

                  {/* Return Policy Checkbox */}
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-amber-600 mt-1 flex-shrink-0" size={20} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Important Policy</h3>
                        <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                          <strong>No Returns | No Exchanges</strong> - All sales are final. Please review your order carefully before proceeding.
                        </p>
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={policyAccepted}
                            onChange={(e) => setPolicyAccepted(e.target.checked)}
                            className="mt-1"
                            required
                          />
                          <span className="text-sm text-amber-800 dark:text-amber-200">
                            I understand and accept the no return/no exchange policy
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {savedAddress && (
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="flex-1 bg-secondary text-foreground py-4 rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 btn-primary py-4 font-semibold"
                      disabled={!policyAccepted}
                    >
                      Continue to Payment
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-card rounded-2xl shadow-lg p-8">
                <h2 className="font-serif text-2xl font-bold mb-6">Payment Method</h2>

                <div className="space-y-4 mb-8">
                  <label
                    className="flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all border-primary bg-primary/5"
                  >
                    <input
                      type="radio"
                      value="razorpay"
                      checked={true}
                      readOnly
                      className="w-5 h-5"
                    />
                    <CreditCard className="text-primary" size={24} />
                    <div className="flex-1">
                      <div className="font-semibold">Online Payment (Razorpay)</div>
                      <div className="text-sm text-muted-foreground">
                        Pay securely with Card, UPI, Netbanking, or Wallet
                      </div>
                    </div>
                  </label>
                </div>

                {/* Order Items */}
                <div className="bg-secondary rounded-lg p-6 mb-6">
                  <h3 className="font-semibold mb-4">Order Items</h3>
                  <div className="space-y-4">
                    {items.map((item, idx) => {
                      const productId = getProductId(item.product);
                      const itemKey = `${productId}-${item.size}`;
                      const hasError = stockErrors[itemKey];
                      
                      return (
                        <div key={idx} className={`flex gap-4 p-3 rounded-lg border ${hasError ? 'border-destructive bg-destructive/5' : 'bg-background border-border'}`}>
                          <div className="w-16 h-20 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                            <img
                              src={getCartItemImage(item)}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm line-clamp-1">{item.product.name}</p>
                            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                              <p>Category: {item.product.category}</p>
                              <p>Size: <span className="font-medium text-foreground">{item.size}</span></p>
                              {item.color && <p>Color: <span className="font-medium text-foreground">{item.color}</span></p>}
                            </div>
                            {hasError && (
                              <p className="text-xs text-destructive font-medium mt-2 flex items-center gap-1">
                                <AlertCircle size={12} />
                                {hasError}
                              </p>
                            )}
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    removeItem(productId || '', item.size, getCartItemImage(item), item.color);
                                    toast.success('Quantity decreased');
                                  }
                                }}
                                className="p-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                                disabled={item.quantity <= 1}
                                title="Decrease quantity"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="px-2 py-1 text-sm font-medium bg-secondary rounded">
                                Qty: {item.quantity}
                              </span>
                              <button
                                onClick={() => {
                                  toast.info('Add more items from cart');
                                }}
                                className="p-1 text-muted-foreground hover:text-primary transition-colors"
                                title="Increase quantity"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="text-right flex flex-col justify-between items-end">
                            <p className="font-bold text-sm text-primary">₹{(item.product.price * item.quantity).toLocaleString()}</p>
                            <button
                              type="button"
                              onClick={() => {
                                removeItem(productId || '', item.size, item.variantImage, item.color);
                                toast.success('Item removed from cart');
                              }}
                              className="p-1 text-muted-foreground hover:text-destructive transition-colors mt-2"
                              title="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Coupon Section */}
                <div className="bg-secondary rounded-lg p-6 mb-6">
                  <h3 className="font-semibold mb-4">Have a Coupon?</h3>
                  {!appliedCoupon ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            if (couponError) setCouponError(null);
                          }}
                          className={`flex-1 px-4 py-2 bg-background rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary uppercase ${couponError ? 'border-destructive' : 'border-border'}`}
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="px-6 py-2 btn-primary rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                          {couponLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                      {couponError && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-destructive text-sm font-medium flex items-center gap-1"
                        >
                          <AlertCircle size={14} />
                          {couponError}
                        </motion.p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Check className="text-primary" size={18} />
                        <div>
                          <span className="font-bold text-primary">{appliedCoupon.code}</span>
                          <span className="text-sm text-primary ml-2">
                            ({appliedCoupon.discountType === 'percentage' 
                              ? `${appliedCoupon.discountValue}% OFF` 
                              : `₹${appliedCoupon.discountValue} OFF`
                            })
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-xs text-destructive font-medium hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <div className="bg-secondary rounded-lg p-6 mb-6">
                  <h3 className="font-semibold mb-4">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal ({items.length} items)</span>
                      <span>₹{subtotal.toLocaleString()}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-primary font-medium">
                        <span>Coupon Discount ({appliedCoupon?.code})</span>
                        <span>-₹{discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-2 mt-2">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>₹{total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-6 py-4 bg-secondary rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="flex-1 btn-primary py-4 font-semibold disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Pay Now'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="bg-card rounded-2xl shadow-lg p-12">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="text-primary" size={40} />
                </div>
                <h2 className="font-serif text-3xl font-bold mb-4">Order Placed Successfully!</h2>
                <p className="text-muted-foreground mb-8">
                  Thank you for your purchase. You will receive a confirmation email shortly.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link to="/orders" className="btn-primary px-8 py-3">
                    View my orders
                  </Link>
                  <Link to="/shop" className="btn-secondary px-8 py-3">
                    Continue Shopping
                  </Link>
                  <Link to="/" className="btn-secondary px-8 py-3">
                    Go to Home
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <AuthModal
        isOpen={showAuthModal && !isAuthenticated}
        onClose={() => setShowAuthModal(false)}
      />

      <Footer />
    </div>
  );
}
