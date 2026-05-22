/**
 * Shipping cost calculator based on state (flat rate per order)
 */

// State to rate mapping (₹ flat shipping fee per order)
const stateRates: Record<string, number> = {
  // South India - Premium rates
  'Telangana': 70,
  'Andhra Pradesh': 70,
  'Karnataka': 80,
  'Tamil Nadu': 80,
  'Kerala': 80,

  // South-West - Premium rates (Mumbai region)
  'Maharashtra': 100,
  'Goa': 100,

  // North - Standard rates
  'Delhi': 90,
  'Haryana': 90,
  'Punjab': 90,
  'Himachal Pradesh': 90,
  'Jammu and Kashmir': 100,
  'Uttar Pradesh': 85,
  'Rajasthan': 85,
  'Madhya Pradesh': 85,

  // East - Standard rates
  'West Bengal': 85,
  'Assam': 95,
  'Bihar': 85,
  'Jharkhand': 85,
  'Odisha': 85,

  // North-East - Premium rates
  'Manipur': 100,
  'Mizoram': 100,
  'Nagaland': 100,
  'Tripura': 100,
  'Arunachal Pradesh': 100,
  'Meghalaya': 100,
  'Sikkim': 100,

  // Default rate
  'default': 90,
};

export interface ShippingCalculationParams {
  state: string;
  cartItems: Array<{ weight?: number; quantity: number }>;
  subtotal: number;
}

export interface ShippingCalculationResult {
  totalWeight: number;
  chargeableWeight: number; // Minimum 1 kg (preserved for API compatibility)
  ratePerKg: number;
  shippingCost: number;
  breakdown: string; // For display
}

/**
 * Calculate shipping cost based on state (flat rate per order)
 */
export function calculateShippingCost(params: ShippingCalculationParams): ShippingCalculationResult {
  const { state, subtotal } = params;

  // Get rate for the state (case-insensitive)
  const rate = stateRates[state] || stateRates[state.toLowerCase()] || stateRates['default'];

  // Calculate flat shipping cost
  const shippingCost = subtotal >= 2000 ? 0 : rate;

  // Create breakdown string for display
  const breakdown = subtotal >= 2000
    ? `Free shipping on orders above ₹2,000!`
    : `Flat shipping charge for ${state}: ₹${shippingCost}`;

  return {
    totalWeight: 0,
    chargeableWeight: 0,
    ratePerKg: rate,
    shippingCost,
    breakdown,
  };
}

/**
 * Get shipping rate for a specific state
 */
export function getStateShippingRate(state: string): number {
  return stateRates[state] || stateRates[state.toLowerCase()] || stateRates['default'];
}

/**
 * Get all available states with their rates
 */
export function getAllStatesWithRates(): Array<{ state: string; rate: number }> {
  const states = Object.entries(stateRates)
    .filter(([key]) => key !== 'default')
    .map(([state, rate]) => ({ state, rate }));

  return [...new Map(states.map(item => [item.state, item])).values()].sort((a, b) =>
    a.state.localeCompare(b.state)
  );
}
