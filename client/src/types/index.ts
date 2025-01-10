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
  limit_price?: string;
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
  client_order_id?: string;
  created_at: string;
  updated_at?: string;
  submitted_at?: string;
  filled_at?: string;
  expired_at?: string;
  canceled_at?: string;
  failed_at?: string;
  replaced_at?: string;
  replaced_by?: string;
  replaces?: string;
  asset_id: string;
  symbol: string;
  asset_class: string;
  notional?: string;
  qty?: string;
  filled_qty?: string;
  filled_avg_price?: string;
  order_class?: string;
  type: string;
  side: 'buy' | 'sell';
  time_in_force: string;
  limit_price?: string;
  stop_price?: string;
  trail_price?: string;
  trail_percent?: string;
  hwm?: string;
  status: string;
  extended_hours: boolean;
  legs?: Order[];
}
