import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: join(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/leena_dev';

const ColorImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String },
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
    sizeCounts: { type: Map, of: Number },
    sizeReservedCounts: { type: Map, of: Number, default: {} },
    description: { type: String, required: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0, min: 0 },
    newArrival: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    stock: { type: Number, default: 100, min: 0 },
    setType: { type: String },
    colors: [
      {
        colorName: { type: String, required: true },
        colorCode: { type: String },
        image: { type: ColorImageSchema, required: true },
        images: [ColorImageSchema],
        stock: { type: Number, min: 0, default: 0 },
      },
    ],
    cloudinaryId: { type: String },
    cloudinaryIds: [{ type: String }],
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', ProductSchema);

const img1 = 'https://images.pexels.com/photos/7920188/pexels-photo-7920188.jpeg?cs=srgb&dl=pexels-sakshi-patwa-3335937-7920188.jpg&fm=jpg';
const img2 = 'https://images.pexels.com/photos/6044266/pexels-photo-6044266.jpeg?cs=srgb&dl=pexels-anjulee-bhatt-1293766-6044266.jpg&fm=jpg';
const img3 = 'https://images.pexels.com/photos/7319128/pexels-photo-7319128.jpeg?cs=srgb&dl=pexels-silk-world-8493096-7319128.jpg&fm=jpg';
const img4 = 'https://images.pexels.com/photos/10556931/pexels-photo-10556931.jpeg?cs=srgb&dl=pexels-anna-khomutova-48113599-10556931.jpg&fm=jpg';

const products = [
  {
    productId: 'PROD-RUBY-SILK-SAREE',
    name: 'Ruby Banarasi Silk Saree',
    price: 8499,
    originalPrice: 10999,
    image: img1,
    images: [img1, img2],
    category: 'Sarees',
    sizes: ['Free Size'],
    sizeCounts: new Map([['Free Size', 10]]),
    description: 'A magnificent ruby silk saree with intricate zari weaving and traditional Banarasi patterns.',
    rating: 4.9,
    reviews: 184,
    newArrival: true,
    isBestseller: true,
    stock: 10,
    setType: 'Saree with Blouse',
  },
  {
    productId: 'PROD-FLORAL-COTTON-KURTI',
    name: 'Elegant Floral Cotton Kurti',
    price: 2499,
    originalPrice: 3499,
    image: img2,
    images: [img2, img3],
    category: 'Kurtis',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    sizeCounts: new Map([
      ['XS', 5],
      ['S', 8],
      ['M', 10],
      ['L', 7],
      ['XL', 4],
    ]),
    description: 'Beautiful everyday floral kurti in premium breathable cotton.',
    rating: 4.8,
    reviews: 142,
    newArrival: true,
    isBestseller: true,
    stock: 34,
    setType: '2 piece set (Kurti, Dupatta)',
  },
  {
    productId: 'PROD-PINK-COTTON-SAREE',
    name: 'Pink Printed Cotton Saree',
    price: 4299,
    originalPrice: 5999,
    image: img3,
    images: [img3, img4],
    category: 'Sarees',
    sizes: ['Free Size'],
    sizeCounts: new Map([['Free Size', 5]]),
    description: 'Elegant pink cotton saree with beautiful traditional block print patterns.',
    rating: 4.7,
    reviews: 156,
    newArrival: false,
    isBestseller: true,
    stock: 5,
    setType: 'Saree with Blouse',
  },
  {
    productId: 'PROD-CHIKANKARI-KURTI',
    name: 'Pastel Chikankari Kurti Set',
    price: 3199,
    originalPrice: 4299,
    image: img4,
    images: [img4, img1],
    category: 'Kurtis',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    sizeCounts: new Map([
      ['XS', 3],
      ['S', 5],
      ['M', 6],
      ['L', 4],
      ['XL', 2],
    ]),
    description: 'Hand-embroidered Chikankari kurti in soft pastel tones.',
    rating: 4.9,
    reviews: 131,
    newArrival: true,
    isBestseller: false,
    stock: 20,
    setType: '2 piece set (Kurti, Palazzo)',
  },
];

async function seed() {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB');

  await Product.deleteMany({});
  console.log('Cleared existing products');

  const created = await Product.insertMany(products);
  console.log(`Created ${created.length} products`);

  for (const p of created) {
    console.log(`  ${p.productId}: ${p.name} - stock=${p.stock}`);
  }

  await mongoose.disconnect();
  console.log('Done');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
