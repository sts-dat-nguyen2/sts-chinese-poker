// Utility functions for Vietnamese Dong currency formatting

export const formatCurrency = (amount: number | string): string => {
  const numAmount = Number(amount) || 0;
  return `${numAmount.toLocaleString()} ₫`;
};

export const formatCurrencyWithDecimals = (amount: number | string): string => {
  const numAmount = Number(amount) || 0;
  // Vietnamese Dong doesn't typically use decimals, but keeping for compatibility
  return `${numAmount.toLocaleString()} ₫`;
};