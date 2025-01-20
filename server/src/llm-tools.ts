import { Tool, ToolCall } from 'lumic-utility-functions';
import { adaptic as adptc, Order, Position } from 'adaptic-utils';
import { AlpacaClient } from './alpacaClient';
import { Asset, AccountInfo, PolygonPriceData, PolygonQuote, SimplifiedPriceData } from './types';
import adaptic, { types } from 'adaptic-backend';
import { sharedApolloClient } from './apollo-client';
import { getCurrentAccount } from './accountState';
import { fetchRecentTrades } from './adaptic-functions';
import 'dotenv/config';

// Initialize alpaca client instance
let alpacaClient: AlpacaClient | null = null;

export function initializeAlpacaTools(client: AlpacaClient) {
  alpacaClient = client;
}

// Define polygon tools
export const polygonTools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'convert_iso8601_to_unix_ms',
      description: 'Convert an ISO 8601 timestamp to Unix milliseconds',
      parameters: {
        type: 'object',
        properties: {
          timestamp: {
            type: 'string',
            description: 'ISO 8601 timestamp to convert',
          },
        },
        required: ['timestamp'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fetch_ticker_info',
      description: 'Get basic information about a stock ticker symbol',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock ticker symbol',
          },
        },
        required: ['symbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fetch_last_trade',
      description: 'Get the most recent trade information for a stock, including price, volume, and timestamp',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock ticker symbol',
          },
        },
        required: ['symbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fetch_full_price_data',
      description:
        'Get historical price data including open, high, low, close, volume, and vwap for a stock up to the present day.',
      parameters: {
        type: 'object',
        properties: {
          ticker: {
            type: 'string',
            description: 'The stock ticker symbol, e.g. AAPL',
          },
          start: {
            type: 'string',
            description: 'Start timestamp in ISO 8601 format, i.e. "YYYY-MM-DDTHH:MM:SSZ".',
          },
          end: {
            type: 'string',
            description: 'End timestamp in ISO 8601 format, i.e. "YYYY-MM-DDTHH:MM:SSZ". Default is now.',
          },
          multiplier: {
            type: 'number',
            description: 'Time interval multiplier, i.e. number of minutes, days, etc',
          },
          timespan: {
            type: 'string',
            description: 'Time interval unit (minute, hour, day, etc)',
            enum: ['minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'],
          },
          limit: {
            type: 'number',
            description: 'Maximum number of data points to return',
          },
        },
        required: ['ticker', 'start', 'multiplier', 'timespan'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fetch_closes_and_volumes',
      description: 'Get simplified price data for a stock, including dates, closing prices, and daily volumes.',
      parameters: {
        type: 'object',
        properties: {
          ticker: {
            type: 'string',
            description: 'The stock ticker symbol, e.g. AAPL',
          },
          start: {
            type: 'string',
            description: 'Start timestamp in ISO 8601 format, i.e. "YYYY-MM-DDTHH:MM:SSZ".',
          },
          end: {
            type: 'string',
            description: 'End timestamp in ISO 8601 format, i.e. "YYYY-MM-DDTHH:MM:SSZ". Default is now.',
          },
          multiplier: {
            type: 'number',
            description: 'Time interval multiplier, i.e. number of minutes, days, etc',
          },
          timespan: {
            type: 'string',
            description: 'Time interval unit (minute, hour, day, etc)',
            enum: ['minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'],
          },
          limit: {
            type: 'number',
            description: 'Maximum number of data points to return',
          },
        },
        required: ['ticker', 'start', 'multiplier', 'timespan'],
      },
    },
  },
];

// Define all available Alpaca tools
export const alpacaTools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'get_account_info',
      description: 'Get current account information including cash balances, buying power, and equity',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_positions',
      description: 'Get all open positions in the account',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'close_position',
      description: 'Close a specific position by symbol or asset ID',
      parameters: {
        type: 'object',
        properties: {
          symbol_or_asset_id: { type: 'string', description: 'Symbol or asset ID of the position to close' },
          qty: { type: 'number', description: 'Optional quantity to close' },
          percentage: { type: 'number', description: 'Optional percentage of position to close' },
        },
        required: ['symbol_or_asset_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'close_all_positions',
      description: 'Close all open positions',
      parameters: {
        type: 'object',
        properties: {
          cancel_orders: { type: 'boolean', description: 'Whether to cancel open orders' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_orders',
      description: 'Get a list of orders on Alpaca',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Order status to filter by (open, closed, all)' },
          limit: { type: 'number', description: 'Maximum number of orders to return' },
          nested: { type: 'boolean', description: 'Whether to include nested multi-leg orders' },
        },
        required: ['status', 'limit', 'nested'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_order',
      description: 'Create a new order on Alpaca',
      parameters: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: 'Symbol to trade' },
          qty: { type: 'number', description: 'Quantity of shares' },
          notional: { type: 'number', description: 'Dollar amount to trade' },
          side: { type: 'string', description: 'buy or sell' },
          type: { type: 'string', description: 'market, limit, stop, stop_limit, trailing_stop' },
          time_in_force: { type: 'string', description: 'day, gtc, ioc, fok' },
          limit_price: { type: 'number', description: 'Limit price for limit orders' },
          extended_hours: { type: 'boolean', description: 'Whether to allow trading in extended hours' },
          trail_percent: { type: 'string', description: 'Trailing stop percentage' },
        },
        required: ['symbol', 'side', 'type', 'time_in_force'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_order',
      description: 'Cancel a specific order',
      parameters: {
        type: 'object',
        properties: {
          order_id: { type: 'string', description: 'ID of the order to cancel' },
        },
        required: ['order_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_all_orders',
      description: 'Cancel all open orders',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'patch_order',
      description: 'Modify an existing order',
      parameters: {
        type: 'object',
        properties: {
          order_id: { type: 'string', description: 'ID of the order to modify' },
          trail: { type: 'string', description: 'New trailing stop amount' },
        },
        required: ['order_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_asset_info',
      description: 'Get information about tradable assets',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Asset status (active, inactive)' },
          tradable: { type: 'boolean', description: 'Whether the asset is tradable' },
        },
        required: ['status', 'tradable'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_portfolio_history',
      description: 'Get account portfolio history for a specific time period',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            description: 'Time period to get history for',
            enum: ['1D', '1W', '1M', '3M', '6M', '1A', 'all'],
          },
          timeframe: {
            type: 'string',
            description: 'Timeframe for the data points',
            enum: ['1Min', '5Min', '15Min', '30Min', '1H', '1D', 'week', 'month'],
          },
        },
        required: ['period', 'timeframe'],
      },
    },
  },
];

export const adapticTools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'get_adaptic_account_info',
      description:
        'Get information about the currently active Adaptic account, including email, Adaptic account id, and Alpaca account id',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_adaptic_trade',
      description: 'Create a trade object in the Adaptic backend',
      parameters: {
        type: 'object',
        properties: {
          alpacaAccountId: { type: 'string', description: 'ID of the Alpaca account for the trade' },
          assetId: { type: 'string', description: 'ID of the asset being traded', optional: true },
          qty: { type: 'number', description: 'Quantity of the trade' },
          price: { type: 'number', description: 'Price of the trade' },
          total: { type: 'number', description: 'Total value of the trade (qty * price)' },
          optionType: {
            type: 'string',
            enum: ['CALL', 'PUT'],
            description: 'Type of option if this is an options trade',
            optional: true,
          },
          signal: {
            type: 'string',
            enum: [
              'PRICE_ACTION',
              'MOVING_AVERAGE_CROSSOVER',
              'MACD_CROSSOVER',
              'BREAKOUT_ABOVE_RESISTANCE',
              'BREAKDOWN_BELOW_SUPPORT',
              'NO_SIGNAL',
            ],
            description: 'Signal that triggered the trade',
          },
          strategy: {
            type: 'string',
            enum: [
              'TECHNICAL_ANALYSIS',
              'TREND_FOLLOWING',
              'MEAN_REVERSION',
              'MOMENTUM_STRATEGY',
              'NEWS_BASED_STRATEGY',
              'SENTIMENT_ANALYSIS',
              'BREAKOUT_STRATEGY',
              'NO_STRATEGY',
            ],
            description: 'Trading strategy used',
          },
          analysis: { type: 'string', description: 'Detailed analysis explaining the trade' },
          summary: { type: 'string', description: 'Brief summary of the trade' },
          confidence: { type: 'number', description: 'Confidence level in the trade (0-100)' },
          timestamp: { type: 'string', description: 'ISO timestamp when the trade was executed' },
          status: {
            type: 'string',
            enum: ['PENDING', 'EXECUTED', 'CANCELED', 'FAILED'],
            description: 'Current status of the trade',
          },
        },
        required: [
          'alpacaAccountId',
          'qty',
          'price',
          'total',
          'signal',
          'strategy',
          'analysis',
          'summary',
          'confidence',
          'timestamp',
          'status',
        ],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fetch_recent_trades',
      description: 'Fetch recent trades from a specified start time',
      parameters: {
        type: 'object',
        properties: {
          start_time: {
            type: 'string',
            description: 'ISO 8601 timestamp for the start time in UTC',
          },
          alpaca_account_id: {
            type: 'string',
            description: 'Optional Alpaca account ID to filter trades',
          },
          limit: {
            type: 'number',
            description: 'Optional maximum number of trades to return',
          },
          sort_field: {
            type: 'string',
            description: 'Optional field to sort by (e.g., createdAt, price, qty)',
          },
          sort_order: {
            type: 'string',
            enum: ['asc', 'desc'],
            description: 'Optional sort direction',
          },
        },
        required: ['start_time'],
      },
    },
  },
];

export const alphaVantageTools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'fetch_ticker_news',
      description: 'Get the most recent news articles for a stock ticker',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock ticker symbol',
          },
          start: {
            type: 'string',
            description: 'Optional ISO 8601 timestamp for start date. Defaults to 7 days ago.',
          },
          limit: {
            type: 'number',
            description: 'Optional maximum number of news articles to return. Defaults to 10.',
          },
        },
        required: ['symbol'],
      },
    },
  },
];

export const taTools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'calculate_ema',
      description: 'Calculate Exponential Moving Average (EMA) for price data',
      parameters: {
        type: 'object',
        properties: {
          priceData: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string' },
                close: { type: 'number' },
              },
            },
            description: 'Array of price data objects with date and close price',
          },
          period: {
            type: 'number',
            description: 'Period for EMA calculation (default: 20)',
          },
          period2: {
            type: 'number',
            description: 'Optional second period for dual EMA calculation (default: 9)',
          },
        },
        required: ['priceData'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_macd',
      description: 'Calculate Moving Average Convergence Divergence (MACD)',
      parameters: {
        type: 'object',
        properties: {
          priceData: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string' },
                close: { type: 'number' },
              },
            },
            description: 'Array of price data objects',
          },
          shortPeriod: {
            type: 'number',
            description: 'Short-term period (default: 12)',
          },
          longPeriod: {
            type: 'number',
            description: 'Long-term period (default: 26)',
          },
          signalPeriod: {
            type: 'number',
            description: 'Signal line period (default: 9)',
          },
        },
        required: ['priceData'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_rsi',
      description: 'Calculate Relative Strength Index (RSI)',
      parameters: {
        type: 'object',
        properties: {
          priceData: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string' },
                close: { type: 'number' },
              },
            },
            description: 'Array of price data objects',
          },
          period: {
            type: 'number',
            description: 'Period for RSI calculation (default: 14)',
          },
        },
        required: ['priceData'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_stochastic',
      description: 'Calculate Stochastic Oscillator',
      parameters: {
        type: 'object',
        properties: {
          priceData: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string' },
                high: { type: 'number' },
                low: { type: 'number' },
                close: { type: 'number' },
              },
            },
            description: 'Array of price data objects',
          },
          lookbackPeriod: {
            type: 'number',
            description: 'Lookback period (default: 5)',
          },
          signalPeriod: {
            type: 'number',
            description: 'Signal period (default: 3)',
          },
          smoothingFactor: {
            type: 'number',
            description: 'Smoothing factor (default: 3)',
          },
        },
        required: ['priceData'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_bollinger_bands',
      description: 'Calculate Bollinger Bands',
      parameters: {
        type: 'object',
        properties: {
          priceData: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string' },
                close: { type: 'number' },
              },
            },
            description: 'Array of price data objects',
          },
          period: {
            type: 'number',
            description: 'Period for calculation (default: 20)',
          },
          standardDeviations: {
            type: 'number',
            description: 'Number of standard deviations (default: 2)',
          },
        },
        required: ['priceData'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_support_resistance',
      description: 'Calculate Support and Resistance levels',
      parameters: {
        type: 'object',
        properties: {
          priceData: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string' },
                high: { type: 'number' },
                low: { type: 'number' },
                close: { type: 'number' },
                vol: { type: 'number' },
              },
            },
            description: 'Array of price data objects',
          },
          maxLevels: {
            type: 'number',
            description: 'Maximum number of levels to return (default: 5)',
          },
          lookbackPeriod: {
            type: 'number',
            description: 'Period to analyze for support/resistance (default: 10)',
          },
        },
        required: ['priceData'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_fibonacci_levels',
      description: 'Calculate Fibonacci Retracement and Extension levels',
      parameters: {
        type: 'object',
        properties: {
          priceData: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string' },
                high: { type: 'number' },
                low: { type: 'number' },
                close: { type: 'number' },
              },
            },
            description: 'Array of price data objects',
          },
          lookbackPeriod: {
            type: 'number',
            description: 'Period to analyze (default: 20)',
          },
          retracementLevels: {
            type: 'array',
            items: { type: 'number' },
            description: 'Retracement levels (default: [0.236, 0.382, 0.5, 0.618, 0.786])',
          },
          extensionLevels: {
            type: 'array',
            items: { type: 'number' },
            description: 'Extension levels (default: [1.272, 1.618, 2.618])',
          },
          reverseDirection: {
            type: 'boolean',
            description: 'True for downtrend, false for uptrend (default: false)',
          },
        },
        required: ['priceData'],
      },
    },
  },
];

// Combine Alpaca, Polygon, and Alpha Vantage tools
export const allTools: Tool[] = [...alpacaTools, ...polygonTools, ...alphaVantageTools, ...adapticTools];

// Helper function to convert ISO 8601 to Unix milliseconds
function convertISO8601TimeToUnixMilliseconds(t: string): number {
  const date = new Date(t);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ISO 8601 timestamp: ${t}`);
  }
  return date.getTime();
}

// Type for tool call results
type ToolCallResult =
  | AccountInfo
  | Position[]
  | Order[]
  | Order
  | Asset[]
  | PolygonPriceData
  | PolygonPriceData[]
  | PolygonQuote
  | SimplifiedPriceData
  | SimplifiedPriceData[]
  | { timestamp: number }
  | { success: boolean; message: string }
  | any; // For generic API responses

// Function to execute tool calls
export async function executeToolCall(toolCalls: ToolCall[]): Promise<ToolCallResult[]> {
  if (!alpacaClient) {
    throw new Error('Alpaca client not initialized');
  }

  const results: ToolCallResult[] = [];

  for (const toolCall of toolCalls) {
    const params = JSON.parse(toolCall.function.arguments);

    try {
      switch (toolCall.function.name) {
        // Alpaca tools
        case 'get_account_info': {
          const account = await alpacaClient.getAccount();
          if (account) results.push(account);
          break;
        }
        case 'get_positions': {
          const positions = await alpacaClient.getPositions();
          if (positions) results.push(positions);
          break;
        }
        case 'close_position': {
          const result = await alpacaClient.closePosition(params.symbol_or_asset_id, {
            qty: params.qty,
            percentage: params.percentage,
          });
          if (result) results.push(result);
          break;
        }
        case 'close_all_positions': {
          const result = await alpacaClient.closeAllPositions({
            cancel_orders: params.cancel_orders,
          });
          if (result) results.push(result);
          break;
        }
        case 'get_orders': {
          const orders = await alpacaClient.getOrders({
            status: params.status,
            limit: params.limit,
            nested: params.nested,
          });
          if (orders) results.push(orders);
          break;
        }
        case 'create_order': {
          const order = await alpacaClient.createOrder({
            symbol: params.symbol,
            qty: params.qty,
            notional: params.notional,
            side: params.side,
            type: params.type,
            time_in_force: params.time_in_force,
            limit_price: params.limit_price,
            extended_hours: params.extended_hours,
            trail_percent: params.trail_percent,
          });
          if (order) results.push(order);
          break;
        }
        case 'cancel_order': {
          await alpacaClient.cancelOrder(params.order_id);
          results.push({ success: true, message: 'Order cancelled' });
          break;
        }
        case 'cancel_all_orders': {
          await alpacaClient.cancelAllOrders();
          results.push({ success: true, message: 'All orders cancelled' });
          break;
        }
        case 'patch_order': {
          const order = await alpacaClient.patchOrder(params.order_id, {
            trail: params.trail,
          });
          if (order) results.push(order);
          break;
        }
        case 'get_asset_info': {
          const assets = await alpacaClient.getAssets({
            status: params.status,
            tradable: params.tradable,
          });
          if (assets) results.push(assets);
          break;
        }
        case 'get_portfolio_history': {
          const history = await alpacaClient.getAccountPortfolioHistory({
            period: params.period,
            timeframe: params.timeframe,
            intraday_reporting: 'market_hours',
          });
          if (history) results.push(history as any);
          break;
        }
        // Polygon tools
        case 'convert_iso8601_to_unix_ms': {
          const unixMs = convertISO8601TimeToUnixMilliseconds(params.timestamp);
          results.push({ timestamp: unixMs });
          break;
        }
        case 'fetch_ticker_info': {
          const tickerInfo = await adptc.polygon.fetchTickerInfo(params.symbol, {
            apiKey: process.env.POLYGON_API_KEY,
          });
          results.push(tickerInfo as any);
          break;
        }
        case 'fetch_last_trade': {
          const lastTrade = await adptc.polygon.fetchLastTrade(params.symbol, { apiKey: process.env.POLYGON_API_KEY });
          results.push(lastTrade as unknown as PolygonQuote);
          break;
        }
        case 'fetch_full_price_data': {
          if (typeof params.start === 'string') {
            params.start = convertISO8601TimeToUnixMilliseconds(params.start);
          }
          if (typeof params.end === 'string') {
            params.end = convertISO8601TimeToUnixMilliseconds(params.end);
          }
          const priceData = await adptc.polygon.fetchPrices(params, { apiKey: process.env.POLYGON_API_KEY });
          results.push(priceData as unknown as PolygonPriceData[]);
          break;
        }
        case 'fetch_closes_and_volumes': {
          if (typeof params.start === 'string') {
            params.start = convertISO8601TimeToUnixMilliseconds(params.start);
          }
          if (typeof params.end === 'string') {
            params.end = convertISO8601TimeToUnixMilliseconds(params.end);
          }
          const priceData = await adptc.polygon.fetchPrices(params, { apiKey: process.env.POLYGON_API_KEY });
          const simplifiedData: SimplifiedPriceData[] = (priceData as unknown as PolygonPriceData[]).map((p) => ({
            date: p.date,
            close: p.close,
            vol: p.vol,
          }));
          results.push(simplifiedData);
          break;
        }
        case 'create_adaptic_trade': {
          const trade = await adaptic.trade.create(
            {
              alpacaAccountId: params.alpacaAccountId,
              assetId: params.assetId,
              qty: params.qty,
              price: params.price,
              total: params.total,
              optionType: params.optionType,
              signal: params.signal,
              strategy: params.strategy,
              analysis: params.analysis,
              summary: params.summary,
              confidence: params.confidence,
              timestamp: params.timestamp,
              status: params.status,
            } as types.Trade,
            sharedApolloClient
          );

          if (trade) {
            results.push({
              success: true,
              message: `Trade created successfully with ID: ${trade.id}`,
              timestamp: Date.now(),
            });
          }
          break;
        }
        case 'get_adaptic_account_info': {
          const currentAccount = getCurrentAccount();
          if (!currentAccount) {
            results.push({
              success: false,
              message: 'No active account found',
              timestamp: Date.now(),
            });
          } else {
            results.push({
              success: true,
              message: 'Successfully retrieved Adaptic account info',
              timestamp: Date.now(),
              data: currentAccount,
            });
          }
          break;
        }
        case 'fetch_recent_trades': {
          const currentAccount = getCurrentAccount();
          if (!currentAccount) {
            results.push({
              success: false,
              message: 'No active Adaptic account found',
              timestamp: Date.now(),
            });
            break;
          }

          const trades = await fetchRecentTrades(new Date(params.start_time), {
            alpacaAccountId: params.alpaca_account_id || currentAccount.id,
            limit: params.limit,
            sort: params.sort_field
              ? {
                  field: params.sort_field,
                  order: params.sort_order || 'desc',
                }
              : undefined,
          });

          results.push({
            success: true,
            message: trades ? `Successfully fetched ${trades.length} trades` : 'No trades found',
            timestamp: Date.now(),
            data: trades,
          });
          break;
        }
        case 'fetch_ticker_news': {
          let startDate = params.start ? new Date(params.start) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const news = await adptc.av.fetchTickerNews(params.symbol, startDate, params.limit, {
            apiKey: process.env.ALPHA_VANTAGE_API_KEY,
          });
          results.push(news);
          break;
        }
        // Technical Analysis Tools
        case 'calculate_ema': {
          const emaData = adptc.ta.calculateEMA(params.priceData, {
            period: params.period,
            period2: params.period2,
          });
          results.push(emaData);
          break;
        }
        case 'calculate_macd': {
          const macdData = adptc.ta.calculateMACD(params.priceData, {
            shortPeriod: params.shortPeriod,
            longPeriod: params.longPeriod,
            signalPeriod: params.signalPeriod,
          });
          results.push(macdData);
          break;
        }
        case 'calculate_rsi': {
          const rsiData = adptc.ta.calculateRSI(params.priceData, {
            period: params.period,
          });
          results.push(rsiData);
          break;
        }
        case 'calculate_stochastic': {
          const stochData = adptc.ta.calculateStochasticOscillator(params.priceData, {
            lookbackPeriod: params.lookbackPeriod,
            signalPeriod: params.signalPeriod,
            smoothingFactor: params.smoothingFactor,
          });
          results.push(stochData);
          break;
        }
        case 'calculate_bollinger_bands': {
          const bbData = adptc.ta.calculateBollingerBands(params.priceData, {
            period: params.period,
            standardDeviations: params.standardDeviations,
          });
          results.push(bbData);
          break;
        }
        case 'calculate_support_resistance': {
          const srData = adptc.ta.calculateSupportAndResistance(params.priceData, {
            maxLevels: params.maxLevels,
            lookbackPeriod: params.lookbackPeriod,
          });
          results.push(srData);
          break;
        }
        case 'calculate_fibonacci_levels': {
          const fibData = adptc.ta.calculateFibonacciLevels(params.priceData, {
            lookbackPeriod: params.lookbackPeriod,
            retracementLevels: params.retracementLevels,
            extensionLevels: params.extensionLevels,
            reverseDirection: params.reverseDirection,
          });
          results.push(fibData);
          break;
        }
        default:
          throw new Error(`Unknown tool call: ${toolCall.function.name}`);
      }
    } catch (error) {
      console.error(`Error executing tool call ${toolCall.id} (${toolCall.function.name}):`, error);
      throw error;
    }
  }

  return results;
}
