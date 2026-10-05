export const FREE_SHIPPING_THRESHOLD = 50;
export const SHIPPING_COST = 3;

export function getShippingCost(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
}

export function getRemainingForFreeShipping(
  subtotal: number
): number {
  return Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);
}

export function calculateShipping(subtotal: number): number {
  return getShippingCost(subtotal);
}

export function calculateOrderTotal(subtotal: number): number {
  return subtotal + getShippingCost(subtotal);
}