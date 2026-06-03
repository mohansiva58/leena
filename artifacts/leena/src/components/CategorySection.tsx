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

const remoteImage = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=640&h=640&q=80`;

const modernCategoryImage = (
  label: string,
  detail: string,
  from: string,
  to: string,
  accent: string
) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${from}"/>
          <stop offset="100%" stop-color="${to}"/>
        </linearGradient>
        <radialGradient id="shine" cx="26%" cy="18%" r="72%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.34"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="640" height="640" fill="url(#bg)"/>
      <rect width="640" height="640" fill="url(#shine)"/>
      <path d="M118 130c114 42 238 42 404 0v380c-128 52-266 52-404 0z" fill="#ffffff" opacity="0.14"/>
      <path d="M196 148c88 42 174 42 258 0l-34 330c-60 34-134 34-194 0z" fill="${accent}" opacity="0.88"/>
      <path d="M227 205c63 28 126 28 189 0" fill="none" stroke="#fff7df" stroke-width="14" stroke-linecap="round" opacity="0.72"/>
      <path d="M248 278c47 18 96 18 144 0" fill="none" stroke="#fff7df" stroke-width="10" stroke-linecap="round" opacity="0.58"/>
      <circle cx="178" cy="462" r="34" fill="#fff7df" opacity="0.24"/>
      <circle cx="466" cy="176" r="46" fill="#fff7df" opacity="0.18"/>
      <text x="320" y="524" text-anchor="middle" fill="#fff7df" font-family="Georgia, serif" font-size="54" font-weight="700">${label}</text>
      <text x="320" y="565" text-anchor="middle" fill="#fff7df" font-family="Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="5" opacity="0.76">${detail}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const fallbackImage = (label: string) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#02013f"/>
          <stop offset="55%" stop-color="#1b185c"/>
          <stop offset="100%" stop-color="#c8a65a"/>
        </linearGradient>
        <radialGradient id="glow" cx="34%" cy="25%" r="70%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="640" height="640" fill="url(#bg)"/>
      <rect width="640" height="640" fill="url(#glow)"/>
      <circle cx="320" cy="270" r="142" fill="none" stroke="#f6df9f" stroke-width="12" opacity="0.8"/>
      <path d="M210 380c72 54 148 54 220 0" fill="none" stroke="#f6df9f" stroke-width="14" stroke-linecap="round" opacity="0.9"/>
      <text x="320" y="505" text-anchor="middle" fill="#fff7df" font-family="Georgia, serif" font-size="52" font-weight="700">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const categories = [
  // { label: 'Sarees', query: 'Sarees', image: modernCategoryImage('Sarees', 'MODERN DRAPES', '#02013f', '#7b1f53', '#c8a65a') },
  { label: 'Lehengas', query: 'Lehengas', image: remoteImage('photo-1583398289726-55368e171384') },
  { label: 'Anarkali', query: 'Anarkali', image: remoteImage('photo-1642956369651-ccc858c72de7') },
  { label: 'Cotton Dresses', query: 'Cotton Dresses', image: remoteImage('photo-1595777457583-95e059d581b8') },
  { label: 'Georgette Dresses', query: 'Georgette Dresses', image: remoteImage('photo-1583398289726-55368e171384') },
  // { label: 'Blouses', query: 'Blouses', image: modernCategoryImage('Blouses', 'STATEMENT CUTS', '#02013f', '#4d1b68', '#d9b3ff') },
  // { label: 'Bottom Wear', query: 'Bottom Wear', image: remoteImage('photo-1594633312681-425c7b97ccd1') },
  { label: '2pc Set', query: '2pc Set', image: remoteImage('photo-1485968579580-b6d095142e6e') },
  { label: '3pc Set', query: '3pc Set', image: remoteImage('photo-1595777457583-95e059d581b8') },
  { label: 'Frocks ', query: 'Frocks/Alines', image: remoteImage('photo-1496747611176-843222e1e57c') },
  // { label: 'Handwork Dresses', query: 'Handwork Dresses', image: remoteImage('photo-1515886657613-9f3515b0c78f') },
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
            Shop By Category
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
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = fallbackImage(category.label);
                        }}
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
