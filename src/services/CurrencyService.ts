import { Currency } from '../types/DataTypes';

// Configuration
const API_URL = process.env.CUSTOM_API_URL || 'http://localhost:3001';
const API_KEY = process.env.CUSTOM_API_KEY || '1234567890';

// Types for API responses
interface ConversionResponse {
    convertedAmount: number;
    lastUpdated: string;
    from: Currency;
    to: Currency;
    amount: number;
}

interface ErrorResponse {
    error: string;
    message?: string;
}

// Cache exchange rates to avoid too many API calls
const rateCache: { [key: string]: { rate: number; timestamp: number } } = {};
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 1 day in milliseconds

/**
 * Converts an amount from one currency to another using local API.
 * 
 * @param amount The amount to convert
 * @param fromCurrency The currency to convert from
 * @param toCurrency The currency to convert to
 * @returns The converted amount
 * @throws Error if the conversion fails
 */
export async function convertCurrency(
    amount: number,
    fromCurrency: Currency,
    toCurrency: Currency
): Promise<number> {
    /*
    // If same currency, return original amount
    if (fromCurrency === toCurrency) {
        console.log(`Same currency: ${amount} ${fromCurrency} = ${amount} ${toCurrency}`);
        return amount;
    }

    try {
        // Check cache first
        const cacheKey = `${fromCurrency}-${toCurrency}`;
        const cachedRate = rateCache[cacheKey];
        
        if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION) {
            console.log('Using cached rate');
            return amount * cachedRate.rate;
        }

        const isAvailable = await checkApiHealth();
        if (!isAvailable) {
          console.error('Currency API is not available');
          return;
        }

        // Call the local API
        const response = await fetch(
            `${API_URL}/convert?from=${fromCurrency}&to=${toCurrency}&amount=${amount}`,
            {
                headers: {
                    'X-API-Key': API_KEY 
                }  
            }
        );

        if (!response.ok) {
            const errorData: ErrorResponse = await response.json();
            throw new Error(errorData.message || errorData.error || 'Conversion failed');
        }

        const data: ConversionResponse = await response.json();
        
        // Cache the rate
        const rate = data.convertedAmount / amount;
        rateCache[cacheKey] = {
            rate,
            timestamp: Date.now()
        };

        return data.convertedAmount;
    } catch (error) {
        console.error('Error converting currency:', error);
        throw error;
    }
        */
       return amount;
}

/**
 * Gets the exchange rate between two currencies.
 * 
 * @param fromCurrency The currency to convert from
 * @param toCurrency The currency to convert to
 * @returns The exchange rate
 * @throws Error if the rate cannot be retrieved
 */
export async function getExchangeRate(fromCurrency: Currency, toCurrency: Currency): Promise<number> {
    try {
        // Convert 1 unit to get the rate
        const rate = await convertCurrency(1, fromCurrency, toCurrency);
        return rate;
    } catch (error) {
        console.error('Error getting exchange rate:', error);
        throw error;
    }
}

/**
 * Checks if the currency API is available.
 * 
 * @returns True if the API is available, false otherwise
 */
export async function checkApiHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        return data.status === 'ok' && data.ratesAvailable;
    } catch (error) {
        console.error('Error checking API health:', error);
        return false;
    }
} 