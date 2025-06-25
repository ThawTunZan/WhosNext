import { Currency } from '@/src/types/DataTypes';

// Shared list of supported currencies
export const SUPPORTED_CURRENCIES: Currency[] = [
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'CNY', 'JPY', 'INR',
  'BRL', 'MXN', 'RUB', 'ZAR', 'HKD', 'SGD', 'NOK', 'SEK', 'NZD'
] as Currency[];

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