import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import heroImage from '@/assets/hero-model.jpg';
import abtImage from '@/assets/abt2.jpeg';
import product1 from '@/assets/product-1.jpg';
import product2 from '@/assets/product-2.jpg';
import product3 from '/abt.png';
import product4 from '@/assets/product-4.jpg';
import product5 from '@/assets/product-5.jpg';
import product6 from '@/assets/product-6.jpg';

const categories = [
  { label: 'Kurtas', query: 'Kurtas', image: product1 },
  { label: "Dinu's Collections", query: "Dinu's Collections", image: product2 },
  { label: 'Twine Cut Work', query: 'Twine Cut Work', image: product3 },
  { label: 'Dupattas', query: 'Dupattas', image: product4 },
  { label: 'Blouses', query: 'Blouses', image: product5 },
  { label: 'Bottom Wears', query: 'Bottom Wears', image: product6 },
];

export function CategorySection() {
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) return;

    const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (shouldReduceMotion) return;

    const interval = window.setInterval(() => {
      api.scrollNext();
    }, 2600);

    return () => window.clearInterval(interval);
  }, [api]);

  return (
    <section className="overflow-hidden bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center sm:mb-14"
        >
          <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            Top Collections
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Curated collections crafted for comfort, tradition, and family moments.
          </p>
        </motion.div>

        <Carousel
          setApi={setApi}
          opts={{
            align: 'start',
            containScroll: 'trimSnaps',
            dragFree: true,
            loop: true,
          }}
          className="relative"
        >
          <CarouselContent className="-ml-4 py-1 sm:-ml-6">
            {categories.map((category, index) => (
              <CarouselItem
                key={category.label}
                className="basis-[33%] pl-4 sm:basis-[24%] sm:pl-6 md:basis-[18%] lg:basis-[14.285%] xl:basis-[12.5%]"
              >
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: index * 0.06, duration: 0.45 }}
                >
                  <Link
                    to={`/shop?category=${encodeURIComponent(category.query)}`}
                    className="group flex min-h-[142px] flex-col items-center justify-start text-center outline-none sm:min-h-[190px]"
                    aria-label={`Shop ${category.label}`}
                  >
                    <span className="relative block h-20 w-20 overflow-hidden rounded-full bg-secondary ring-2 ring-border/30 transition duration-300 group-hover:-translate-y-1 group-hover:ring-primary group-focus-visible:ring-2 group-focus-visible:ring-primary sm:h-28 sm:w-28 lg:h-32 lg:w-32">
                      <img
                        src={category.image}
                        alt={`${category.label} collection`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    </span>
                    <span className="mt-3 text-[11px] font-medium uppercase tracking-wider text-foreground sm:mt-4 sm:text-sm">
                      {category.label}
                    </span>
                  </Link>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* <CarouselPrevious className="left-2 top-[38%] hidden h-10 w-10 border-border bg-white text-foreground shadow-md hover:bg-secondary disabled:hidden md:flex" />
          <CarouselNext className="right-2 top-[38%] h-10 w-10 border-border bg-white text-foreground shadow-md hover:bg-secondary disabled:hidden" /> */}
        </Carousel>
      </div>
    </section>
  );
}
