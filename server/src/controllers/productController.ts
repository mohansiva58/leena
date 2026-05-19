import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Product, { IProduct } from '../models/Product';
import { writeAudit } from '../utils/auditLog';
import { deleteFromCloudinary } from '../config/cloudinary';
import { cacheGet, cacheSet, cacheDel, cacheInvalidatePrefix, CACHE_TTL } from '../utils/cache';
import {
    handleImageUploads,
    parseSizes,
    parseCommonFields,
    validateRequiredItemFields,
    generateItemId,
    handleValidationError,
} from '../utils/itemHelpers';
import mongoose from 'mongoose';

/** Invalidate all product caches */
const invalidateProductCache = async (productId?: string) => {
    await cacheInvalidatePrefix('products:');
    if (productId) await cacheDel(`product:${productId}`);
};

const warmProductReadCaches = async () => {
    const [recentProducts, popularProducts] = await Promise.all([
        Product.find({}).sort({ createdAt: -1 }).limit(12).lean(),
        Product.find({}).sort({ reviews: -1, rating: -1 }).limit(12).lean(),
    ]);

    await Promise.all([
        cacheSet('products:recent', recentProducts, CACHE_TTL.RECENT),
        cacheSet('products:popular', popularProducts, CACHE_TTL.FREQUENT),
    ]);
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const productData = req.body;
        const files = req.files as unknown as { [fieldname: string]: Express.Multer.File[] };

        // Shared: upload images
        if (!(await handleImageUploads(files, productData, res))) return;

        console.log('=== AFTER IMAGE UPLOAD ===');
        console.log('Main image (productData.image):', productData.image ? '✓' : '✗ MISSING');
        console.log('Additional images (productData.images):', productData.images?.length || 0);
        if (productData.images?.length > 0) {
            productData.images.forEach((img: string, i: number) => {
                console.log(`  Image ${i + 1}:`, img.substring(0, 60));
            });
        }

        // Shared: parse sizes
        if (!parseSizes(productData, res)) return;

        // Shared: convert types
        parseCommonFields(productData);
        productData.newArrival = productData.isNew === 'true' || productData.isNew === true || productData.newArrival === 'true' || productData.newArrival === true;
        delete productData.isNew;
        productData.isBestseller = productData.isBestseller === 'true' || productData.isBestseller === true;

        // Shared: validate
        if (!validateRequiredItemFields(productData, res)) return;

        if (!productData.productId) {
            productData.productId = generateItemId('PROD');
        }

        console.log('=== BEFORE DATABASE SAVE ===');
        console.log('Product name:', productData.name);
        console.log('Main image:', productData.image ? '✓ Present' : '✗ MISSING!');
        
        // FALLBACK: If no main image but additional images exist, use the first one
        if (!productData.image && productData.images && productData.images.length > 0) {
            console.warn('⚠️ FALLBACK: No main image provided, using first additional image as main');
            productData.image = productData.images[0];
            productData.cloudinaryId = productData.cloudinaryIds?.[0];
            console.log('Fallback main image set to:', productData.image.substring(0, 80));
        }
        
        if (!productData.image) {
            console.error('ERROR: Main image is missing! Product cannot be saved without a main image.');
            res.status(400).json({ error: 'Main image is required and must be properly uploaded' });
            return;
        }
        console.log('Main image URL:', productData.image.substring(0, 80));
        console.log('Additional images:', productData.images?.length || 0);
        if (productData.images?.length > 0) {
            productData.images.forEach((img: string, i: number) => {
                console.log(`  Additional ${i + 1}:`, img.substring(0, 80));
            });
        }

        const newProduct = await Product.create(productData);

        console.log('=== AFTER DATABASE SAVE ===');
        console.log('Saved product ID:', newProduct.productId);
        console.log('Saved main image:', newProduct.image ? '✓ Present' : '✗ MISSING IN DB!');
        if (!newProduct.image) {
            console.error('CRITICAL ERROR: Main image was not saved to database!');
        } else {
            console.log('Main image URL:', newProduct.image.substring(0, 80));
        }
        console.log('Saved additional images:', newProduct.images?.length || 0);
        if (newProduct.images && newProduct.images.length > 0) {
            newProduct.images.forEach((img: string, i: number) => {
                console.log(`  Saved additional ${i + 1}:`, img.substring(0, 80));
            });
        }

        // Shared: invalidate cache (uses SCAN, not KEYS)
        await invalidateProductCache();
        await warmProductReadCaches();

        await writeAudit(req.user!.uid, req.user!.email, 'product_create', 'product', newProduct.productId, {});

        res.status(201).json(newProduct);
    } catch (error: unknown) {
        if (!handleValidationError(error, res)) {
            console.error('Create product error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create product';
            res.status(500).json({ error: errorMessage });
        }
    }
};

export const bulkCreateProducts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const products = req.body;

        if (!Array.isArray(products)) {
            res.status(400).json({ error: 'Input must be an array of products' });
            return;
        }

        const productsWithIds = products.map((p: Partial<IProduct>) => {
            const raw = p as Record<string, unknown>;
            return {
                ...p,
                productId: p.productId || generateItemId('PROD'),
                newArrival: p.newArrival || raw.isNew === true || raw.isNew === 'true' || false,
                isNew: undefined,
            };
        });

        const result = await Product.insertMany(productsWithIds);
        await invalidateProductCache();
        await warmProductReadCaches();

        await writeAudit(req.user!.uid, req.user!.email, 'product_bulk_create', 'product', 'bulk', {
            count: result.length,
        });

        res.status(201).json({
            message: `Successfully created ${result.length} products`,
            products: result,
        });
    } catch (error: unknown) {
        console.error('Bulk create error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to bulk create products';
        res.status(500).json({ error: errorMessage });
    }
};

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { category, minPrice, maxPrice, search, sort } = req.query;
        const query: Record<string, unknown> = {};

        if (category && category !== 'All') query.category = category;
        if (minPrice || maxPrice) {
            const priceQuery: Record<string, number> = {};
            if (minPrice) priceQuery.$gte = Number(minPrice);
            if (maxPrice) priceQuery.$lte = Number(maxPrice);
            query.price = priceQuery;
        }
        if (search) query.$text = { $search: search as string };

        // Try cache
        const isUnfiltered = Object.keys(query).length === 0;
        let cacheKey = `products:${JSON.stringify(query)}:${sort || 'default'}`;
        if (isUnfiltered && !sort) cacheKey = 'products:recent';
        if (isUnfiltered && sort === 'popular') cacheKey = 'products:popular';

        const cached = await cacheGet(cacheKey);
        if (cached) { res.json(cached); return; }

        let sortOption: string | Record<string, mongoose.SortOrder> = { createdAt: -1 };
        if (sort === 'price-asc') sortOption = { price: 1 };
        if (sort === 'price-desc') sortOption = { price: -1 };
        if (sort === 'rating') sortOption = { rating: -1 };
        if (sort === 'popular') sortOption = { reviews: -1 };

        const products = await Product.find(query).sort(sortOption).lean(); // .lean() = faster, no Mongoose overhead

        const ttl = cacheKey === 'products:recent' ? CACHE_TTL.RECENT : cacheKey === 'products:popular' ? CACHE_TTL.FREQUENT : CACHE_TTL.PRODUCTS;
        await cacheSet(cacheKey, products, ttl);
        res.json(products);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const cacheKey = `product:${id}`;

        const cached = await cacheGet(cacheKey);
        if (cached) { 
            console.log('Product from cache:', id);
            res.json(cached); 
            return; 
        }

        const product = await Product.findOne({ productId: id }).lean();
        if (!product) { 
            console.warn('Product not found:', id);
            res.status(404).json({ error: 'Product not found' }); 
            return; 
        }

        console.log('=== PRODUCT RETRIEVED FROM DB ===');
        console.log('Product ID:', product.productId);
        console.log('Main image:', product.image ? 'Present' : 'MISSING');
        console.log('Additional images:', product.images?.length || 0);
        if (product.images?.length > 0) {
            product.images.forEach((img: string, i: number) => {
                console.log(`  Additional ${i + 1}:`, img.substring(0, 60));
            });
        }

        await cacheSet(cacheKey, product, CACHE_TTL.PRODUCTS);
        res.json(product);
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};

export const getFeaturedProducts = async (_req: Request, res: Response): Promise<void> => {
    try {
        const cacheKey = 'products:featured';
        const cached = await cacheGet(cacheKey);
        if (cached) { res.json(cached); return; }

        const products = await Product.find({}).limit(4).sort({ createdAt: -1 }).lean();
        await cacheSet(cacheKey, products, CACHE_TTL.PRODUCTS);
        res.json(products);
    } catch (error) {
        console.error('Get featured products error:', error);
        res.status(500).json({ error: 'Failed to fetch featured products' });
    }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const files = req.files as unknown as { [fieldname: string]: Express.Multer.File[] };
        
        // Try productId first, only try ObjectId if it looks like a valid MongoDB ID
        let existing = await Product.findOne({ productId: id });
        if (!existing && mongoose.Types.ObjectId.isValid(id)) {
            existing = await Product.findById(id);
        }

        // Preserve existing main image if not being updated
        if (updates.existingMainImage && !files?.image?.[0]) {
            updates.image = updates.existingMainImage;
            console.log('Preserving existing main image:', updates.image.substring(0, 60));
        }
        delete updates.existingMainImage;

        // Shared: upload images (pass existing product for ID preservation)
        if (!(await handleImageUploads(files, updates, res, existing || undefined))) return;

        // Shared: parse fields
        parseCommonFields(updates);
        if (typeof updates.isNew !== 'undefined') {
            updates.newArrival = updates.isNew === 'true' || updates.isNew === true;
            delete updates.isNew;
        }
        if (typeof updates.isBestseller !== 'undefined') {
            updates.isBestseller = updates.isBestseller === 'true' || updates.isBestseller === true;
        }
        if (updates.sizes && typeof updates.sizes === 'string') {
            try { updates.sizes = JSON.parse(updates.sizes); } catch { updates.sizes = updates.sizes.split(',').map((s: string) => s.trim()); }
        }

        // Try productId first, fallback to _id if valid ObjectId
        let updated = await Product.findOneAndUpdate({ productId: id }, updates, { new: true });
        if (!updated && mongoose.Types.ObjectId.isValid(id)) {
            updated = await Product.findByIdAndUpdate(id, updates, { new: true });
        }
        if (!updated) { res.status(404).json({ error: 'Product not found' }); return; }

        if (existing && files?.image?.[0] && existing.cloudinaryId) {
            await deleteFromCloudinary(existing.cloudinaryId);
        }
        if (existing && files?.images?.length && existing.cloudinaryIds?.length) {
            await deleteFromCloudinary(existing.cloudinaryIds);
        }

        await invalidateProductCache(id);
        await warmProductReadCaches();
        await writeAudit(req.user!.uid, req.user!.email, 'product_update', 'product', id, {});
        res.json(updated);
    } catch (error: unknown) {
        console.error('Update product error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update product';
        res.status(500).json({ error: errorMessage });
    }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        let deleted = await Product.findOneAndDelete({ productId: id });
        if (!deleted) deleted = await Product.findByIdAndDelete(id);
        if (!deleted) { res.status(404).json({ error: 'Product not found' }); return; }

        await deleteFromCloudinary([deleted.cloudinaryId, ...(deleted.cloudinaryIds || [])].filter(Boolean) as string[]);
        await invalidateProductCache(id);
        await warmProductReadCaches();
        await writeAudit(req.user!.uid, req.user!.email, 'product_delete', 'product', id, {});
        res.json({ message: 'Product deleted successfully' });
    } catch (error: unknown) {
        console.error('Delete product error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
        res.status(500).json({ error: errorMessage });
    }
};
