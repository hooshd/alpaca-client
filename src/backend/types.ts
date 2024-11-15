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
