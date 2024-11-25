import { Express, Request, Response } from 'express';
import { AlpacaClient } from './alpacaClient';
import { fetchLastTrade } from './polygonClient';
import { Order, Position, Asset, AccountInfo } from './types';
import { getAccounts, SheetAccount } from './sheetsClient';

export const setupRoutes = (app: Express) => {
    let currentAccount: SheetAccount | null = null;
    let alpaca: AlpacaClient | null = null;

    const initializeAlpacaClient = (account: SheetAccount) => {
        currentAccount = account;
        alpaca = new AlpacaClient({
            keyId: account.alpacaApiKey,
            secretKey: account.alpacaApiSecret
        });
    };

    // Get available accounts from Google Sheets
    app.get('/api/accounts', async (_req: Request, res: Response) => {
        try {
            const accounts = await getAccounts();
            if (accounts.length > 0 && !currentAccount) {
                initializeAlpacaClient(accounts[0]);
            }
            res.json(accounts);
        } catch (error: any) {
            console.error('Error fetching accounts:', error);
            res.status(500).json({ error: `Failed to fetch accounts: ${error?.message || 'Unknown error'}` });
        }
    });

    // Switch account
    app.post('/api/account/switch', async (req: Request, res: Response) => {
        try {
            const account = req.body as SheetAccount;
            initializeAlpacaClient(account);
            res.json({ message: 'Account switched successfully' });
        } catch (error: any) {
            console.error('Error switching account:', error);
            res.status(500).json({ error: `Failed to switch account: ${error?.message || 'Unknown error'}` });
        }
    });

    // Get account information
    app.get('/api/account', async (_req: Request, res: Response) => {
        try {
            if (!alpaca) throw new Error('Alpaca client not initialized');
            const account = await alpaca.getAccount();
            res.json(account as AccountInfo);
        } catch (error: any) {
            console.error('Error fetching account:', error);
            res.status(500).json({ error: `Failed to fetch account information: ${error?.message || 'Unknown error'}` });
        }
    });

    // Get positions
    app.get('/api/positions', async (_req: Request, res: Response) => {
        try {
            if (!alpaca) throw new Error('Alpaca client not initialized');
            const positions = await alpaca.getPositions();
            res.json(positions as Position[]);
        } catch (error: any) {
            console.error('Error fetching positions:', error);
            res.status(500).json({ error: `Failed to fetch positions: ${error?.message || 'Unknown error'}` });
        }
    });

    // Close a specific position
    app.delete('/api/positions/close/:symbol_or_asset_id', async (req: Request, res: Response) => {
        const { symbol_or_asset_id } = req.params;
        const { qty, percentage } = req.query;

        try {
            if (!alpaca) throw new Error('Alpaca client not initialized');
            const response = await alpaca.closePosition(symbol_or_asset_id, { qty: qty ? Number(qty) : undefined, percentage: percentage ? Number(percentage) : undefined });
            console.log('Close position response:', response);
            res.status(200).json(response);
        } catch (error: any) {
            console.error('Error closing position:', error);
            res.status(500).json({ error: `Failed to close position: ${error?.message || 'Unknown error'}` });
        }
    });

    // Close all positions
    app.delete('/api/positions', async (req: Request, res: Response) => {
        const cancelOrders = req.query.cancel_orders === 'true';

        try {
            if (!alpaca) throw new Error('Alpaca client not initialized');
            const response = await alpaca.closeAllPositions({ cancel_orders: cancelOrders });
            console.log('Close positions response:', response);
            res.status(207).json(response);
        } catch (error: any) {
            console.error('Error closing positions:', error);
            res.status(500).json({ error: `Failed to close positions: ${error?.message || 'Unknown error'}` });
        }
    });

    // Get orders
    app.get('/api/orders', async (_req: Request, res: Response) => {
        try {
            if (!alpaca) throw new Error('Alpaca client not initialized');
            const orders = await alpaca.getOrders({
                status: 'all',
                limit: 100,
                nested: true
            });
            res.json(orders as Order[]);
        } catch (error: any) {
            console.error('Error fetching orders:', error);
            res.status(500).json({ error: `Failed to fetch orders: ${error?.message || 'Unknown error'}` });
        }
    });

    // Create order
    app.post('/api/orders/create', async (req: Request, res: Response) => {
        const { symbol, side, quantityType, quantity, orderType, limitPrice, extendedHours } = req.body;

        try {
            if (!alpaca) throw new Error('Alpaca client not initialized');
            const order = await alpaca.createOrder({
                symbol,
                qty: quantityType === 'qty' ? quantity : undefined,
                notional: quantityType === 'notional' ? quantity : undefined,
                side,
                type: orderType,
                time_in_force: 'day',
                limit_price: orderType === 'limit' ? limitPrice : undefined,
                extended_hours: extendedHours
            });
            res.json(order as Order);
        } catch (error: any) {
            console.error('Error creating order:', error);
            if (error.response) {
                res.status(error.response.status).json({ error: error.response.data });
            } else {
                res.status(500).json({ error: `Failed to create order: ${error?.message || 'Unknown error'}` });
            }
        }
    });

    // Cancel order
    app.delete('/api/orders/:orderId/cancel', async (req: Request, res: Response) => {
        try {
            if (!alpaca) throw new Error('Alpaca client not initialized');
            await alpaca.cancelOrder(req.params.orderId);
            res.json({ message: 'Order cancelled successfully' });
        } catch (error: any) {
            console.error('Error cancelling order:', error);
            res.status(500).json({ error: `Failed to cancel order: ${error?.message || 'Unknown error'}` });
        }
    });

    // Get ticker suggestions
    app.get('/api/ticker-suggestions', async (req: Request, res: Response) => {
        try {
            if (!alpaca) throw new Error('Alpaca client not initialized');
            const query = req.query.query as string;
            const assets = await alpaca.getAssets({
                status: 'active',
                tradable: true
            });
            
            const filteredAssets = (assets as Asset[])
                .filter(asset => 
                    asset.symbol.toLowerCase().includes(query.toLowerCase()) ||
                    asset.name.toLowerCase().includes(query.toLowerCase())
                )
                .slice(0, 10)
                .map(asset => ({
                    '1. symbol': asset.symbol,
                    '2. name': asset.name
                }));
            
            res.json(filteredAssets);
        } catch (error: any) {
            console.error('Error fetching ticker suggestions:', error);
            res.status(500).json({ error: `Failed to fetch ticker suggestions: ${error?.message || 'Unknown error'}` });
        }
    });

    // Get latest price
    app.get('/api/latest-price', async (req: Request, res: Response) => {
        try {
            if (!alpaca) throw new Error('Alpaca client not initialized');
            const symbol = req.query.symbol as string;
            const latestPrice = await fetchLastTrade(symbol);
            res.json(latestPrice);
        } catch (error: any) {
            console.error('Error fetching latest price:', error);
            res.status(500).json({ error: `Failed to fetch latest price: ${error?.message || 'Unknown error'}` });
        }
    });

    // Get account portfolio history
    app.get('/api/account/portfolio/history', async (req: Request, res: Response) => {
        const period = (req.query.period || '1M') as string;
        const timeframe = (req.query.timeframe || '1D') as string;
        const intraday_reporting = (req.query.intraday_reporting || 'market_hours') as string;
        
        try {
            if (!alpaca) throw new Error('Alpaca client not initialized');
            console.log('Fetching portfolio history with params:', { period, timeframe, intraday_reporting });
            const history = await alpaca.getAccountPortfolioHistory({
                period,
                timeframe,
                intraday_reporting
            });
            res.json(history);
        } catch (error: any) {
            console.error('Error fetching portfolio history:', error);
            res.status(500).json({ error: `Failed to fetch portfolio history: ${error?.message || 'Unknown error'}` });
        }
    });
};
