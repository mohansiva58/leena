import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { sizes, Product } from '@/lib/products';
import { productService } from '@/services/productService';

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('featured');

  const filterParam = searchParams.get('filter');
  const categoryParam = searchParams.get('category');
  const search = searchParams.get('search');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productService.getAllProducts();
        console.log('Fetched products:', data);
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Apply filter param
    if (filterParam === 'new') {
      result = result.filter((p) => p.isNew || p.newArrival);
    } else if (filterParam === 'bestseller') {
      result = result.filter((p) => p.isBestseller);
    }

    // Apply category filter
    if (categoryParam) {
      result = result.filter((p) => p.category.toLowerCase() === categoryParam.toLowerCase());
    }

    // Apply size filter
    if (selectedSize) {
      result = result.filter((p) => p.sizes.includes(selectedSize));
    }

    // Apply search filter
    if (search) {
      const query = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // featured - keep original order
        break;
    }

    return result;
  }, [products, filterParam, categoryParam, search, selectedSize, sortBy]);

  const clearFilters = () => {
    setSelectedSize(null);
    if (search || filterParam || categoryParam) {
      navigate('/shop');
    }
  };

  const activeFiltersCount = selectedSize ? 1 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-1 pb-10">
        {/* Shop Hero Section */}
        <section className="bg-elegant py-12 mb-8 border-b border-border/50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl mx-auto"
            >
              <nav className="flex justify-center items-center space-x-2 text-xs uppercase tracking-widest text-muted-foreground mb-4">
                <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                <span>/</span>
                <span className="text-primary font-medium">Shop</span>
              </nav>
              <h1 className="mb-4 font-serif text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
                {search
                  ? `Search: "${search}"`
                  : filterParam === 'new'
                    ? 'The New Collection'
                    : filterParam === 'bestseller'
                      ? 'Our Bestsellers'
                      : categoryParam
                        ? categoryParam
                        : 'Shop All'}
              </h1>
              {/* <div className="w-20 h-1 bg-primary mx-auto mb-6"></div> */}

            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-4">
          {/* Mobile Filter & Sort Bar */}
          <div className="lg:hidden flex items-center justify-between gap-4 mb-6 sticky top-[64px] z-30 bg-background/80 backdrop-blur-md py-3 px-1">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary rounded-full text-sm font-medium border border-border/50"
            >
              <SlidersHorizontal size={16} />
              Filter {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>
            <div className="flex-1 relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 bg-secondary rounded-full text-sm font-medium cursor-pointer focus:outline-none border border-border/50"
              >
                <option value="featured">Sort by: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
            </div>
          </div>

          {/* Desktop Filter/Sort Bar */}
          <div className="hidden lg:flex items-center justify-end gap-4 mb-10 pb-6 border-b border-border/50">
            <div className="flex items-center gap-6">
              <p className="text-sm text-muted-foreground">
                Showing <span className="text-foreground font-semibold">{filteredProducts.length}</span> products
              </p>
              <div className="relative min-w-[200px]">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none px-4 py-2 pr-10 bg-transparent border-b border-foreground/20 text-sm font-medium cursor-pointer focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
                <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Desktop Sidebar Filters */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-28 space-y-10 pr-8">
                {/* Size */}
                <div>
                  <h3 className="font-serif text-xl font-semibold mb-6 pb-2 border-b border-border/50">Select Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                        className={`w-11 h-11 flex items-center justify-center rounded-sm text-xs font-bold transition-all ${selectedSize === size
                          ? 'bg-primary text-primary-foreground shadow-lg scale-110'
                          : 'bg-secondary/50 text-foreground hover:bg-primary/20 hover:text-primary'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-primary text-sm font-semibold hover:gap-3 transition-all pt-4"
                  >
                    <X size={16} />
                    Clear all filters
                  </motion.button>
                )}
              </div>
            </aside>

            {/* Mobile Filter Panel */}
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -300 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -300 }}
                  className="fixed inset-0 z-50 lg:hidden"
                >
                  <div className="absolute inset-0 bg-foreground/50" onClick={() => setIsFilterOpen(false)} />
                  <div className="absolute left-0 top-0 bottom-0 w-80 bg-background p-8 overflow-y-auto shadow-2xl">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                      <h2 className="font-serif text-2xl font-bold">Filters</h2>
                      <button onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <X size={20} />
                      </button>
                    </div>

                    {/* Size */}
                    <div className="mb-10">
                      <h3 className="font-serif text-lg font-semibold mb-4">Size</h3>
                      <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                            className={`w-12 h-12 flex items-center justify-center rounded-sm text-xs font-bold transition-all ${selectedSize === size
                              ? 'bg-primary text-primary-foreground shadow-lg'
                              : 'bg-secondary/30 text-foreground hover:bg-primary/10'
                              }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 sticky bottom-0 bg-background pt-4 border-t border-border mt-auto">
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={() => {
                            clearFilters();
                            setIsFilterOpen(false);
                          }}
                          className="flex-1 px-4 py-3 border border-border text-foreground text-sm font-bold rounded-full"
                        >
                          Reset
                        </button>
                      )}
                      <button
                        onClick={() => setIsFilterOpen(false)}
                        className="flex-[2] btn-primary py-3 rounded-full"
                      >
                        Show Results
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Products Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="aspect-square bg-secondary/30 rounded-[2rem] animate-pulse" />
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3">
                  {filteredProducts.map((product, index) => (
                    <ProductCard key={product.productId || product.id || product._id} product={product} index={index} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 px-4 bg-secondary/20 rounded-sm border border-border/50">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    <X size={40} className="mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="font-serif text-2xl font-semibold mb-2">No items match your selection</h3>
                    <p className="text-muted-foreground mb-8 max-w-xs mx-auto">Try adjusting your filters or search terms to find what you're looking for.</p>
                    <button
                      onClick={clearFilters}
                      className="btn-primary px-8 py-3 rounded-full"
                    >
                      Reset All Filters
                    </button>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
