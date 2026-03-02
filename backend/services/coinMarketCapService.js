const axios = require('axios');

const CMC_API_KEY = '3034a12fefeb4b3098628c282b9973eb';
const CMC_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';

// Cache to avoid hitting API rate limits
let priceCache = {
  paxgPrice: null,
  lastUpdated: null,
  cacheTimeout: 60000 // 1 minute cache
};

/**
 * Get current PAXG price in USDT from CoinMarketCap
 * @returns {Promise<number>} PAXG price in USDT
 */
async function getPAXGPrice() {
  try {
    // Check cache first
    const now = Date.now();
    if (priceCache.paxgPrice && priceCache.lastUpdated && (now - priceCache.lastUpdated < priceCache.cacheTimeout)) {
      console.log('Using cached PAXG price:', priceCache.paxgPrice);
      return priceCache.paxgPrice;
    }

    // Fetch fresh price from CoinMarketCap
    const response = await axios.get(CMC_API_URL, {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json'
      },
      params: {
        symbol: 'PAXG', // PAX Gold symbol
        convert: 'USDT'
      }
    });

    const paxgData = response.data.data.PAXG;
    const paxgPrice = paxgData.quote.USDT.price;

    // Update cache
    priceCache.paxgPrice = paxgPrice;
    priceCache.lastUpdated = now;

    console.log('Fresh PAXG price from CoinMarketCap:', paxgPrice, 'USDT');
    return paxgPrice;

  } catch (error) {
    console.error('Error fetching PAXG price from CoinMarketCap:', error.message);
    
    // Fallback to approximate gold price if API fails (1 troy ounce of gold ≈ $2000)
    const fallbackPrice = 2000;
    console.log('Using fallback PAXG price:', fallbackPrice, 'USDT');
    return fallbackPrice;
  }
}

/**
 * Convert USDT amount to PAXG
 * @param {number} usdtAmount - Amount in USDT
 * @returns {Promise<number>} Equivalent amount in PAXG
 */
async function convertUSDTtoPAXG(usdtAmount) {
  const paxgPrice = await getPAXGPrice();
  const paxgAmount = usdtAmount / paxgPrice;
  return paxgAmount;
}

/**
 * Get current PAXG price with timestamp (for frontend)
 * @returns {Promise<Object>} { paxgPrice, timestamp }
 */
async function getPAXGPriceWithTimestamp() {
  const paxgPrice = await getPAXGPrice();
  return {
    paxgPrice: Number(paxgPrice.toFixed(2)),
    timestamp: Date.now()
  };
}

module.exports = {
  getPAXGPrice,
  convertUSDTtoPAXG,
  getPAXGPriceWithTimestamp
};
