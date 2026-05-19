import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { SalesSection } from '@/components/SalesSection';
import { ProductSection } from '@/components/ProductSection';
import { CategorySection } from '@/components/CategorySection';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { NewsletterSection } from '@/components/NewsletterSection';
import { Footer } from '@/components/Footer';
import { Marquee } from '@/components/Marquee';

const Index = () => {
  const location = useLocation();
  useEffect(() => {
    const st = location.state as { requireAuth?: boolean } | null;
    if (st?.requireAuth) {
      toast.message('దయచేసి లాగిన్ అవండి', { description: 'చెకౌట్ / ఆర్డర్స్ కోసం ఖాతా అవసరం.' });
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
        <ProductSection title="Best Selling" subtitle="Most Loved Pieces" category="Sarees" />
        <ProductSection title="Dinu's Collections" subtitle="Exclusive Designer Wear" category="Dinu's Collections" />
        <ProductSection title="Premium Collection" subtitle="Handcrafted Luxury" featured={true} />
        <ProductSection title="New Arrivals" subtitle="Latest Trends" category="Lehengas" />
        <TestimonialsSection />
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
