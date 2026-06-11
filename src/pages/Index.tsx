import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { SalesSection } from '@/components/SalesSection';
import { ProductSection } from '@/components/ProductSection';
import { CategorySection } from '@/components/CategorySection';
import { Footer } from '@/components/Footer';
import { Marquee } from '@/components/Marquee';
import { AuthModal } from '@/components/AuthModal';

const Index = () => {
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const st = location.state as { requireAuth?: boolean } | null;
    if (st?.requireAuth) {
      setShowAuthModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <Marquee />
        <CategorySection />
        <SalesSection />
        <ProductSection title="Best Selling" subtitle="Most Loved Pieces" filter="bestseller" />
        {/* <ProductSection title="Dinu's Collections" subtitle="Exclusive Designer Wear" category="Dinu's Collections" /> */}
        {/* <ProductSection title="Premium Collection" subtitle="Handcrafted Luxury" featured={true} /> */}
        <ProductSection title="New Arrivals" subtitle="Latest Trends" filter="new" />
      </main>
      <Footer />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Index;
