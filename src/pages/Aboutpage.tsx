import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import aboutimage from '@/assets/image.png';
import abt from '@/assets/abt2.jpeg';
import logo from '@/assets/logo.png'
export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background">
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
                                            src={logo}
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
                                    At Leena Collection, we believe that fashion should be both accessible and exceptional. Our mission is to deliver high-quality women's wear crafted with care and offered at honest prices.

                                </p>

                                <p className="text-muted-foreground leading-relaxed mb-10">
                                    Rooted in the values of sustainability, style, and inclusivity, we design clothing that celebrates diversity in taste, culture, and personality. Whether you’re drawn to bold patterns, timeless silhouettes, or modern minimalism, our collections are thoughtfully created to suit every individual.

                                </p>

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
                                        <span className="text-4xl font-light text-foreground">100%</span>
                                        <p className="text-muted-foreground text-sm mt-1">Sustainable</p>
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
