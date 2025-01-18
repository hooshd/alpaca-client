export interface Position {
    symbol: string;
    qty: number;
    market_value: number;
    current_price: number;
    lastday_price: number;
    change_today: number;
    unrealized_pl: number;
    unrealized_plpc: number;
    unrealized_intraday_pl: number;
    unrealized_intraday_plpc: number;
    asset_id: string;
    asset_class: string;
    avg_entry_price: number;
    side: string;
}

export interface Order {
    id: string;
    client_order_id: string;
    created_at: string;
    updated_at: string;
    submitted_at: string;
    filled_at: string | null;
    expired_at: string | null;
    canceled_at: string | null;
    failed_at: string | null;
    replaced_at: string | null;
    replaced_by: string | null;
    replaces: string | null;
    asset_id: string;
    symbol: string;
    asset_class: string;
    notional: string | null;
    qty: string | null;
    filled_qty: string;
    filled_avg_price: string | null;
    order_class: string;
    order_type: string;
    type: string;
    side: 'buy' | 'sell';
    time_in_force: string;
    limit_price: string | null;
    stop_price: string | null;
    status: string;
    extended_hours: boolean;
    legs: Order[] | null;
    trail_percent: string | null;
    trail_price: string | null;
    hwm: string | null;
}

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

export interface ProcessedAssetOverviewResponse {
    asset: {
      id: string;
      symbol: string;
      [key: string]: any;
    } | null;
    error: string | null;
    success: boolean;
  }