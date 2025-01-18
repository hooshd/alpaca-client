import { Tool, ToolCall } from 'lumic-utility-functions';
import { adaptic as adptc } from 'adaptic-utils';
import { AlpacaClient } from './alpacaClient';
import { Order, Position, Asset, AccountInfo, PolygonPriceData, PolygonQuote, SimplifiedPriceData } from './types';

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
            description:
              'End timestamp in ISO 8601 format, i.e. "YYYY-MM-DDTHH:MM:SSZ". Default is now.',
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
      description:
        'Get simplified price data for a stock, including dates, closing prices, and daily volumes.',
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
            description:
              'End timestamp in ISO 8601 format, i.e. "YYYY-MM-DDTHH:MM:SSZ". Default is now.',
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
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_positions',
      description: 'Get all open positions in the account',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
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
          percentage: { type: 'number', description: 'Optional percentage of position to close' }
        },
        required: ['symbol_or_asset_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'close_all_positions',
      description: 'Close all open positions',
      parameters: {
        type: 'object',
        properties: {
          cancel_orders: { type: 'boolean', description: 'Whether to cancel open orders' }
        },
        required: []
      }
    }
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
          nested: { type: 'boolean', description: 'Whether to include nested multi-leg orders' }
        },
        required: ['status', 'limit', 'nested']
      }
    }
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
          trail_percent: { type: 'string', description: 'Trailing stop percentage' }
        },
        required: ['symbol', 'side', 'type', 'time_in_force']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'cancel_order',
      description: 'Cancel a specific order',
      parameters: {
        type: 'object',
        properties: {
          order_id: { type: 'string', description: 'ID of the order to cancel' }
        },
        required: ['order_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'cancel_all_orders',
      description: 'Cancel all open orders',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
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
          trail: { type: 'string', description: 'New trailing stop amount' }
        },
        required: ['order_id']
      }
    }
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
          tradable: { type: 'boolean', description: 'Whether the asset is tradable' }
        },
        required: ['status', 'tradable']
      }
    }
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
  {
    type: 'function',
    function: {
      name: 'get_bars',
      description: 'Get historical price bars for a symbol',
      parameters: {
        type: 'object',
        properties: {
          symbols: {
            type: 'string',
            description: 'Stock symbol(s) to get data for',
          },
          timeframe: {
            type: 'string',
            description: 'Time interval for the bars',
            enum: ['1Min', '5Min', '15Min', '30Min', '1H', '1D', 'week', 'month'],
          },
          start: {
            type: 'string',
            description: 'Start time in ISO 8601 format',
          },
          end: {
            type: 'string',
            description: 'End time in ISO 8601 format',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of bars to return',
          },
        },
        required: ['symbols', 'timeframe'],
      },
    },
  },
];

// Combine Alpaca and Polygon tools
export const allTools: Tool[] = [...alpacaTools, ...polygonTools];

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
            percentage: params.percentage
          });
          if (result) results.push(result);
          break;
        }
        case 'close_all_positions': {
          const result = await alpacaClient.closeAllPositions({
            cancel_orders: params.cancel_orders
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
            trail_percent: params.trail_percent
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
            trail: params.trail
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
        case 'get_bars': {
          const bars = await alpacaClient.getBarsV2({
            symbols: params.symbols,
            timeframe: params.timeframe,
            start: params.start,
            end: params.end,
            limit: params.limit,
          });
          const allBars = [];
          for await (const bar of bars) {
            allBars.push(bar);
          }
          results.push(allBars as any[]);
          break;
        }
        // Polygon tools
        case 'convert_iso8601_to_unix_ms': {
          const unixMs = convertISO8601TimeToUnixMilliseconds(params.timestamp);
          results.push({ timestamp: unixMs });
          break;
        }
        case 'fetch_ticker_info': {
          const tickerInfo = await adptc.polygon.fetchTickerInfo(params.symbol);
          results.push(tickerInfo as any);
          break;
        }
        case 'fetch_last_trade': {
          const lastTrade = await adptc.polygon.fetchLastTrade(params.symbol);
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
          const priceData = await adptc.polygon.fetchPrices(params);
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
          const priceData = await adptc.polygon.fetchPrices(params);
          const simplifiedData: SimplifiedPriceData[] = (priceData as unknown as PolygonPriceData[]).map(p => ({
            date: p.date,
            close: p.close,
            vol: p.vol
          }));
          results.push(simplifiedData);
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
