export const generateOrderId = (): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SWC${timestamp}${random}`;
};

export const validatePincode = (pincode: string): boolean => {
    // Indian pincode validation (6 digits)
    return /^\d{6}$/.test(pincode);
};

export const validatePhone = (phone: string): boolean => {
    // Indian phone number validation (10 digits with optional +91)
    return /^(\+91)?[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
};

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
};
