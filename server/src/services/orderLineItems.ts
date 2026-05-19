import mongoose from 'mongoose';
import Product from '../models/Product';
import Sale from '../models/Sale';

export interface ResolvedLine {
    productId: string;
    name: string;
    price: number;
    image: string;
    size: string;
    quantity: number;
    source: 'product' | 'sale';
    variantImage?: string;
}

export interface RawOrderItemInput {
    productId: string;
    size: string;
    quantity?: number;
    image?: string;
    variantImage?: string;
}

function resolveVariantImage(item: { image: string; images?: string[] }, raw: RawOrderItemInput): string {
    const requestedImage = raw.variantImage || raw.image;
    if (!requestedImage) return item.image;

    const allowedImages = new Set([item.image, ...(item.images || [])]);
    return allowedImages.has(requestedImage) ? requestedImage : item.image;
}

/**
 * Resolve catalog lines from DB (ignore client-supplied prices).
 */
export async function resolveOrderLines(
    rawItems: RawOrderItemInput[]
): Promise<{ lines: ResolvedLine[]; subtotal: number }> {
    const lines: ResolvedLine[] = [];
    let subtotal = 0;

    for (const raw of rawItems) {
        const qty = Math.max(1, Math.floor(Number(raw.quantity) || 1));
        if (!raw.productId || !raw.size) {
            throw new Error('Each item must include productId and size');
        }

        const product = await Product.findOne({ productId: raw.productId });
        if (product) {
            if (!product.sizes?.includes(raw.size)) {
                throw new Error(`Invalid size for product ${raw.productId}`);
            }
            if (product.stock < qty) {
                throw new Error(`Insufficient stock for ${product.name}`);
            }
            const lineImage = resolveVariantImage(product, raw);
            lines.push({
                productId: raw.productId,
                name: product.name,
                price: product.price,
                image: lineImage,
                size: raw.size,
                quantity: qty,
                source: 'product',
                variantImage: lineImage,
            });
            subtotal += product.price * qty;
            continue;
        }

        const sale = await Sale.findOne({ saleId: raw.productId });
        if (sale) {
            if (!sale.sizes?.includes(raw.size)) {
                throw new Error(`Invalid size for sale item ${raw.productId}`);
            }
            if (sale.stock < qty) {
                throw new Error(`Insufficient stock for ${sale.name}`);
            }
            const lineImage = resolveVariantImage(sale, raw);
            lines.push({
                productId: raw.productId,
                name: sale.name,
                price: sale.price,
                image: lineImage,
                size: raw.size,
                quantity: qty,
                source: 'sale',
                variantImage: lineImage,
            });
            subtotal += sale.price * qty;
            continue;
        }

        throw new Error(`Unknown product or sale: ${raw.productId}`);
    }

    return { lines, subtotal };
}

export async function decrementStockForLines(
    lines: ResolvedLine[],
    session?: mongoose.ClientSession
): Promise<void> {
    for (const line of lines) {
        if (line.source === 'product') {
            const res = await Product.updateOne(
                { productId: line.productId, stock: { $gte: line.quantity } },
                { $inc: { stock: -line.quantity } },
                session ? { session } : {}
            );
            if (res.modifiedCount !== 1) {
                throw new Error(`Stock conflict for product ${line.productId}`);
            }
        } else {
            const res = await Sale.updateOne(
                { saleId: line.productId, stock: { $gte: line.quantity } },
                { $inc: { stock: -line.quantity } },
                session ? { session } : {}
            );
            if (res.modifiedCount !== 1) {
                throw new Error(`Stock conflict for sale item ${line.productId}`);
            }
        }
    }
}

export async function incrementStockForLines(
    lines: ResolvedLine[],
    session?: mongoose.ClientSession
): Promise<void> {
    for (const line of lines) {
        if (line.source === 'product') {
            await Product.updateOne(
                { productId: line.productId },
                { $inc: { stock: line.quantity } },
                session ? { session } : {}
            );
        } else {
            await Sale.updateOne(
                { saleId: line.productId },
                { $inc: { stock: line.quantity } },
                session ? { session } : {}
            );
        }
    }
}
