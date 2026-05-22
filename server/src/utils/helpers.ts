export const generateOrderId = (): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SWC${timestamp}${random}`;
};

export const calculateShipping = (subtotal: number, state?: string): number => {
    if (subtotal >= 2000) {
        return 0;
    }
    if (!state) {
        return 90; // Default flat rate
    }
    const normalizedState = state.trim().toLowerCase();
    const stateRates: Record<string, number> = {
        'telangana': 70,
        'andhra pradesh': 70,
        'karnataka': 80,
        'tamil nadu': 80,
        'kerala': 80,
        'maharashtra': 100,
        'goa': 100,
        'delhi': 90,
        'haryana': 90,
        'punjab': 90,
        'himachal pradesh': 90,
        'jammu and kashmir': 100,
        'uttar pradesh': 85,
        'rajasthan': 85,
        'madhya pradesh': 85,
        'west bengal': 85,
        'assam': 95,
        'bihar': 85,
        'jharkhand': 85,
        'odisha': 85,
        'manipur': 100,
        'mizoram': 100,
        'nagaland': 100,
        'tripura': 100,
        'arunachal pradesh': 100,
        'meghalaya': 100,
        'sikkim': 100,
        'default': 90
    };
    return stateRates[normalizedState] || stateRates['default'];
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
