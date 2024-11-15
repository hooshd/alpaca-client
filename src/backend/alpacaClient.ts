import Alpaca from '@alpacahq/alpaca-trade-api';

// Create Alpaca client
export const createAlpacaClient = () => {
    return new Alpaca({
        keyId: process.env.ALPACA_API_KEY || '',
        secretKey: process.env.ALPACA_SECRET_KEY || '',
        paper: true
    });
};
