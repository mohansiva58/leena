/**
 * Shipping cost calculator based on state and weight
 */

// State to rate mapping (₹ per kg)
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
  chargeableWeight: number; // Minimum 1 kg
  ratePerKg: number;
  shippingCost: number;
  breakdown: string; // For display
}

/**
 * Calculate shipping cost based on state and total weight
 * Minimum 1 kg charge for shipping
 */
export function calculateShippingCost(params: ShippingCalculationParams): ShippingCalculationResult {
  const { state, cartItems } = params;

  // Get rate per kg for the state (case-insensitive)
  const ratePerKg = stateRates[state] || stateRates[state.toLowerCase()] || stateRates['default'];

  // Calculate total weight from all items
  const totalWeight = cartItems.reduce((sum, item) => {
    return sum + ((item.weight || 0.5) * item.quantity);
  }, 0);

  // Apply minimum 1 kg charge for shipping
  // If total weight is less than 1 kg, charge for 1 kg
  // If more than 1 kg, round up to nearest kg
  const chargeableWeight = Math.max(1, Math.ceil(totalWeight * 10) / 10); // Round to 1 decimal place

  // Calculate shipping cost
  const shippingCost = Math.ceil(chargeableWeight * ratePerKg);

  // Create breakdown string for display
  const breakdown = totalWeight < 1 
    ? `Minimum 1 kg charge: ${chargeableWeight} kg × ₹${ratePerKg}/kg = ₹${shippingCost}`
    : `Total weight: ${totalWeight.toFixed(2)} kg → Chargeable: ${chargeableWeight.toFixed(1)} kg × ₹${ratePerKg}/kg = ₹${shippingCost}`;

  return {
    totalWeight,
    chargeableWeight,
    ratePerKg,
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
