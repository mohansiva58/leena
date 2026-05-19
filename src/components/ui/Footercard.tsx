import { Link } from 'react-router-dom';
import { Instagram, MessageCircle, Mail, Phone, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';

export default function Footercard() {
    return (
        <footer className="bg-secondary pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="space-y-4">
                        <img src={logo} alt="Leena Collection" className="h-16 w-auto" />
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Elegance in Every Wear. Premium women's fashion designed for the modern, confident woman.
                        </p>
                        <div className="flex gap-3">
                            <motion.a
                                href="https://www.instagram.com/leena.in?igsh=OTQ2M2Njd3pvN2xr&utm_source=qr"
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.1, y: -2 }}
                                className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground hover-glow transition-shadow"
                            >
                                <Instagram size={18} />
                            </motion.a>
                            <motion.a
                                href="https://wa.me/8008743531"
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.1, y: -2 }}
                                className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent-foreground hover:shadow-lg transition-shadow"
                            >
                                <MessageCircle size={18} />
                            </motion.a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-serif text-lg font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-3">
                            {['New Arrivals', 'Bestsellers', 'Dresses', 'Tops', 'Sale'].map((item) => (
                                <li key={item}>
                                    <Link
                                        to="/shop"
                                        className="text-muted-foreground hover:text-primary transition-colors text-sm"
                                    >
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Customer Care */}
                    <div>
                        <h4 className="font-serif text-lg font-semibold mb-4">Customer Care</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/orders" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                                    Track Order
                                </Link>
                            </li>
                            <li>
                                <Link to="/refund-return-policy" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                                    Refund / Return Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms-and-conditions" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                                    Terms & Conditions
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                                    Contact Us
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="font-serif text-lg font-semibold mb-4">Get In Touch</h4>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-muted-foreground text-sm">
                                <Phone size={16} className="text-primary" />
                                +91 80087 43531
                            </li>
                            <li className="flex items-center gap-3 text-muted-foreground text-sm">
                                <Mail size={16} className="text-primary" />
                                leenabyalekhya@gmail.com
                            </li>
                            <li className="flex items-start gap-3 text-muted-foreground text-sm">
                                <MapPin size={16} className="text-primary mt-0.5" />
                                Vijayawada, Andhra Pradesh, India
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-border pt-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-muted-foreground text-sm text-center md:text-left">
                            © 2026 Leena Collection. All rights reserved.
                        </p>
                        <p className="font-serif text-primary italic text-sm">
                            ✦ LEENA by Alekhya ✦
                        </p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                            <Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                            <Link to="/terms-and-conditions" className="hover:text-primary transition-colors">Terms & Conditions</Link>
                            <Link to="/refund-return-policy" className="hover:text-primary transition-colors">Refund Policy</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
