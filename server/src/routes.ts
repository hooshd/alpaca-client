import { Express, Request, Response } from 'express';
import { createAlpacaClient } from './alpacaClient';
import { Order, Position, Asset, AccountInfo } from './types';

export const setupRoutes = (app: Express) => {
    const alpaca = createAlpacaClient();

    // Get account information
    app.get('/api/account', async (_req: Request, res: Response) => {
        try {
            const account = await alpaca.getAccount();
            res.json(account as AccountInfo);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch account information' });
        }
    });

    // Get positions
    app.get('/api/positions', async (_req: Request, res: Response) => {
        try {
            const positions = await alpaca.getPositions();
            // Transform the position data to match client-side types
            const transformedPositions = (positions as Position[]).map(position => ({
                symbol: position.symbol,
                quantity: position.qty,
                marketValue: position.market_value,
                currentPrice: position.current_price
            }));
            res.json(transformedPositions);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch positions' });
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
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch orders' });
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
        } catch (error) {
            res.status(500).json({ error: 'Failed to create order' });
        }
    });

    // Cancel order
    app.delete('/api/orders/:orderId/cancel', async (req: Request, res: Response) => {
        try {
            await alpaca.cancelOrder(req.params.orderId);
            res.json({ message: 'Order cancelled successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to cancel order' });
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
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch ticker suggestions' });
        }
    });

    // Get latest price
    app.get('/api/latest-price', async (req: Request, res: Response) => {
        try {
            const symbol = req.query.symbol as string;
            const bars = await alpaca.getBarsV2(symbol, {
                timeframe: '1Min',
                limit: 1
            });
            
            const latestBar = await bars.next();
            if (latestBar.value) {
                res.json({ price: latestBar.value.ClosePrice });
            } else {
                throw new Error('No price data available');
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch latest price' });
        }
    });
};
