import { Express, Request, Response, NextFunction } from 'express';
import { createAlpacaClient } from './alpacaClient';
import { 
    AlpacaPosition, 
    BalanceResponse, 
    PositionResponse,
    AccountResponse
} from './types';

export const setupRoutes = (app: Express) => {
    const alpaca = createAlpacaClient();

    app.get('/api/balance', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            console.log('Handling /api/balance request');
            const account = await alpaca.getAccount();
            const response: BalanceResponse = {
                balance: parseFloat(account.equity),
                buyingPower: parseFloat(account.buying_power)
            };
            console.log('Sending balance response:', response);
            res.json(response);
        } catch (error) {
            console.error('Error in /api/balance:', error);
            next(error);
        }
    });

    app.get('/api/account', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            console.log('Handling /api/account request');
            const account = await alpaca.getAccount();
            const response: AccountResponse = {
                id: account.id,
                account_number: account.account_number,
                cash: account.cash,
                buying_power: account.buying_power
            };
            res.json(response);
        } catch (error) {
            console.error('Error in /api/account:', error);
            next(error);
        }
    });

    app.get('/api/positions', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            console.log('Handling /api/positions request');
            const positions: AlpacaPosition[] = await alpaca.getPositions();
            const formattedPositions: PositionResponse[] = positions.map(position => ({
                symbol: position.symbol,
                quantity: parseFloat(position.qty),
                marketValue: parseFloat(position.market_value),
                currentPrice: parseFloat(position.current_price)
            }));
            res.json(formattedPositions);
        } catch (error) {
            console.error('Error in /api/positions:', error);
            next(error);
        }
    });

    app.post('/api/positions/close', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            console.log('Handling /api/positions/close request');
            const { symbol } = req.body;
            
            if (!symbol) {
                console.log('Symbol is required');
                res.status(400).json({ success: false, message: 'Symbol is required' });
                return;
            }

            // Close the entire position for the given symbol
            await alpaca.closePosition(symbol);
            
            console.log('Position closed successfully for symbol:', symbol);
            res.json({ success: true, message: `Position for ${symbol} closed successfully` });
        } catch (error) {
            console.error('Error in /api/positions/close:', error);
            next(error);
        }
    });
};
