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

// Define all available tools
export const alpacaTools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'get_account_info',
      description: 'Get current account information including cash balance, portfolio value, and trading status',
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
      description: 'Get all current positions in the account',
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
      name: 'get_orders',
      description: 'Get orders based on their status',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Order status to filter by (open, closed, all)',
            enum: ['open', 'closed', 'all'],
          },
          limit: {
            type: 'number',
            description: 'Maximum number of orders to return',
          },
        },
        required: ['status', 'limit'],
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
  {
    type: 'function',
    function: {
      name: 'get_asset_info',
      description: 'Get information about tradable assets',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Asset status to filter by',
            enum: ['active', 'inactive'],
          },
        },
        required: ['status'],
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
  | Asset[] 
  | PolygonPriceData 
  | PolygonPriceData[] 
  | PolygonQuote 
  | SimplifiedPriceData 
  | SimplifiedPriceData[] 
  | { timestamp: number };

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
        case 'get_orders': {
          const orders = await alpacaClient.getOrders({
            status: params.status,
            limit: params.limit,
            nested: true,
          });
          if (orders) results.push(orders);
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
        case 'get_asset_info': {
          const assets = await alpacaClient.getAssets({
            status: params.status,
            tradable: true,
          });
          if (assets) results.push(assets);
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
