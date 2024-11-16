// Interfaces for Alpaca trading and API responses
export interface AlpacaPosition {
    symbol: string;
    qty: string;
    market_value: string;
    current_price: string;
}

export interface BalanceResponse {
    balance: number;
    buyingPower: number;
}

export interface PositionResponse {
    symbol: string;
    quantity: number;
    marketValue: number;
    currentPrice: number;
}

export interface AccountResponse {
    id: string;
    account_number: string;
    cash: string;
    buying_power: string;
}

export interface OrderResponse {
    id: string;
    client_order_id?: string;
    created_at: string;
    updated_at?: string | null;
    submitted_at?: string | null;
    filled_at?: string | null;
    expired_at?: string | null;
    canceled_at?: string | null;
    failed_at?: string | null;
    replaced_at?: string | null;
    replaced_by?: string | null;
    replaces?: string | null;
    asset_id: string;
    symbol: string;
    asset_class: string;
    notional?: string | null;
    qty?: string | null;
    filled_qty: string;
    filled_avg_price?: string | null;
    order_class?: string;
    order_type?: string;
    type: string;
    side: 'buy' | 'sell';
    time_in_force: string;
    limit_price?: string | null;
    stop_price?: string | null;
    status: string;
    extended_hours: boolean;
    legs?: OrderResponse[] | null;
}