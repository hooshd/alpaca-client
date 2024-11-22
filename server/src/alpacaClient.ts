const Alpaca = require('@alpacahq/alpaca-trade-api');

export const createAlpacaClient = () => {
    if (!process.env.APCA_API_KEY_ID || !process.env.APCA_API_SECRET_KEY) {
        throw new Error('Alpaca API credentials not found in environment variables');
    }

    return new Alpaca({
        keyId: process.env.APCA_API_KEY_ID,
        secretKey: process.env.APCA_API_SECRET_KEY,
        paper: true
    });
};
