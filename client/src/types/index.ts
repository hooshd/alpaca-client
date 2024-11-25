export interface Position {
  symbol: string;
  quantity: number;
  marketValue: number;
  currentPrice: number;
}

export interface AccountInfo {
  id: string;
  account_number: string;
  cash: string;
  buying_power: string;
  equity: string; // Added equity property
}

export interface Order {
  id: string;
  symbol: string;
  asset_class: string;
  qty?: string;
  notional?: string;
  status: string;
  filled_qty?: string;
  filled_avg_price?: string;
  type: string;
  side: 'buy' | 'sell';
  time_in_force: string;
  extended_hours: boolean;
  created_at: string;
}