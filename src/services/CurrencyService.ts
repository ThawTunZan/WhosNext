
// Configuration
const API_URL = process.env.EXPO_PUBLIC_CUSTOM_API_URL;
const API_KEY = process.env.EXPO_PUBLIC_CUSTOM_API_KEY;

// Types for API responses
interface ConversionResponse {
    convertedAmount: number;
    lastUpdated: string;
    from: string;
    to: string;
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
 * If the API is not available, returns the original amount with a warning.
 * 
 * @param amount The amount to convert
 * @param fromCurrency The currency to convert from
 * @param toCurrency The currency to convert to
 * @returns The converted amount
 */
export async function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
): Promise<number> {
    
    // If same currency, return original amount
    if (fromCurrency === toCurrency) {
        //console.log(`Same currency: ${amount} ${fromCurrency} = ${amount} ${toCurrency}`);
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
            //console.warn(' API is not available, using 1:1 conversion rate');
            return amount; // Fallback to 1:1 rate
        }

        // Call the local API
        const response = await fetch(
            `${API_URL}/convert?from=${fromCurrency}&to=${toCurrency}&amount=${amount}`,
            {
                headers: {
                    'X-API-Key': API_KEY,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            console.warn('Conversion failed with status:', response.status);
            const text = await response.text();
            console.warn('Response:', text);
            return amount; // Fallback to 1:1 rate
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
        console.warn('Error converting currency, using 1:1 conversion rate:', error);
        return amount; // Fallback to 1:1 rate
    }
}

/**
 * Gets the exchange rate between two currencies.
 * 
 * @param fromCurrency The currency to convert from
 * @param toCurrency The currency to convert to
 * @returns The exchange rate
 * @throws Error if the rate cannot be retrieved
 */
export async function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
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
        //console.log('Checking API health at:', API_URL); // Add this for debugging
        const response = await fetch(`${API_URL}/health`, {
            headers: {
                'X-API-Key': API_KEY // Add API key to health check
            }
        });
        
        if (!response.ok) {
            console.error('Health check failed with status:', response.status);
            const text = await response.text();
            console.error('Response:', text);
            return false;
        }

        const data = await response.json();
        return data.status === 'ok' && data.ratesAvailable;
    } catch (error) {
        // TODO: Uncomment this
        //console.error('Error checking API health:', error);
        // Add more detailed error logging
        if (error instanceof Error) {
            //console.error('Error name:', error.name);
            //console.error('Error message:', error.message);
        }
        return false;
    }
}