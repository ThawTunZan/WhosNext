// Client-side Currency Service
// Direct integration with free currency APIs

// Cache exchange rates to avoid too many API calls
const rateCache: { [key: string]: { rate: number; timestamp: number } } = {};
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 1 day in milliseconds

// Free currency API (no API key required)
const FREE_API_URL = "https://open.er-api.com/v6/latest";

/**
 * Converts an amount from one currency to another using free API.
 * Caches rates for 24 hours to minimize API calls.
 *
 * @param {number} amount The amount to convert
 * @param {string} fromCurrency The currency to convert from
 * @param {string} toCurrency The currency to convert to
 * @return {Promise<number>} The converted amount
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  // If same currency, return original amount
  if (fromCurrency === toCurrency) {
    return amount;
  }

  try {
    // Check cache first
    const cacheKey = `${fromCurrency}-${toCurrency}`;
    const cachedRate = rateCache[cacheKey];

    if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION) {
      console.log("Using cached rate for", cacheKey);
      return amount * cachedRate.rate;
    }

    // Get latest rates from free API
    const response = await fetch(`${FREE_API_URL}/${fromCurrency}`);

    if (!response.ok) {
      console.warn("Currency API failed, using 1:1 conversion");
      return amount; // Fallback to 1:1 rate
    }

    const data = await response.json();

    if (!data.rates || !data.rates[toCurrency]) {
      console.warn(`Rate not found for ${fromCurrency} to ${toCurrency}`);
      return amount; // Fallback to 1:1 rate
    }

    const rate = data.rates[toCurrency];
    const convertedAmount = amount * rate;

    // Cache the rate
    rateCache[cacheKey] = {
      rate,
      timestamp: Date.now(),
    };

    console.log(
      `Converted ${amount} ${fromCurrency} to ` +
      `${convertedAmount} ${toCurrency} (rate: ${rate})`
    );
    return convertedAmount;
  } catch (error) {
    console.warn("Error converting currency, using 1:1 conversion:", error);
    return amount; // Fallback to 1:1 rate
  }
}

/**
 * Gets the exchange rate between two currencies.
 *
 * @param {string} from The currency to convert from
 * @param {string} to The currency to convert to
 * @return {Promise<number>} The exchange rate
 * @throws Error if the rate cannot be retrieved
 */
export async function getExchangeRate(from: string, to: string): Promise<number> {
  try {
    // Convert 1 unit to get the rate
    const rate = await convertCurrency(1, from, to);
    return rate;
  } catch (error) {
    console.error("Error getting exchange rate:", error);
    throw error;
  }
}

/**
 * Gets all available currencies and their rates for a base currency.
 *
 * @param {string} baseCurrency The base currency (e.g., "USD")
 * @return {Promise<object>} Object with currency codes as keys and rates as values
 */
export async function getAllRates(baseCurrency: string): Promise<{ [key: string]: number }> {
  try {
    const response = await fetch(`${FREE_API_URL}/${baseCurrency}`);

    if (!response.ok) {
      throw new Error("Failed to fetch rates");
    }

    const data = await response.json();
    return data.rates || {};
  } catch (error) {
    console.error("Error getting all rates:", error);
    throw error;
  }
} 