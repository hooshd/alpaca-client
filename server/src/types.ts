import { types } from 'adaptic-backend/server/index';
export type AlpacaAccount = types.AlpacaAccount;

export interface Asset {
  id: string;
  class: string;
  exchange: string;
  symbol: string;
  name: string;
  status: string;
  tradable: boolean;
  marginable: boolean;
  shortable: boolean;
  easy_to_borrow: boolean;
  fractionable: boolean;
}

export interface AccountInfo {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  cash: string;
  portfolio_value: string;
  pattern_day_trader: boolean;
  trading_blocked: boolean;
  transfers_blocked: boolean;
  account_blocked: boolean;
  created_at: string;
  shorting_enabled: boolean;
  long_market_value: string;
  short_market_value: string;
  equity: string;
  last_equity: string;
  multiplier: string;
  buying_power: string;
  initial_margin: string;
  maintenance_margin: string;
  sma: string;
  daytrade_count: number;
  last_maintenance_margin: string;
  daytrading_buying_power: string;
  regt_buying_power: string;
}

export interface PolygonPriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  vol: number;
  vwap?: number;
}

export interface PolygonQuote {
  ticker: string;
  tks: string;
  p: number;
  s: number;
  c: number[];
  t: number;
  q: number;
}

export interface SimplifiedPriceData {
  date: string;
  close: number;
  vol: number;
}
