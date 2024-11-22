import Alpaca from '@alpacahq/alpaca-trade-api';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

const ALPACA_API_KEY = process.env.ALPACA_API_KEY;
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY;

if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
    throw new Error('Alpaca API credentials are not properly configured in environment variables');
}

// Create Alpaca client
export const createAlpacaClient = () => {
    return new Alpaca({
        keyId: ALPACA_API_KEY,
        secretKey: ALPACA_SECRET_KEY,
        paper: true,
        usePolygon: false // Ensure we're using Alpaca's data API
    });
};
