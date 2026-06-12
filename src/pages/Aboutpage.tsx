import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import aboutimage from '@/assets/image.png';
import abt from '@/assets/abt2.jpeg';
import logo from '@/assets/logo.png'
import { SEO } from '@/components/SEO';
import { seoConfig } from '@/lib/seoConfig';
export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background">
            <SEO
                title="About Leena by Alekhya"
                description="Learn the story of Leena by Alekhya, a boutique fashion brand founded by Alekhya to bring premium, hand-picked, designer-inspired ethnic wear to women."
                path="/about"
                image="/image.png"
                keywords={['about Leena by Alekhya', 'Alekhya boutique', 'women fashion brand']}
                schema={{
                    '@context': 'https://schema.org',
                    '@type': 'AboutPage',
                    name: `About ${seoConfig.siteName}`,
                    url: `${seoConfig.siteUrl}/about`,
                    description: 'The story, values, and boutique fashion approach behind Leena by Alekhya.',
                }}
            />
            <Header />
            <main className="pt-24 pb-16">
                <section className="py-12 px-6 md:px-12 lg:px-24 bg-secondary rounded-3xl mx-4 md:mx-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="relative"
                            >
                                <div className="relative">
                                    <div className="aspect-[4/5] rounded-[60px] overflow-hidden">
                                        <img
                                            src={logo}
                                            alt="Brand story"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Floating accent image */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.6, delay: 0.3 }}
                                        className="absolute -bottom-8 -right-8 w-40 h-52 rounded-3xl overflow-hidden shadow-2xl border-4 border-background"
                                    >
                                        <img
                                            
                                            src="/abt.png"
                                            alt="Detail"
                                            className="w-full h-full object-cover"
                                        />

                                    </motion.div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="lg:pl-12"
                            >
                                <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6 block">
                                    Our Story
                                </span>

                                <h2 className="text-4xl md:text-5xl font-light text-foreground leading-tight mb-8">
                                    Crafted with passion,{' '}
                                    <span className="italic">worn with pride</span>
                                </h2>

                                <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                                    Leena was born out of passion, courage, and a dream to create beautiful outfits that make every woman feel confident and elegant. Founded by Alekhya, an IT professional and a mom, Leena started as a passion-driven journey alongside managing career, motherhood, and everyday life
                                </p>

                                <p className="text-muted-foreground leading-relaxed mb-10">
                                    At Leena, we believe fashion should feel as unique as the women who wear it. That’s why we carefully curate and create exclusive designer-inspired collections that are thoughtfully selected for their elegance, quality, and individuality. Every piece is chosen to offer something distinctive, ensuring our customers discover styles that stand out and are not commonly found elsewhere. Our goal is to bring unique fashion experiences to women who appreciate timeless designs, modern trends, and the confidence that comes from wearing something truly special.                                </p>

                                <div className="flex flex-wrap gap-12">
                                    <div>
                                        <span className="text-4xl font-light text-foreground">1+</span>
                                        <p className="text-muted-foreground text-sm mt-1">Years of Excellence</p>
                                    </div>
                                    <div>
                                        <span className="text-4xl font-light text-foreground">500+</span>
                                        <p className="text-muted-foreground text-sm mt-1">Orders Served</p>
                                    </div>
                                    <div>
                                        <span className="text-4xl font-light text-foreground">∞</span>
                                        <p className="text-muted-foreground text-sm mt-1">Hand picked Items</p>
                                    </div>
                                    <div>
                                        <span className="text-4xl font-light text-foreground">8K+</span>
                                        <p className="text-muted-foreground text-sm mt-1">Insta Followers</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
