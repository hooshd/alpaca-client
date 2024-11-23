import 'dotenv/config';

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

if (!POLYGON_API_KEY) {
    throw new Error('Polygon API key not found in environment variables');
}
export const fetchLastTrade = async (ticker: string) => {
    const response = await fetch(`https://api.polygon.io/v2/last/trade/${ticker}?apiKey=${POLYGON_API_KEY}`);
    if (!response.ok) {
        throw new Error(`Error fetching last trade: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
};
