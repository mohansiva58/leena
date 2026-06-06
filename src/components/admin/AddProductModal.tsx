import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Plus, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { categories } from '@/lib/products';

interface Product {
    _id?: string;
    productId?: string;
    name?: string;
    price?: number;
    originalPrice?: number;
    category?: string;
    description?: string;
    stock?: number;
    setType?: string;
    isNew?: boolean;
    newArrival?: boolean;
    isBestseller?: boolean;
    sizes?: string | string[];
    sizeCounts?: Record<string, number>;
    image?: string;
    images?: string[];
}

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    product?: Product;
}

interface ValidationErrorDetail {
    field: string;
    message: string;
}

interface ApiErrorResponse {
    response?: {
        data?: {
            details?: ValidationErrorDetail[];
            error?: string;
        };
    };
    message?: string;
}

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL','XXL'];

export function AddProductModal({ isOpen, onClose, onSuccess, product }: AddProductModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        originalPrice: '',
        category: '',
        description: '',
        stock: '0',
        setType: '1 piece',
        isNew: false,
        isBestseller: false,
        sizes: DEFAULT_SIZES.join(', '),
    });
    const [sizeRows, setSizeRows] = useState<Array<{ size: string; quantity: string }>>(
        DEFAULT_SIZES.map((size) => ({ size, quantity: '0' }))
    );

    const [mainImage, setMainImage] = useState<File | null>(null);
    const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
    const [additionalImages, setAdditionalImages] = useState<File[]>([]);
    const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (product) {
                const sizes = Array.isArray(product.sizes) ? product.sizes : String(product.sizes || '').split(',').map((s) => s.trim()).filter(Boolean);
                const sizeCounts = product.sizeCounts || {};
                setFormData({
                    name: product.name,
                    price: product.price.toString(),
                    originalPrice: product.originalPrice?.toString() || '',
                    category: product.category,
                    description: product.description,
                    stock: product.stock?.toString() || String(Object.values(sizeCounts).reduce((sum, value) => sum + Number(value || 0), 0)),
                    setType: product.setType || '1 piece',
                    isNew: product.newArrival || product.isNew || false,
                    isBestseller: product.isBestseller || false,
                    sizes: sizes.join(', '),
                });
                setSizeRows(
                    (sizes.length > 0 ? sizes : DEFAULT_SIZES).map((size) => ({
                        size,
                        quantity: String(sizeCounts[size] ?? 0),
                    }))
                );
                setMainImagePreview(product.image);
                setAdditionalImagePreviews(product.images || []);
                setExistingImageUrls(product.images || []);
            } else {
                setFormData({
                    name: '',
                    price: '',
                    originalPrice: '',
                    category: '',
                    description: '',
                    stock: '0',
                    setType: '1 piece',
                    isNew: false,
                    isBestseller: false,
                    sizes: DEFAULT_SIZES.join(', '),
                });
                setSizeRows(DEFAULT_SIZES.map((size) => ({ size, quantity: '0' })));
                setMainImage(null);
                setMainImagePreview(null);
                setAdditionalImages([]);
                setAdditionalImagePreviews([]);
                setExistingImageUrls([]);
            }
        }
    }, [isOpen, product]);

    const mainImageInputRef = useRef<HTMLInputElement>(null);
    const additionalImagesInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSizeRowChange = (index: number, field: 'size' | 'quantity', value: string) => {
        setSizeRows((current) => {
            const next = [...current];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const addSizeRow = () => {
        setSizeRows((current) => [...current, { size: '', quantity: '0' }]);
    };

    const removeSizeRow = (index: number) => {
        setSizeRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
    };

    const normalizedSizeRows = sizeRows
        .map((row) => ({
            size: row.size.trim(),
            quantity: Math.max(0, Math.floor(Number(row.quantity) || 0)),
        }))
        .filter((row) => row.size.length > 0 && row.quantity > 0);

    const totalInventory = normalizedSizeRows.reduce((sum, row) => sum + row.quantity, 0);

    const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setMainImage(file);
            setMainImagePreview(URL.createObjectURL(file));
        }
    };

    const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) {
            console.warn('No files in input');
            return;
        }

        const files = Array.from(e.target.files);
        const newPreviews = files.map(file => URL.createObjectURL(file));
        
        setAdditionalImages(prev => [...prev, ...files]);
        setAdditionalImagePreviews(prev => [...prev, ...newPreviews]);

        e.target.value = '';
        toast.success(`✓ Added ${files.length} image(s)`);
    };

    const removeAdditionalImage = (imageUrl: string, isExisting: boolean) => {
        if (isExisting) {
            // Remove from existing images
            setExistingImageUrls(prev => prev.filter(url => url !== imageUrl));
        } else {
            // Remove from new uploaded images by finding the file that matches the preview
            setAdditionalImages(prev => {
                // Find the file by its preview URL
                const index = additionalImagePreviews.findIndex((preview, idx) => {
                    const isExistingPreview = idx < existingImageUrls.length;
                    return !isExistingPreview && preview === imageUrl;
                });
                if (index >= 0) {
                    const newIndex = index - existingImageUrls.length;
                    return prev.filter((_, i) => i !== newIndex);
                }
                return prev;
            });
        }
        
        // Always remove from previews
        setAdditionalImagePreviews(prev => prev.filter(url => url !== imageUrl));
        
        toast.success('Image removed');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.name.trim()) {
            toast.error('Product name is required');
            return;
        }
        if (!formData.price || Number(formData.price) <= 0) {
            toast.error('Valid price is required');
            return;
        }
        if (!formData.category) {
            toast.error('Category is required');
            return;
        }
        if (!formData.description.trim()) {
            toast.error('Product description is required');
            return;
        }
        if (normalizedSizeRows.length === 0) {
            toast.error('Add at least one size with a quantity');
            return;
        }
        if (!mainImage && !product) {
            toast.error('Please select a main image');
            return;
        }

        setLoading(true);

        try {
            const data = new FormData();
            
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, String(value));
            });
            data.set('sizes', normalizedSizeRows.map((row) => row.size).join(', '));
            data.set('sizeCounts', JSON.stringify(Object.fromEntries(normalizedSizeRows.map((row) => [row.size, row.quantity]))));
            data.set('stock', String(totalInventory));

            if (mainImage) {
                data.append('image', mainImage);
            } else if (product && mainImagePreview) {
                data.append('existingMainImage', mainImagePreview);
            }

            existingImageUrls.forEach((url) => {
                data.append('existingImages', url);
            });

            additionalImages.forEach((file) => {
                data.append('images', file);
            });

            if (product) {
                const productId = product.productId || product._id;
                await api.put(`/products/${productId}`, data, {
                    headers: { 'Content-Type': undefined },
                });
                toast.success(`Product updated! Saved ${existingImageUrls.length + additionalImages.length} image(s)`);
            } else {
                await api.post('/products', data, {
                    headers: { 'Content-Type': undefined },
                });
                toast.success(`Product created! Saved ${existingImageUrls.length + additionalImages.length} image(s)`);
            }

            onSuccess();
            onClose();

            // Reset form
            setFormData({
                name: '',
                price: '',
                originalPrice: '',
                category: '',
                description: '',
                stock: '0',
                setType: '1 piece',
                isNew: false,
                isBestseller: false,
                sizes: DEFAULT_SIZES.join(', '),
            });
            setSizeRows(DEFAULT_SIZES.map((size) => ({ size, quantity: '0' })));
            setMainImage(null);
            setMainImagePreview(null);
            setAdditionalImages([]);
            setAdditionalImagePreviews([]);
            setExistingImageUrls([]);
        } catch (err: unknown) {
            const error = err as ApiErrorResponse;
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/45 backdrop-blur-sm overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-2xl bg-background rounded-xl shadow-xl my-8 flex flex-col max-h-[90vh]"
            >
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold font-serif">{product ? 'Edit Product' : 'Add New Product'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 flex-1">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Product Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#06095b]"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Price (₹)</label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Original Price (₹)</label>
                                        <input
                                            type="number"
                                            name="originalPrice"
                                            value={formData.originalPrice}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#06095b]"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.filter(c => c !== 'All').map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Total Stock</label>
                                    <input
                                        type="number"
                                        name="stock"
                                        value={totalInventory}
                                        readOnly
                                        className="w-full px-4 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#06095b] opacity-80"
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">This is calculated automatically from the size quantities below.</p>
                                </div>



                                <div>
                                    <label className="block text-sm font-medium mb-1">Set Type</label>
                                    <select
                                        name="setType"
                                        value={formData.setType}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#06095b]"
                                    >
                                        <option value="1 piece">1 piece</option>
                                        <option value="2 piece set">2 piece set</option>
                                        <option value="3 piece set">3 piece set</option>
                                    </select>
                                </div>

                                {/* Color Options */}
                                {/* <div>
                                    <label className="block text-sm font-medium mb-2">Available Colors</label>
                                    <div className="space-y-2 mb-3">
                                        {colors.map((color, idx) => (
                                            <div key={idx} className="flex items-center gap-2 p-2 bg-secondary rounded-lg">
                                                <div
                                                    className="w-8 h-8 rounded-full border border-border"
                                                    style={{ backgroundColor: color.colorCode }}
                                                    title={color.colorName}
                                                />
                                                <span className="flex-1 text-sm">{color.colorName}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setColors(colors.filter((_, i) => i !== idx))}
                                                    className="text-xs px-2 py-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newColorName}
                                            onChange={(e) => setNewColorName(e.target.value)}
                                            placeholder="Color name (e.g., Red, Blue)"
                                            className="flex-1 px-3 py-2 text-sm bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                        <input
                                            type="color"
                                            value={newColorCode}
                                            onChange={(e) => setNewColorCode(e.target.value)}
                                            className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (newColorName.trim()) {
                                                    setColors([...colors, { colorName: newColorName, colorCode: newColorCode }]);
                                                    setNewColorName('');
                                                    setNewColorCode('#FF0000');
                                                }
                                            }}
                                            className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                                        >
                                            Add Color
                                        </button>
                                    </div>
                                </div> */}
                            </div>

                            <div className="space-y-4">
                                {/* Main Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Main Image</label>
                                    <div
                                        onClick={() => mainImageInputRef.current?.click()}
                                        className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-[#06095b] transition-colors min-h-[150px] bg-secondary/30"
                                    >
                                        {mainImagePreview ? (
                                            <div className="relative w-full h-40">
                                                <img src={mainImagePreview} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMainImage(null);
                                                        setMainImagePreview(null);
                                                    }}
                                                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full shadow-md hover:bg-destructive/90"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="text-muted-foreground mb-2" size={24} />
                                                <span className="text-sm text-muted-foreground">Click to upload main image</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            ref={mainImageInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleMainImageChange}
                                        />
                                    </div>
                                </div>

                                {/* Additional Images - Improved Display */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-medium">Product Gallery Images</label>
                                        <div className="flex gap-4 text-xs">
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 bg-blue-300 rounded"></div>
                                                <span className="text-muted-foreground">Existing: {existingImageUrls.length}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 bg-green-300 rounded"></div>
                                                <span className="text-muted-foreground">New: {additionalImages.length}</span>
                                            </div>
                                            <span className="font-semibold text-foreground">Total: {additionalImagePreviews.length}</span>
                                        </div>
                                    </div>

                                    {/* Image Grid - 4 columns with larger thumbnails */}
                                    <div className="border border-border rounded-lg p-4 bg-secondary/20 max-h-96 overflow-y-auto">
                                        {additionalImagePreviews.length > 0 ? (
                                            <div className="grid grid-cols-4 gap-4">
                                                {additionalImagePreviews.map((preview, index) => {
                                                    const isExisting = index < existingImageUrls.length;
                                                    return (
                                                        <div 
                                                            key={preview}
                                                            className={`relative aspect-square rounded-lg overflow-hidden group border-3 transition-all hover:shadow-xl ${
                                                                isExisting 
                                                                    ? 'border-blue-300' 
                                                                    : 'border-green-300'
                                                            }`}
                                                        >
                                                            <img 
                                                                src={preview} 
                                                                alt={`Image ${index + 1}`} 
                                                                className="w-full h-full object-cover"
                                                            />
                                                            {/* Badge */}
                                                            <div className="absolute bottom-2 right-2 px-3 py-1.5 bg-black/70 text-white text-xs rounded font-medium flex items-center gap-1.5">
                                                                {isExisting ? '📦' : '✨'} 
                                                                <span>{isExisting ? 'Existing' : 'New'}</span>
                                                            </div>
                                                            {/* Delete Button */}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeAdditionalImage(preview, isExisting)}
                                                                className="absolute top-2 right-2 p-2 bg-destructive/90 text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive shadow-lg"
                                                                title="Remove image"
                                                            >
                                                                <X size={16} strokeWidth={3} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-muted-foreground">
                                                <ImageIcon size={40} className="mx-auto mb-3 opacity-50" />
                                                <p className="text-sm">No images added yet</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload Button */}
                                    <button
                                        type="button"
                                        onClick={() => additionalImagesInputRef.current?.click()}
                                        className="w-full py-4 px-4 border-2 border-dashed border-[#06095b] rounded-lg hover:bg-[#06095b]/10 hover:border-[#06095b] transition-all flex items-center justify-center gap-3 text-[#06095b] font-semibold text-base"
                                    >
                                        <Plus size={22} />
                                        Add More Images (Click or Drag & Drop)
                                    </button>
                                    
                                    <input
                                        type="file"
                                        ref={additionalImagesInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        multiple
                                        onChange={handleAdditionalImagesChange}
                                    />
                                </div>
                            </div>
                        </div>



                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                required
                                rows={4}
                                className="w-full px-4 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#06095b]"
                                placeholder="Detailed product description..."
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium">Size Quantities</label>
                                <button
                                    type="button"
                                    onClick={addSizeRow}
                                    className="text-xs font-semibold text-[#06095b] hover:underline"
                                >
                                    + Add size
                                </button>
                            </div>
                            <div className="rounded-xl border border-border bg-secondary/20 p-3 max-h-64 overflow-y-auto space-y-3">
                                {sizeRows.map((row, index) => (
                                    <div key={index} className="grid grid-cols-[1fr_120px_auto] gap-2 items-center">
                                        <input
                                            type="text"
                                            value={row.size}
                                            onChange={(e) => handleSizeRowChange(index, 'size', e.target.value)}
                                            className="w-full px-3 py-2 bg-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#06095b]"
                                            placeholder="Size"
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            value={row.quantity}
                                            onChange={(e) => handleSizeRowChange(index, 'quantity', e.target.value)}
                                            className="w-full px-3 py-2 bg-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#06095b]"
                                            placeholder="Count"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeSizeRow(index)}
                                            className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-background"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">Example: XS 3, M 3, L 4. Sizes with zero count will be treated as out of stock.</p>
                        </div>

                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isNew"
                                    checked={formData.isNew}
                                    onChange={handleCheckboxChange}
                                    className="w-4 h-4 accent-[#06095b] rounded border-border"
                                />
                                <span className="text-sm font-medium">New Arrival</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isBestseller"
                                    checked={formData.isBestseller}
                                    onChange={handleCheckboxChange}
                                    className="w-4 h-4 accent-[#06095b] rounded border-border"
                                />
                                <span className="text-sm font-medium">Bestseller</span>
                            </label>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-border flex justify-end gap-3 sticky bottom-0 bg-background rounded-b-xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg border border-border font-medium hover:bg-secondary transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-2 bg-[#06095b] text-white rounded-lg hover:bg-[#06095b]/90 disabled:opacity-50 font-medium transition-colors"
                    >
                        {loading ? (product ? 'Updating...' : 'Creating...') : (product ? 'Update Product' : 'Create Product')}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
