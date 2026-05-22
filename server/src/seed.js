const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('redis');

dotenv.config({ path: path.join(__dirname, '../.env') });

const image = (id, width = 1400) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

const ColorImageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    publicId: { type: String }
});

const ProductSchema = new mongoose.Schema(
    {
        productId: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        originalPrice: { type: Number, min: 0 },
        image: { type: String, required: true },
        images: [{ type: String }],
        category: { type: String, required: true, index: true },
        sizes: {
            type: [String],
            required: true,
            validate: {
                validator: (v) => v && v.length > 0 && v.every((s) => s && s.trim().length > 0),
                message: 'At least one valid size is required',
            },
        },
        description: { type: String, required: true },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        reviews: { type: Number, default: 0, min: 0 },
        newArrival: { type: Boolean, default: false },
        isBestseller: { type: Boolean, default: false },
        stock: { type: Number, default: 100, min: 0 },
        weight: { type: Number, min: 0 },
        setType: { type: String },
        colors: [{
            colorName: { type: String, required: true },
            colorCode: { type: String },
            image: { type: ColorImageSchema, required: true },
            images: [ColorImageSchema],
            stock: { type: Number, min: 0, default: 0 }
        }],
        cloudinaryId: { type: String },
        cloudinaryIds: [{ type: String }],
    },
    { timestamps: true }
);

ProductSchema.index({ category: 1, price: 1 });
ProductSchema.index({ newArrival: 1, isBestseller: 1 });
ProductSchema.index({ name: 'text', description: 'text' });

const SaleSchema = new mongoose.Schema(
    {
        saleId: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        originalPrice: { type: Number, min: 0 },
        image: { type: String, required: true },
        images: [{ type: String }],
        category: { type: String, required: true, index: true },
        sizes: {
            type: [String],
            required: true,
            validate: {
                validator: (v) => v && v.length > 0 && v.every((s) => s && s.trim().length > 0),
                message: 'At least one valid size is required',
            },
        },
        description: { type: String, required: true },
        reviews: { type: Number, default: 0, min: 0 },
        stock: { type: Number, min: 0, default: 100 },
        discount: { type: Number, min: 0, max: 100 },
        saleMode: { type: String, required: true, index: true },
        weight: { type: Number, min: 0 },
        setType: { type: String },
        colors: [{
            colorName: { type: String, required: true },
            colorCode: { type: String },
            image: { type: ColorImageSchema, required: true },
            images: [ColorImageSchema],
            stock: { type: Number, min: 0, default: 0 }
        }],
        cloudinaryId: { type: String },
        cloudinaryIds: [{ type: String }],
    },
    { timestamps: true }
);

SaleSchema.index({ category: 1, createdAt: -1 });
SaleSchema.index({ saleMode: 1, createdAt: -1 });

const SaleModeSchema = new mongoose.Schema(
    {
        saleName: { type: String, required: true, unique: true, trim: true, index: true },
        isActive: { type: Boolean, default: false, index: true },
        description: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
    },
    { timestamps: true }
);

const CartSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, unique: true, index: true },
        items: [
            {
                productId: String,
                name: String,
                price: Number,
                image: String,
                size: String,
                quantity: Number,
                color: String,
            },
        ],
    },
    { timestamps: true }
);

const OrderSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

const Product = mongoose.model('Product', ProductSchema);
const Sale = mongoose.model('Sale', SaleSchema);
const SaleMode = mongoose.model('SaleMode', SaleModeSchema);
const Cart = mongoose.model('Cart', CartSchema);
const Order = mongoose.model('Order', OrderSchema);

const catalogImages = {
    rubySaree: [
        image('photo-1610030469983-98e550d6193c'),
        image('photo-1583391733956-3750e0ff4e8b'),
        image('photo-1602810318383-e386cc2a3ccf'),
    ],
    roseLehenga: [
        image('photo-1583391733981-2ae01ba45e96'),
        image('photo-1610030469946-78b5ee155c96'),
        image('photo-1594736797933-d0e501ba2fe8'),
    ],
    purpleSaree: [
        image('photo-1610186594416-2c7c0131d8c9'),
        image('photo-1585487000160-6ebcfceb0d03'),
        image('photo-1593030761757-71fae45fa0e7'),
    ],
    goldSaree: [
        image('photo-1610030469950-80e57e84aadd'),
        image('photo-1610030470952-0764f4e29e1e'),
        image('photo-1583391733956-6c78276477e2'),
    ],
    blackSaree: [
        'https://images.unsplash.com/photo-1610030469668-93535c17b6b3?auto=format&fit=crop&w=1400&q=85',
        'https://images.unsplash.com/photo-1583391733990-bc4720e6f3e5?auto=format&fit=crop&w=1400&q=85',
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1400&q=85',
    ],
    festive: [
        'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?auto=format&fit=crop&w=1400&q=85',
        'https://images.unsplash.com/photo-1610030469668-93535c17b6b3?auto=format&fit=crop&w=1400&q=85',
        image('photo-1621184455862-c163dfb30e0f'),
    ],
};

const products = [
    // Existing Nizami Products
    {
        productId: 'PROD-RUBY-SILK-SAREE',
        name: 'Ruby Banarasi Silk Saree',
        price: 8499,
        originalPrice: 10999,
        image: catalogImages.rubySaree[0],
        images: catalogImages.rubySaree,
        category: 'Sarees',
        sizes: ['Free Size'],
        description: 'A rich ruby silk saree with zari-inspired detailing, styled for weddings, receptions, and festive evenings.',
        rating: 4.9,
        reviews: 184,
        newArrival: true,
        isBestseller: true,
        stock: 26,
    },
    {
        productId: 'PROD-ROSE-ZARDOZI-LEHENGA',
        name: 'Rose Ivory Zardozi Lehenga',
        price: 21999,
        originalPrice: 27999,
        image: catalogImages.roseLehenga[0],
        images: catalogImages.roseLehenga,
        category: 'Lehengas',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        description: 'A rose ivory lehenga set with delicate embroidery, soft flare, and a graceful dupatta for bridal occasions.',
        rating: 5.0,
        reviews: 96,
        newArrival: true,
        isBestseller: true,
        stock: 14,
    },
    {
        productId: 'PROD-PURPLE-GEORGETTE-SAREE',
        name: 'Purple Georgette Saree',
        price: 6299,
        originalPrice: 7999,
        image: catalogImages.purpleSaree[0],
        images: catalogImages.purpleSaree,
        category: 'Sarees',
        sizes: ['Free Size'],
        description: 'Lightweight georgette saree in a jewel purple shade with subtle shimmer for parties and evening gatherings.',
        rating: 4.8,
        reviews: 121,
        newArrival: false,
        isBestseller: true,
        stock: 32,
    },
    {
        productId: 'PROD-GOLD-TISSUE-SAREE',
        name: 'Gold Tissue Saree',
        price: 12499,
        originalPrice: 15999,
        image: catalogImages.goldSaree[0],
        images: catalogImages.goldSaree,
        category: 'Sarees',
        sizes: ['Free Size'],
        description: 'A festive gold tissue saree with a luminous finish, perfect for ceremonies, pujas, and wedding functions.',
        rating: 4.9,
        reviews: 88,
        newArrival: true,
        isBestseller: false,
        stock: 21,
    },
    {
        productId: 'PROD-KALAMKARI-COTTON-SAREE',
        name: 'Kalamkari Cotton Saree',
        price: 4599,
        image: catalogImages.blackSaree[0],
        images: catalogImages.blackSaree,
        category: 'Sarees',
        sizes: ['Free Size'],
        description: 'A breathable cotton saree with Kalamkari-inspired artwork and contrast border for elegant everyday ethnic wear.',
        rating: 4.6,
        reviews: 74,
        newArrival: false,
        isBestseller: false,
        stock: 40,
    },
    {
        productId: 'PROD-KHADA-DUPATTA-RUBY',
        name: 'Ruby Khada Dupatta Set',
        price: 15499,
        originalPrice: 18999,
        image: catalogImages.festive[0],
        images: catalogImages.festive,
        category: 'Khada Dupatta',
        sizes: ['Free Size'],
        description: 'Traditional Hyderabadi Khada Dupatta set with a royal drape, statement finish, and occasion-ready silhouette.',
        rating: 4.9,
        reviews: 143,
        newArrival: true,
        isBestseller: true,
        stock: 18,
    },
    {
        productId: 'PROD-VELVET-ANARKALI',
        name: 'Velvet Anarkali Suit',
        price: 8999,
        originalPrice: 11999,
        image: catalogImages.purpleSaree[1],
        images: [catalogImages.purpleSaree[1], catalogImages.festive[1], catalogImages.rubySaree[1]],
        category: 'Anarkali',
        sizes: ['S', 'M', 'L', 'XL'],
        description: 'A flowing velvet Anarkali with a regal fall, embroidered neckline, and festive-ready finish.',
        rating: 4.8,
        reviews: 109,
        newArrival: false,
        isBestseller: false,
        stock: 24,
    },
    {
        productId: 'PROD-MAGENTA-SHARARA',
        name: 'Magenta Silk Sharara Set',
        price: 9799,
        originalPrice: 12999,
        image: catalogImages.rubySaree[2],
        images: [catalogImages.rubySaree[2], catalogImages.roseLehenga[1], catalogImages.goldSaree[2]],
        category: 'Sharara',
        sizes: ['XS', 'S', 'M', 'L'],
        description: 'A vibrant sharara set with an embroidered kurta and easy festive movement for mehendi and sangeet events.',
        rating: 4.7,
        reviews: 92,
        newArrival: false,
        isBestseller: true,
        stock: 20,
    },
    {
        productId: 'PROD-MINT-LANCHA',
        name: 'Mint Green Lancha Set',
        price: 6999,
        image: catalogImages.festive[2],
        images: [catalogImages.festive[2], catalogImages.goldSaree[1], catalogImages.blackSaree[2]],
        category: 'Lancha',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        description: 'A playful Lancha set with gentle color, soft volume, and lightweight styling for receptions and parties.',
        rating: 4.6,
        reviews: 67,
        newArrival: true,
        isBestseller: false,
        stock: 34,
    },
    {
        productId: 'PROD-PEARL-SALWAR',
        name: 'Pearl White Salwar Kameez',
        price: 4999,
        originalPrice: 6499,
        image: catalogImages.roseLehenga[2],
        images: [catalogImages.roseLehenga[2], catalogImages.goldSaree[0], catalogImages.festive[1]],
        category: 'Salwar Kameez',
        sizes: ['S', 'M', 'L', 'XL'],
        description: 'A refined salwar kameez in pearl tones with light embellishment and a polished boutique feel.',
        rating: 4.5,
        reviews: 58,
        newArrival: false,
        isBestseller: false,
        stock: 42,
    },
    {
        productId: 'PROD-PEARL-WHITE-SALWAR-NEW',
        name: 'Pristine Pearl White Salwar',
        price: 4999,
        image: catalogImages.roseLehenga[2],
        images: [catalogImages.roseLehenga[2], catalogImages.goldSaree[0], catalogImages.festive[1]],
        category: 'Salwar Kameez',
        sizes: ['S', 'M', 'L', 'XL'],
        description: 'Inspired by the City of Pearls, this Pristine Pearl White Salwar Suit exudes understated elegance. Crafted from sheer organza fabric, the outfit is embellished with intricate pearl and stone work.',
        rating: 4.5,
        reviews: 62,
        newArrival: true,
        isBestseller: false,
        stock: 42,
    },
    {
        productId: 'PROD-EMERALD-GHARARA',
        name: 'Emerald Gharara Set',
        price: 11499,
        originalPrice: 14999,
        image: catalogImages.blackSaree[1],
        images: [catalogImages.blackSaree[1], catalogImages.festive[0], catalogImages.purpleSaree[2]],
        category: 'Gharara',
        sizes: ['XS', 'S', 'M', 'L'],
        description: 'A statement gharara set with dramatic flare, intricate details, and a polished festive finish.',
        rating: 4.8,
        reviews: 81,
        newArrival: true,
        isBestseller: true,
        stock: 16,
    },
    {
        productId: 'PROD-DESIGNER-DRESS',
        name: 'Designer Drape Dress',
        price: 5899,
        image: catalogImages.festive[1],
        images: [catalogImages.festive[1], catalogImages.blackSaree[0], catalogImages.roseLehenga[0]],
        category: 'Anarkali',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        description: 'A modern ethnic drape dress with saree-inspired movement and easy event styling.',
        rating: 4.5,
        reviews: 49,
        newArrival: true,
        isBestseller: false,
        stock: 28,
    },

    // New Seeding: Women's Kurta Sets & Other Categories
    {
        productId: 'PROD-FLORAL-KURTA-SET',
        name: 'Elegant Floral Cotton Kurta Set',
        price: 2499,
        originalPrice: 3499,
        image: image('photo-1602810318383-e386cc2a3ccf'),
        images: [
            image('photo-1602810318383-e386cc2a3ccf'),
            image('photo-1583391733956-3750e0ff4e8b'),
            image('photo-1610030469983-98e550d6193c'),
        ],
        category: 'Kurtas',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        description: 'A beautiful everyday floral kurta set for women, crafted in premium breathable cotton. Features a matching dupatta and straight-cut pants, ideal for office and casual wear.',
        rating: 4.8,
        reviews: 42,
        newArrival: true,
        isBestseller: true,
        stock: 45,
        weight: 0.65,
        setType: '3 piece set',
        colors: [
            {
                colorName: 'Teal Green',
                colorCode: '#008080',
                image: { url: image('photo-1610030469983-98e550d6193c') },
                images: [
                    { url: image('photo-1610030469983-98e550d6193c') },
                    { url: image('photo-1583391733956-3750e0ff4e8b') }
                ],
                stock: 25
            },
            {
                colorName: 'Rose Pink',
                colorCode: '#FF69B4',
                image: { url: image('photo-1583391733981-2ae01ba45e96') },
                images: [
                    { url: image('photo-1583391733981-2ae01ba45e96') },
                    { url: image('photo-1610030469946-78b5ee155c96') }
                ],
                stock: 20
            }
        ]
    },
    {
        productId: 'PROD-CHIKANKARI-KURTA',
        name: 'Pastel Chikankari Kurta Set',
        price: 3199,
        originalPrice: 4299,
        image: image('photo-1583391733956-3750e0ff4e8b'),
        images: [
            image('photo-1583391733956-3750e0ff4e8b'),
            image('photo-1610186594416-2c7c0131d8c9'),
            image('photo-1585487000160-6ebcfceb0d03'),
        ],
        category: 'Kurtas',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        description: 'An exquisite hand-embroidered Chikankari kurta set in soft pastel tones. Made with lightweight georgette, this set features detailed threadwork and comes with a inner slip and palazzo pants.',
        rating: 4.9,
        reviews: 31,
        newArrival: true,
        isBestseller: false,
        stock: 30,
        weight: 0.70,
        setType: '2 piece set',
        colors: [
            {
                colorName: 'Lavender Purple',
                colorCode: '#E6E6FA',
                image: { url: image('photo-1610186594416-2c7c0131d8c9') },
                images: [
                    { url: image('photo-1610186594416-2c7c0131d8c9') },
                    { url: image('photo-1585487000160-6ebcfceb0d03') }
                ],
                stock: 15
            },
            {
                colorName: 'Lemon Yellow',
                colorCode: '#FFF700',
                image: { url: image('photo-1610030469950-80e57e84aadd') },
                images: [
                    { url: image('photo-1610030469950-80e57e84aadd') },
                    { url: image('photo-1610030470952-0764f4e29e1e') }
                ],
                stock: 15
            }
        ]
    },
    {
        productId: 'PROD-DINUS-SILK-TUNIC',
        name: "Dinu's Handcrafted Silk Tunic",
        price: 3899,
        originalPrice: 4999,
        image: image('photo-1585487000160-6ebcfceb0d03'),
        images: [
            image('photo-1585487000160-6ebcfceb0d03'),
            image('photo-1593030761757-71fae45fa0e7'),
        ],
        category: "Dinu's Collections",
        sizes: ['S', 'M', 'L', 'XL'],
        description: 'Exquisite silk tunic featuring traditional hand-woven patterns. Designed exclusively under Dinu\'s collection for festive and family get-togethers.',
        rating: 4.7,
        reviews: 19,
        newArrival: false,
        isBestseller: true,
        stock: 25,
        weight: 0.50,
        setType: '1 piece',
        colors: [
            {
                colorName: 'Royal Silk Blue',
                colorCode: '#4169E1',
                image: { url: image('photo-1585487000160-6ebcfceb0d03') },
                images: [{ url: image('photo-1585487000160-6ebcfceb0d03') }],
                stock: 25
            }
        ]
    },
    {
        productId: 'PROD-TWINE-CUT-WORK-BLOUSE',
        name: 'Twine Cut Work Designer Blouse',
        price: 2999,
        originalPrice: 3999,
        image: image('photo-1602810318383-e386cc2a3ccf'),
        images: [image('photo-1602810318383-e386cc2a3ccf')],
        category: 'Twine Cut Work',
        sizes: ['34', '36', '38', '40', '42'],
        description: 'Featuring delicate and intricate twine cut-work borders, this designer blouse is perfect for pairing with raw silk and banarasi sarees.',
        rating: 4.6,
        reviews: 24,
        newArrival: true,
        isBestseller: false,
        stock: 18,
        weight: 0.30,
        setType: '1 piece',
        colors: [
            {
                colorName: 'Golden Glow',
                colorCode: '#FFD700',
                image: { url: image('photo-1602810318383-e386cc2a3ccf') },
                images: [{ url: image('photo-1602810318383-e386cc2a3ccf') }],
                stock: 18
            }
        ]
    },
    {
        productId: 'PROD-BANARASI-DUPATTA',
        name: 'Banarasi Silk Zari Dupatta',
        price: 1899,
        originalPrice: 2499,
        image: image('photo-1610030469950-80e57e84aadd'),
        images: [image('photo-1610030469950-80e57e84aadd')],
        category: 'Dupattas',
        sizes: ['Free Size'],
        description: 'A classic Banarasi silk dupatta featuring gold zari weave motifs. Adds a royal touch to any simple salwar suit.',
        rating: 4.8,
        reviews: 35,
        newArrival: false,
        isBestseller: true,
        stock: 50,
        weight: 0.25,
        setType: '1 piece',
        colors: [
            {
                colorName: 'Classic Gold',
                colorCode: '#D4AF37',
                image: { url: image('photo-1610030469950-80e57e84aadd') },
                images: [{ url: image('photo-1610030469950-80e57e84aadd') }],
                stock: 50
            }
        ]
    },
    {
        productId: 'PROD-VELVET-CHOLI',
        name: 'Embroidered Velvet Choli Blouse',
        price: 2799,
        originalPrice: 3499,
        image: image('photo-1594736797933-d0e501ba2fe8'),
        images: [image('photo-1594736797933-d0e501ba2fe8')],
        category: 'Blouses',
        sizes: ['32', '34', '36', '38', '40'],
        description: 'Velvet choli blouse detailed with heavy zari and stone embroidery on the sleeves and neckline.',
        rating: 4.5,
        reviews: 12,
        newArrival: false,
        isBestseller: false,
        stock: 20,
        weight: 0.35,
        setType: '1 piece',
        colors: [
            {
                colorName: 'Royal Maroon',
                colorCode: '#800000',
                image: { url: image('photo-1594736797933-d0e501ba2fe8') },
                images: [{ url: image('photo-1594736797933-d0e501ba2fe8') }],
                stock: 20
            }
        ]
    },
    {
        productId: 'PROD-SILK-SHARARA-PANTS',
        name: 'Premium Silk Sharara Pants',
        price: 2299,
        originalPrice: 2999,
        image: image('photo-1583391733981-2ae01ba45e96'),
        images: [image('photo-1583391733981-2ae01ba45e96')],
        category: 'Bottom Wears',
        sizes: ['S', 'M', 'L', 'XL'],
        description: 'Vibrant flared silk sharara pants with gold border detailing. Features an elasticated waistband for maximum comfort and fit.',
        rating: 4.7,
        reviews: 28,
        newArrival: true,
        isBestseller: true,
        stock: 35,
        weight: 0.40,
        setType: '1 piece',
        colors: [
            {
                colorName: 'Off-White Ivory',
                colorCode: '#FFFDD0',
                image: { url: image('photo-1583391733981-2ae01ba45e96') },
                images: [{ url: image('photo-1583391733981-2ae01ba45e96') }],
                stock: 35
            }
        ]
    }
];

const saleModes = [
    {
        saleName: 'Ruby Weekend Sale',
        isActive: true,
        description: 'Limited-time festive markdowns on selected Ruby and Rose Ivory styles.',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
];

const sales = [
    {
        saleId: 'SALE-RUBY-SILK-SAREE',
        name: 'Ruby Banarasi Silk Saree',
        price: 6999,
        originalPrice: 10999,
        discount: 36,
        image: catalogImages.rubySaree[0],
        images: catalogImages.rubySaree,
        category: 'Sarees',
        sizes: ['Free Size'],
        description: 'Weekend special on a ruby silk saree with a luxurious festive finish.',
        reviews: 184,
        stock: 10,
        saleMode: 'Ruby Weekend Sale',
    },
    {
        saleId: 'SALE-PURPLE-GEORGETTE-SAREE',
        name: 'Purple Georgette Saree',
        price: 4999,
        originalPrice: 7999,
        discount: 38,
        image: catalogImages.purpleSaree[0],
        images: catalogImages.purpleSaree,
        category: 'Sarees',
        sizes: ['Free Size'],
        description: 'Special markdown on a lightweight georgette saree for effortless evening style.',
        reviews: 121,
        stock: 14,
        saleMode: 'Ruby Weekend Sale',
    },
    {
        saleId: 'SALE-MAGENTA-SHARARA',
        name: 'Magenta Silk Sharara Set',
        price: 7999,
        originalPrice: 12999,
        discount: 38,
        image: catalogImages.rubySaree[2],
        images: [catalogImages.rubySaree[2], catalogImages.roseLehenga[1], catalogImages.goldSaree[2]],
        category: 'Sharara',
        sizes: ['XS', 'S', 'M', 'L'],
        description: 'Festive sharara set with rich color, embroidery, and comfortable movement.',
        reviews: 92,
        stock: 9,
        saleMode: 'Ruby Weekend Sale',
    },
    {
        saleId: 'SALE-PEARL-SALWAR',
        name: 'Pearl White Salwar Kameez',
        price: 3999,
        originalPrice: 6499,
        discount: 38,
        image: catalogImages.roseLehenga[2],
        images: [catalogImages.roseLehenga[2], catalogImages.goldSaree[0], catalogImages.festive[1]],
        category: 'Salwar Kameez',
        sizes: ['S', 'M', 'L', 'XL'],
        description: 'Soft pearl tones and subtle embellishment at a limited-time sale price.',
        reviews: 58,
        stock: 18,
        saleMode: 'Ruby Weekend Sale',
    },
];

const buildRedisUrl = () => {
    const raw = process.env.REDIS_URL;
    const password = process.env.REDIS_PASSWORD;
    if (!raw) return null;
    if (raw.startsWith('redis://') || raw.startsWith('rediss://')) return raw;
    return password ? `redis://:${password}@${raw}` : `redis://${raw}`;
};

const clearRedisCache = async () => {
    const url = buildRedisUrl();
    if (!url) {
        console.warn('Redis URL missing, skipping cache clear.');
        return;
    }

    let client;
    try {
        client = createClient({
            url,
            socket: {
                connectTimeout: 3000,
                reconnectStrategy: false,
            },
        });
        client.on('error', () => undefined);
        await client.connect();
        await client.flushAll();
        console.log('Cleared Redis cache.');
    } catch (error) {
        console.warn('Redis cache clear skipped:', error.message);
    } finally {
        if (client) await client.quit().catch(() => undefined);
    }
};

const seedDatabase = async () => {
    try {
        if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
            console.error(
                '[seed] Refusing to run destructive seed in production. Set ALLOW_DESTRUCTIVE_SEED=true only on a disposable database.'
            );
            process.exit(1);
        }

        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not found in environment variables');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
        console.log('Connected to MongoDB.');

        console.log('Clearing catalog, sales, carts, and orders...');
        await Promise.all([
            Product.deleteMany({}),
            Sale.deleteMany({}),
            SaleMode.deleteMany({}),
            Cart.deleteMany({}),
            Order.deleteMany({}),
        ]);
        console.log('Clean data complete. Users were preserved.');

        await clearRedisCache();

        console.log('Seeding products, sale mode, and sale items...');
        const [createdProducts, createdSaleModes, createdSales] = await Promise.all([
            Product.insertMany(products),
            SaleMode.insertMany(saleModes),
            Sale.insertMany(sales),
        ]);

        console.log(`Seeded ${createdProducts.length} products.`);
        console.log(`Seeded ${createdSaleModes.length} sale mode.`);
        console.log(`Seeded ${createdSales.length} sale items.`);

        await mongoose.disconnect();
        console.log('Database seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        await mongoose.disconnect().catch(() => undefined);
        process.exit(1);
    }
};

seedDatabase();
