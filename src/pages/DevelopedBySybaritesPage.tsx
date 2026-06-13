import { motion } from 'framer-motion';
import { Code2, ExternalLink, Globe2, Instagram, Mail, Phone, Search, ShoppingBag } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { seoConfig } from '@/lib/seoConfig';
import leenaLogo from '@/assets/logo.png';

const developerProfile = {
  brand: 'Sybarites Tech',
  displayUrl: 'sybarites.tech',
  website: 'https://sybarites.tech',
  instagramHandle: '@sybarites.tech',
  instagramUrl: 'https://www.instagram.com/sybarites.tech',
  email: 'hello@sybarites.tech',
  phone: '+91 90326 24257',
  phoneHref: 'tel:+919032624257',
};

const services = [
  'E-commerce website development',
  'Fashion boutique website design',
  'SEO setup and search visibility',
  'Payment, cart, wishlist, and order flows',
];

const highlights = [
  {
    icon: ShoppingBag,
    title: 'Built for Online Sales',
    description: 'Leena by Alekhya was shaped as a premium fashion shopping experience with product browsing, cart, wishlist, checkout, and order flows.',
  },
  {
    icon: Search,
    title: 'Search Friendly',
    description: 'The site includes page metadata, structured content, and keywords to help searches connect Leena with Sybarites Tech and modern boutique development.',
  },
  {
    icon: Code2,
    title: 'Client Ready',
    description: 'Sybarites Tech creates practical, responsive websites for brands that need clean design, reliable flows, and a strong first impression.',
  },
];

export default function DevelopedBySybaritesPage() {
  const pagePath = '/developedby-sybarites';
  const description =
    'Leena by Alekhya was developed by Sybarites Tech, a web development brand building e-commerce websites, fashion boutique websites, SEO-ready pages, and client-focused digital experiences.';

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Developed by Sybarites Tech | ${seoConfig.siteName}`,
      url: `${seoConfig.siteUrl}${pagePath}`,
      description,
      isPartOf: {
        '@type': 'WebSite',
        name: seoConfig.siteName,
        url: seoConfig.siteUrl,
      },
      about: {
        '@type': 'Organization',
        name: developerProfile.brand,
        url: developerProfile.website,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: developerProfile.brand,
      url: developerProfile.website,
      sameAs: [developerProfile.instagramUrl],
      email: developerProfile.email,
      telephone: developerProfile.phone,
      description: 'Website development and e-commerce development services for growing brands.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Developed by Sybarites Tech"
        description={description}
        path={pagePath}
        image="/premiumcollection.png"
        keywords={[
          'Leena developed by Sybarites',
          'Leena by Alekhya Sybarites Tech',
          'sybarites.tech',
          'Sybarites Tech website development',
          'freelance web developer India',
          'ecommerce website developer',
          'fashion boutique website development',
          'React e-commerce website',
        ]}
        schema={schema}
      />
      <Header />

      <main className="pt-20 pb-16">
        <section className="bg-elegant border-b border-border/50">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-3xl"
              >
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Developed by
                </p>
                <h1 className="font-serif text-4xl font-semibold leading-tight text-foreground md:text-6xl">
                  Sybarites Tech
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                  Leena by Alekhya was designed and developed by Sybarites Tech as a polished
                  fashion e-commerce experience for customers to discover collections, shop
                  products, save wishlist items, and place orders with confidence.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={developerProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center justify-center gap-2"
                  >
                    Visit {developerProfile.displayUrl}
                    <ExternalLink size={16} />
                  </a>
                  <a
                    href={`mailto:${developerProfile.email}`}
                    className="btn-outline inline-flex items-center justify-center gap-2"
                  >
                    Start a Project
                    <Mail size={16} />
                  </a>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="border border-border/60 bg-white p-6 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center gap-4 border-b border-border pb-6">
                  <img
                    src={leenaLogo}
                    alt="Leena by Alekhya logo"
                    className="h-16 w-16 rounded-full border border-[#02013f]/20 object-cover"
                  />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Project</p>
                    <h2 className="font-serif text-2xl font-semibold text-foreground">Leena by Alekhya</h2>
                  </div>
                </div>

                <dl className="mt-6 space-y-5">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Role</dt>
                    <dd className="mt-1 text-sm text-foreground">Website design, development, SEO, and e-commerce flow setup</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Website</dt>
                    <dd className="mt-1 text-sm text-foreground">{seoConfig.siteUrl.replace('https://', '')}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Developer</dt>
                    <dd className="mt-1 text-sm text-foreground">{developerProfile.brand}</dd>
                  </div>
                </dl>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-14">
          <div className="grid gap-5 md:grid-cols-3">
            {highlights.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="border border-border/60 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-[var(--shadow-card)]"
                >
                  <Icon size={24} className="mb-5 text-primary" />
                  <h2 className="font-serif text-2xl font-semibold text-foreground">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="bg-secondary p-6 md:p-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                About the Developer
              </p>
              <h2 className="font-serif text-3xl font-semibold text-foreground md:text-4xl">
                Websites for brands that want to look credible and sell clearly.
              </h2>
              <p className="mt-5 text-sm leading-7 text-muted-foreground md:text-base">
                Sybarites Tech helps small businesses, boutiques, creators, and growing brands
                build modern websites with thoughtful UI, mobile-first layouts, search-ready
                pages, and practical business features.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {services.map((service) => (
                <div key={service} className="border border-border/60 bg-white p-5">
                  <p className="text-sm font-medium text-foreground">{service}</p>
                </div>
              ))}
              <a
                href={developerProfile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-[#02013f] bg-[#02013f] p-5 text-white transition-colors duration-300 hover:bg-foreground"
              >
                <span className="flex items-center justify-between gap-4 text-sm font-semibold uppercase tracking-[0.16em]">
                  See Sybarites Tech
                  <ExternalLink size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </a>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4">
          <div className="border-t border-border py-10">
            <div className="grid gap-6 md:grid-cols-3">
              <a
                href={developerProfile.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 text-sm text-muted-foreground transition-colors hover:text-[#02013f]"
              >
                <Instagram size={20} className="text-[#02013f]" />
                {developerProfile.instagramHandle}
              </a>
              <a
                href={`mailto:${developerProfile.email}`}
                className="flex items-center gap-4 text-sm text-muted-foreground transition-colors hover:text-[#02013f]"
              >
                <Mail size={20} className="text-[#02013f]" />
                {developerProfile.email}
              </a>
              <a
                href={developerProfile.phoneHref}
                className="flex items-center gap-4 text-sm text-muted-foreground transition-colors hover:text-[#02013f]"
              >
                <Phone size={20} className="text-[#02013f]" />
                {developerProfile.phone}
              </a>
              <a
                href={developerProfile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 text-sm text-muted-foreground transition-colors hover:text-[#02013f] md:col-span-3"
              >
                <Globe2 size={20} className="text-[#02013f]" />
                {developerProfile.displayUrl}
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
