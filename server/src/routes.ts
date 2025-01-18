import { Express, Request, Response } from 'express';
import { AlpacaClient } from './alpacaClient';
import { fetchLastTrade } from './polygonClient';
import { Order, Position, Asset, AccountInfo } from './types';
import { getAccounts, SheetAccount } from './sheetsClient';
import { lumic } from 'lumic-utility-functions';
import { ChatService } from './chatClient';

export const setupRoutes = (app: Express) => {
  let currentAccount: SheetAccount | null = null;
  let alpaca: AlpacaClient | null = null;
  let isInitialized = false;

  const validateCredentials = (account: SheetAccount) => {
    if (!account.alpacaApiKey || !account.alpacaApiSecret) {
      throw new Error('Invalid account credentials: API key and secret are required');
    }
    if (!account.type) {
      throw new Error('Account type is not specified in the sheet');
    }
    if (!['paper', 'live'].includes(account.type.toLowerCase())) {
      throw new Error('Account type must be either "paper" or "live"');
    }
  };

  const initializeAlpacaClient = async (account: SheetAccount): Promise<void> => {
    try {
      console.log(`Initializing Alpaca client for account: ${account.display_name}`);
      console.log(`Account type from sheet: ${account.type}`);

      validateCredentials(account);

      currentAccount = account;
      alpaca = new AlpacaClient({
        keyId: account.alpacaApiKey,
        secretKey: account.alpacaApiSecret,
        isPaper: account.type.toLowerCase() === 'paper',
      });

      // Verify the client works by making a test call
      const accountInfo = await alpaca.getAccount();
      if (!accountInfo) {
        throw new Error('Failed to verify account access');
      }

      console.log('Successfully verified Alpaca account access');
      isInitialized = true;
    } catch (error) {
      isInitialized = false;
      alpaca = null;
      currentAccount = null;
      console.error('Failed to initialize Alpaca client:', error);
      throw error;
    }
  };

  const ensureInitialized = async (req: Request, res: Response, next: Function) => {
    try {
      if (!isInitialized) {
        console.log('Service not initialized, attempting to initialize...');
        const accounts = await getAccounts();
        if (accounts.length === 0) {
          throw new Error('No accounts available in Google Sheet');
        }
        await initializeAlpacaClient(accounts[0]);
      }
      next();
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      console.error('Initialization error:', errorMessage);
      res.status(500).json({
        error: `Service not initialized: ${errorMessage}`,
        needsInitialization: true,
      });
    }
  };

  // Refresh config from Google Sheets
  app.post('/api/config/refresh', async (_req: Request, res: Response) => {
    try {
      console.log('Refreshing config from Google Sheet...');
      const accounts = await getAccounts();
      console.log(`Found ${accounts.length} accounts`);

      // If we have a current account, find its updated version
      if (currentAccount) {
        const updatedAccount = accounts.find((acc) => acc.name === currentAccount?.name);
        if (updatedAccount) {
          await initializeAlpacaClient(updatedAccount);
        }
      }
      // If no current account but accounts exist, initialize with first one
      else if (accounts.length > 0 && !isInitialized) {
        await initializeAlpacaClient(accounts[0]);
      }

      res.json({
        message: 'Config refreshed successfully',
        accounts,
      });
    } catch (error: any) {
      console.error('Error refreshing config:', error);
      res.status(500).json({
        error: `Failed to refresh config: ${error?.message || 'Unknown error'}`,
        needsInitialization: !isInitialized,
      });
    }
  });

  // Get available accounts from Google Sheets
  app.get('/api/accounts', async (_req: Request, res: Response) => {
    try {
      // Use the refresh endpoint internally
      const response = await fetch(`http://localhost:${process.env.PORT || 3001}/api/config/refresh`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to refresh config');
      }

      const data = await response.json();
      res.json(data.accounts);
    } catch (error: any) {
      console.error('Error fetching accounts:', error);
      res.status(500).json({
        error: `Failed to fetch accounts: ${error?.message || 'Unknown error'}`,
        needsInitialization: !isInitialized,
      });
    }
  });

  // Switch account
  app.post('/api/account/switch', async (req: Request, res: Response) => {
    try {
      const account = req.body as SheetAccount;
      console.log(`Switching to account: ${account.display_name}`);
      await initializeAlpacaClient(account);
      res.json({ message: 'Account switched successfully' });
    } catch (error: any) {
      console.error('Error switching account:', error);
      res.status(500).json({ error: `Failed to switch account: ${error?.message || 'Unknown error'}` });
    }
  });

  // Apply ensureInitialized middleware to all routes that need it
  app.use(
    [
      '/api/account',
      '/api/positions',
      '/api/orders',
      '/api/ticker-suggestions',
      '/api/latest-price',
      '/api/account/portfolio/history',
      '/api/chat',
    ],
    ensureInitialized
  );

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
  app.delete('/api/positions/close/:symbol_or_asset_id', ensureInitialized, async (req: Request, res: Response) => {
    const { symbol_or_asset_id } = req.params;
    const { qty, percentage } = req.query;

    try {
      if (!alpaca) throw new Error('Alpaca client not initialized');
      const response = await alpaca.closePosition(symbol_or_asset_id, {
        qty: qty ? Number(qty) : undefined,
        percentage: percentage ? Number(percentage) : undefined,
      });
      console.log('Close position response:', response);
      res.status(200).json(response);
    } catch (error: any) {
      console.error('Error closing position:', error);
      res.status(500).json({ error: `Failed to close position: ${error?.message || 'Unknown error'}` });
    }
  });

  // Close all positions
  app.delete('/api/positions', ensureInitialized, async (req: Request, res: Response) => {
    const cancelOrders = req.query.cancel_orders === 'true';

    try {
      if (!alpaca) throw new Error('Alpaca client not initialized');

      // First get all positions to get their symbols
      const positions = await alpaca.getPositions();
      if (positions) {
        // Cancel all orders
        await alpaca.cancelAllOrders();
      }

      // Then close all positions
      const response = await alpaca.closeAllPositions();
      res.status(200).json(response);
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
        nested: true,
      });
      res.json(orders as Order[]);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: `Failed to fetch orders: ${error?.message || 'Unknown error'}` });
    }
  });

  // Create order
  app.post('/api/orders/create', ensureInitialized, async (req: Request, res: Response) => {
    try {
      if (!alpaca) throw new Error('Alpaca client not initialized');

      // Add a client_order_id if not provided
      const orderParams = {
        ...req.body,
        client_order_id: req.body.client_order_id || `glitch-${Math.random().toString(36).substring(2, 9)}`,
      };

      console.log('Creating order with params:', orderParams);
      const order = await alpaca.createOrder(orderParams);
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

  // Patch order
  app.patch('/api/orders/:orderId', ensureInitialized, async (req: Request, res: Response) => {
    try {
      if (!alpaca) throw new Error('Alpaca client not initialized');
      const order = await alpaca.patchOrder(req.params.orderId, req.body);
      res.json(order as Order);
    } catch (error: any) {
      console.error('Error patching order:', error);
      res.status(500).json({ error: `Failed to patch order: ${error?.message || 'Unknown error'}` });
    }
  });

  // Cancel order
  app.delete('/api/orders/:orderId/cancel', ensureInitialized, async (req: Request, res: Response) => {
    try {
      if (!alpaca) throw new Error('Alpaca client not initialized');
      await alpaca.cancelOrder(req.params.orderId);
      res.json({ message: 'Order cancelled successfully' });
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      res.status(500).json({ error: `Failed to cancel order: ${error?.message || 'Unknown error'}` });
    }
  });

  // Cancel all orders
  app.delete('/api/orders', async (req: Request, res: Response) => {
    try {
      if (!alpaca) {
        throw new Error('Alpaca client not initialized');
      }
      await alpaca.cancelAllOrders();
      res.status(200).json({ message: 'All orders cancelled successfully' });
    } catch (error: any) {
      console.error('Error cancelling orders:', error);
      res.status(500).json({ error: `Failed to cancel orders: ${error?.message || 'Unknown error'}` });
    }
  });

  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      if (!alpaca) throw new Error('Alpaca client not initialized');

      // Add a client_order_id if not provided
      const orderParams = {
        ...req.body,
        client_order_id: req.body.client_order_id || `glitch-${Math.random().toString(36).substring(2, 9)}`,
      };

      console.log('Creating order with params:', orderParams);
      const order = await alpaca.createOrder(orderParams);
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

  // Get ticker suggestions
  app.get('/api/ticker-suggestions', async (req: Request, res: Response) => {
    try {
      if (!alpaca) throw new Error('Alpaca client not initialized');
      const query = req.query.query as string;
      const assets = await alpaca.getAssets({
        status: 'active',
        tradable: true,
      });

      const filteredAssets = (assets as Asset[])
        .filter(
          (asset) =>
            asset.symbol.toLowerCase().includes(query.toLowerCase()) ||
            asset.name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 10)
        .map((asset) => ({
          '1. symbol': asset.symbol,
          '2. name': asset.name,
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
      const history = await alpaca.getAccountPortfolioHistory({
        period,
        timeframe,
        intraday_reporting,
      });
      res.json(history);
    } catch (error: any) {
      console.error('Error fetching portfolio history:', error);
      res.status(500).json({ error: `Failed to fetch portfolio history: ${error?.message || 'Unknown error'}` });
    }
  });

  // Chat endpoint
  app.post('/api/chat', ensureInitialized, async (req: Request, res: Response) => {
    try {
      if (!alpaca) throw new Error('Alpaca client not initialized');
      
      const { message } = req.body;
      if (!message) {
        throw new Error('Message is required');
      }

      const chatService = new ChatService(alpaca);
      const response = await chatService.processMessage(message);
      res.json(response);
    } catch (error: any) {
      console.error('Error in chat endpoint:', error);
      res.status(500).json({ error: error?.message || 'Internal server error' });
    }
  });
};
