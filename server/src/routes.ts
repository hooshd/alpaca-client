import { Express, Request, Response } from 'express';
import { createAlpacaClient } from './alpacaClient';
import { fetchLastTrade } from './polygonClient'; // Importing the new function
import { Order, Position, Asset, AccountInfo } from './types';

export const setupRoutes = (app: Express) => {
    const alpaca = createAlpacaClient();

    // Get account information
    app.get('/api/account', async (_req: Request, res: Response) => {
        try {
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
            const positions = await alpaca.getPositions();
            const transformedPositions = (positions as Position[]).map(position => ({
                symbol: position.symbol,
                quantity: position.qty,
                marketValue: position.market_value,
                currentPrice: position.current_price
            }));
            res.json(transformedPositions);
        } catch (error: any) {
            console.error('Error fetching positions:', error);
            res.status(500).json({ error: `Failed to fetch positions: ${error?.message || 'Unknown error'}` });
        }
    });

    // Get orders
    app.get('/api/orders', async (_req: Request, res: Response) => {
        try {
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
        try {
            const order = await alpaca.createOrder({
                symbol: req.body.symbol,
                qty: req.body.quantityType === 'qty' ? req.body.quantity : undefined,
                notional: req.body.quantityType === 'notional' ? req.body.quantity : undefined,
                side: req.body.side,
                type: req.body.orderType,
                time_in_force: 'day',
                limit_price: req.body.orderType === 'limit' ? req.body.limitPrice : undefined,
                extended_hours: req.body.extendedHours
            });
            res.json(order as Order);
        } catch (error: any) {
            console.error('Error creating order:', error);
            res.status(500).json({ error: `Failed to create order: ${error?.message || 'Unknown error'}` });
        }
    });

    // Cancel order
    app.delete('/api/orders/:orderId/cancel', async (req: Request, res: Response) => {
        try {
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
            console.log('Fetching portfolio history with params:', { period, timeframe, intraday_reporting });
            const history = await alpaca.getAccountPortfolioHistory({
                period,
                timeframe,
                intraday_reporting
            });
            //console.log('Portfolio history response:', history);
            res.json(history);
        } catch (error: any) {
            console.error('Error fetching portfolio history:', error);
            res.status(500).json({ error: `Failed to fetch portfolio history: ${error?.message || 'Unknown error'}` });
        }
    });
};
