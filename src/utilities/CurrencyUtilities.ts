
// Supported currencies are defined in DataTypes.ts. Do not edit here.
export { SUPPORTED_CURRENCIES } from '@/src/types/DataTypes';

/**
 * Formats a number as currency with the specified currency code
 * @param amount The amount to format
 * @param currency The currency code to use for formatting
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}; 