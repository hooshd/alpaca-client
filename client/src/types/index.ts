export interface Position {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  asset_marginable: boolean;
  qty: string;
  avg_entry_price: string;
  side: 'long' | 'short';
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  unrealized_intraday_pl: string;
  unrealized_intraday_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
  qty_available: string;
  limit_price?: number;
}

export interface AccountInfo {
  id: string;
  account_number: string;
  cash: string;
  buying_power: string;
  equity: string;
}

export interface SheetAccount {
  display_name: string;
  name: string;
  type: string;
  alpacaApiKey: string;
  alpacaApiSecret: string;
  email: string;
  openAiApiKey: string;
  openAiModel: string;
  adapticId: string;
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
  limit_price?: number;
}
