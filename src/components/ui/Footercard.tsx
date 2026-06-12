import { Link } from 'react-router-dom';
import { Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';

export default function Footercard() {
    return (
        <footer className="bg-secondary pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="space-y-4">
                        <img src={logo} alt="Leena" className="h-16 w-16 rounded-full object-cover border border-[#02013f]/20 shadow-sm transition-transform duration-300 hover:scale-110 scale-105" />
                        <p className="text-muted-foreground text-sm leading-relaxed font-light">
                            Elegance in Every Wear. Premium women's fashion designed for the modern, confident woman.
                        </p>
                        <div className="flex gap-3">
                            <motion.a
                                href="https://www.instagram.com/leena.in?igsh=OTQ2M2Njd3pvN2xr&utm_source=qr"
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.1, y: -2 }}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm transition-shadow hover:shadow-lg bg-[radial-gradient(circle_at_30%_110%,#fdf497_0%,#fdf497_12%,#fd5949_34%,#d6249f_58%,#285AEB_100%)]"
                            >
                                <Instagram size={18} />
                            </motion.a>
                            <motion.a
                                href="https://wa.me/919032624257"
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.1, y: -2 }}
                                className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white hover:shadow-lg transition-shadow"
                            >
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.993L2 22l5.13-1.346a9.945 9.945 0 0 0 4.881 1.279h.005c5.505 0 9.989-4.478 9.99-9.985A9.983 9.983 0 0 0 12.012 2zm5.726 14.127c-.246.696-1.428 1.258-1.957 1.346-.48.08-1.107.133-3.176-.72-2.646-1.09-4.33-3.79-4.46-3.96-.13-.172-1.05-1.398-1.05-2.673 0-1.274.66-1.902.893-2.147.23-.245.508-.306.677-.306.17 0 .341.002.49.009.155.008.363-.06.568.437.21.51.717 1.748.778 1.874.06.126.1.272.016.438-.083.166-.124.272-.248.417-.124.145-.26.324-.372.437-.125.126-.255.263-.11.513.146.25.648 1.07 1.39 1.733.957.854 1.76 1.118 2.01 1.243.25.125.395.105.543-.066.147-.172.63-.733.798-.983.168-.25.337-.21.567-.124.23.087 1.458.687 1.71.812.252.125.42.187.482.294.062.106.062.616-.184 1.312z" />
                                </svg>
                            </motion.a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    {/* <div>
                        <h4 className="font-serif text-lg font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-3">
                            {['New Arrivals', 'Bestsellers', 'Dresses', 'Tops', 'Sale'].map((item) => (
                                <li key={item}>
                                    <Link
                                        to="/shop"
                                        className="text-muted-foreground hover:text-[#02013f] transition-colors text-sm"
                                    >
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div> */}

                    {/* Customer Care */}
                    <div>
                        <h4 className="font-serif text-lg font-semibold mb-4">Customer Care</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/orders" className="text-muted-foreground hover:text-[#02013f] transition-colors text-sm">
                                    Track Order
                                </Link>
                            </li>
                            <li>
                                <Link to="/refund-return-policy" className="text-muted-foreground hover:text-[#02013f] transition-colors text-sm">
                                    Refund / Return Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms-and-conditions" className="text-muted-foreground hover:text-[#02013f] transition-colors text-sm">
                                    Terms & Conditions
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-muted-foreground hover:text-[#02013f] transition-colors text-sm">
                                    Contact Us
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="font-serif text-lg font-semibold mb-4">Get In Touch</h4>
                        <ul className="space-y-3">
                            {/* <li className="flex items-center gap-3 text-muted-foreground text-sm">
                                <Phone size={16} className="text-[#02013f]" />
                                <a href="tel:+919032624257" className="hover:underline hover:text-[#02013f] transition-colors font-medium">9032624257</a>
                            </li> */}
                            <li className="flex items-center gap-3 text-muted-foreground text-sm">
                                <Mail size={16} className="text-[#02013f]" />
                                <a href="mailto:leenabyalekhya@gmail.com" className="hover:underline hover:text-[#02013f] transition-colors">leenabyalekhya@gmail.com</a>
                            </li>
                            <li className="flex items-start gap-3 text-muted-foreground text-sm">
                                <MapPin size={16} className="text-[#02013f] mt-0.5" />
                                Ameenpur, Miyapur, Telangana, India
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-border pt-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-muted-foreground text-sm text-center md:text-left">
                            © 2026 Leena. All rights reserved.
                        </p>
                        <p className="font-serif text-[#02013f] italic text-sm flex items-center gap-1.5 justify-center">
                            <span className="text-[#02013f]/60">✦</span> LEENA by Alekhya <span className="text-[#02013f]/60">✦</span>
                        </p>
                        <div className="flex gap-4 text-sm text-muted-foreground animate-fade-in">
                            <Link to="/privacy-policy" className="hover:text-[#02013f] transition-colors">Privacy Policy</Link>
                            <Link to="/terms-and-conditions" className="hover:text-[#02013f] transition-colors">Terms & Conditions</Link>
                            <Link to="/refund-return-policy" className="hover:text-[#02013f] transition-colors">Refund Policy</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
