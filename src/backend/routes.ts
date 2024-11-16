import { Express, Request, Response, NextFunction } from 'express';
import { createAlpacaClient } from './alpacaClient';
import { AlpacaPosition, BalanceResponse, PositionResponse, AccountResponse, OrderResponse } from './types';

export const setupRoutes = (app: Express) => {
  const alpaca = createAlpacaClient();

  app.get('/api/balance', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log('Handling /api/balance request');
      const account = await alpaca.getAccount();
      const response: BalanceResponse = {
        balance: parseFloat(account.equity),
        buyingPower: parseFloat(account.buying_power),
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
        buying_power: account.buying_power,
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
      const formattedPositions: PositionResponse[] = positions.map((position) => ({
        symbol: position.symbol,
        quantity: parseFloat(position.qty),
        marketValue: parseFloat(position.market_value),
        currentPrice: parseFloat(position.current_price),
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

  app.get('/api/orders', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log('Handling /api/orders request');

      // Extract query parameters with defaults
      const status = (req.query.status as string) || 'all';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const after = req.query.after as string | undefined;
      const until = req.query.until as string | undefined;
      const direction = (req.query.direction as string) || 'desc';
      const symbols = req.query.symbols as string | undefined;
      const side = req.query.side as string | undefined;

      // Prepare query options for Alpaca
      const queryOptions: any = {
        status,
        limit: Math.min(limit, 500),
        direction,
      };

      // Add optional parameters if provided
      if (after) queryOptions.after = after;
      if (until) queryOptions.until = until;
      if (symbols) queryOptions.symbols = symbols;
      if (side) queryOptions.side = side;

      // Fetch orders from Alpaca
      const orders: OrderResponse[] = await alpaca.getOrders(queryOptions);

      console.log(`Fetched ${orders.length} orders`);
      res.json(orders);
    } catch (error) {
      console.error('Error in /api/orders:', error);
      next(error);
    }
  });

  app.delete('/api/orders/:orderId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log('Handling /api/orders/:orderId DELETE request');
      const orderId = req.params.orderId;

      if (!orderId) {
        res.status(400).json({ success: false, message: 'Order ID is required' });
        return;
      }

      // Attempt to cancel the order
      await alpaca.cancelOrder(orderId);

      console.log('Order canceled successfully:', orderId);
      res.status(204).send(); // No content, successful cancellation
    } catch (error) {
      console.error('Error in /api/orders/:orderId:', error);

      // Check if the error is due to order not being cancelable
      if (error instanceof Error && error.message.includes('422')) {
        res.status(422).json({
          success: false,
          message: 'Order is no longer cancelable',
        });
        return;
      }

      next(error);
    }
  });
};
