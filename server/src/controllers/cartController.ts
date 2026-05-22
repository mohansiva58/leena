import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import Cart from '../models/Cart';
import Product from '../models/Product';
import Sale from '../models/Sale';
import { cacheGet, cacheSet, cacheDel, CACHE_TTL } from '../utils/cache';

const getCacheKey = (userId: string) => `cart:${userId}`;

const resolveVariantImage = (product: any, variantImage?: string): string => {
    if (!variantImage) return product.image;
    const allowedImages = new Set<string>([product.image, ...(product.images || [])]);
    if (product.colors && Array.isArray(product.colors)) {
        for (const col of product.colors) {
            if (col.image?.url) {
                allowedImages.add(col.image.url);
            }
            if (col.images && Array.isArray(col.images)) {
                for (const img of col.images) {
                    if (img?.url) {
                        allowedImages.add(img.url);
                    }
                }
            }
        }
    }
    return allowedImages.has(variantImage) ? variantImage : product.image;
};

const findCartCatalogItem = async (productId: string) => {
    const product = await Product.findOne({ productId });
    if (product) return { item: product, canonicalId: product.productId };

    const sale = await Sale.findOne({ saleId: productId });
    if (sale) return { item: sale, canonicalId: sale.saleId };

    if (mongoose.isValidObjectId(productId)) {
        const productById = await Product.findById(productId);
        if (productById) return { item: productById, canonicalId: productById.productId };

        const saleById = await Sale.findById(productId);
        if (saleById) return { item: saleById, canonicalId: saleById.saleId };
    }

    return null;
};

export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        // Try cache
        const cached = await cacheGet(getCacheKey(userId));
        if (cached) { res.json(cached); return; }

        let cart = await Cart.findOne({ userId });
        if (!cart) cart = await Cart.create({ userId, items: [] });

        await cacheSet(getCacheKey(userId), cart, CACHE_TTL.CART);
        res.json(cart);
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
};

export const addToCart = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { productId, size, quantity = 1, variantImage, color } = req.body;

        if (!productId || !size) {
            res.status(400).json({ error: 'Product ID and size are required' });
            return;
        }

        // Verify product/sale exists and check stock
        const resolved = await findCartCatalogItem(productId);
        if (!resolved) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        const { item: product, canonicalId } = resolved;

        const lineImage = resolveVariantImage(product, variantImage);

        // Check if product is in stock
        if (product.stock <= 0) {
            res.status(400).json({ error: 'This product is out of stock' });
            return;
        }

        // Check if requested quantity is available
        if (quantity > product.stock) {
            res.status(400).json({ 
                error: `Only ${product.stock} item(s) available in stock` 
            });
            return;
        }

        // Get or create cart
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Check if item already exists (by productId, size, image and color)
        const existingItemIndex = cart.items.findIndex(
            (item) => item.productId === canonicalId && item.size === size && item.image === lineImage && item.color === color
        );

        const totalQuantity = existingItemIndex > -1 
            ? cart.items[existingItemIndex].quantity + quantity 
            : quantity;

        // Check total quantity against stock
        if (totalQuantity > product.stock) {
            res.status(400).json({ 
                error: `Only ${product.stock} total item(s) available in stock. You already have ${existingItemIndex > -1 ? cart.items[existingItemIndex].quantity : 0} in your cart.` 
            });
            return;
        }

        if (existingItemIndex > -1) {
            // Update quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.items.push({
                productId: canonicalId,
                name: product.name,
                price: product.price,
                image: lineImage,
                size,
                quantity,
                variantImage: lineImage,
                color,
            });
        }

        await cart.save();

        // Update cache
        await cacheSet(getCacheKey(userId), cart, CACHE_TTL.CART);

        res.json(cart);
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Failed to add item to cart' });
    }
};

export const updateCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const { productId, size, quantity, color } = req.body;

        if (!productId || !size || quantity === undefined) {
            res.status(400).json({ error: 'Product ID, size, and quantity are required' });
            return;
        }

        if (quantity < 1) {
            res.status(400).json({ error: 'Quantity must be at least 1' });
            return;
        }

        // Check product/sale stock
        const resolved = await findCartCatalogItem(productId);
        if (!resolved) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        const { item: product, canonicalId } = resolved;

        if (product.stock <= 0) {
            res.status(400).json({ error: 'This product is out of stock' });
            return;
        }

        if (quantity > product.stock) {
            res.status(400).json({ 
                error: `Only ${product.stock} item(s) available in stock` 
            });
            return;
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            res.status(404).json({ error: 'Cart not found' });
            return;
        }

        const itemIndex = cart.items.findIndex(
            (item) => item.productId === canonicalId && item.size === size && (color === undefined || item.color === color)
        );

        if (itemIndex === -1) {
            res.status(404).json({ error: 'Item not found in cart' });
            return;
        }

        cart.items[itemIndex].quantity = quantity;
        await cart.save();

        await cacheSet(getCacheKey(userId), cart, CACHE_TTL.CART);
        res.json(cart);
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ error: 'Failed to update cart' });
    }
};

export const removeFromCart = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const { productId, size } = req.params;
        const color = req.query.color as string | undefined;

        const cart = await Cart.findOne({ userId });
        if (!cart) { res.status(404).json({ error: 'Cart not found' }); return; }

        cart.items = cart.items.filter(
            (item) => !(item.productId === productId && item.size === size && (!color || item.color === color))
        );
        await cart.save();

        await cacheSet(getCacheKey(userId), cart, CACHE_TTL.CART);
        res.json(cart);
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
};

export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const cart = await Cart.findOne({ userId });
        if (cart) {
            cart.items = [];
            await cart.save();
        }

        await cacheDel(getCacheKey(userId));
        res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ error: 'Failed to clear cart' });
    }
};
