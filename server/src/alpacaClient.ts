import { AccountInfo, Position, Order, Asset } from './types';

interface AlpacaClientConfig {
    keyId: string;
    secretKey: string;
    dataKeyId?: string;
    dataSecretKey?: string;
}

interface Bar {
    ClosePrice: number;
    OpenPrice: number;
    HighPrice: number;
    LowPrice: number;
    Volume: number;
    Timestamp: Date;
}

interface BarIterator {
    next(): Promise<{ value?: Bar; done?: boolean }>;
    [Symbol.asyncIterator](): BarIterator;
}

class AlpacaClient {
    private accountBaseUrl: string;
    private dataBaseUrl: string;
    private headers: HeadersInit;
    private dataHeaders: HeadersInit;

    constructor(config: AlpacaClientConfig) {
        const isPaperAccount = process.env.ALPACA_ACCOUNT_TYPE === 'paper';
        this.accountBaseUrl = isPaperAccount 
            ? 'https://paper-api.alpaca.markets'
            : 'https://api.alpaca.markets';
        this.dataBaseUrl = 'https://data.alpaca.markets';
        
        this.headers = {
            'APCA-API-KEY-ID': config.keyId,
            'APCA-API-SECRET-KEY': config.secretKey,
            'Content-Type': 'application/json'
        };

        // Use data API credentials if provided, otherwise fall back to trading API credentials
        this.dataHeaders = {
            'APCA-API-KEY-ID': config.dataKeyId || config.keyId,
            'APCA-API-SECRET-KEY': config.dataSecretKey || config.secretKey,
            'Content-Type': 'application/json'
        };
    }

    private async fetch<T>(endpoint: string, options: RequestInit = {}, isDataEndpoint: boolean = false): Promise<T> {
        const baseUrl = isDataEndpoint ? this.dataBaseUrl : this.accountBaseUrl;
        const headers = isDataEndpoint ? this.dataHeaders : this.headers;
        
        const response = await fetch(`${baseUrl}${endpoint}`, {
            ...options,
            headers: { ...headers, ...options.headers }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Alpaca API error: ${response.statusText}. Details: ${errorText}`);
        }

        return response.json();
    }

    async getAccount(): Promise<AccountInfo> {
        return this.fetch<AccountInfo>('/v2/account');
    }

    async getPositions(): Promise<Position[]> {
        return this.fetch<Position[]>('/v2/positions');
    }

    async getOrders(params: { status: string; limit: number; nested: boolean }): Promise<Order[]> {
        const queryParams = new URLSearchParams({
            status: params.status,
            limit: params.limit.toString(),
            nested: params.nested.toString()
        });
        return this.fetch<Order[]>(`/v2/orders?${queryParams}`);
    }

    async createOrder(params: {
        symbol: string;
        qty?: number;
        notional?: number;
        side: string;
        type: string;
        time_in_force: string;
        limit_price?: number;
        extended_hours?: boolean;
    }): Promise<Order> {
        return this.fetch<Order>('/v2/orders', {
            method: 'POST',
            body: JSON.stringify(params)
        });
    }

    async cancelOrder(orderId: string): Promise<void> {
        await this.fetch(`/v2/orders/${orderId}`, { method: 'DELETE' });
    }

    async getAssets(params: { status: string; tradable: boolean }): Promise<Asset[]> {
        const queryParams = new URLSearchParams({
            status: params.status,
            tradable: params.tradable.toString()
        });
        return this.fetch<Asset[]>(`/v2/assets?${queryParams}`);
    }

    async getBarsV2(params: {
        symbols: string;
        timeframe: string;
        start?: string;
        end?: string;
        limit?: number;
        adjustment?: string;
        asof?: string;
        feed?: string;
        currency?: string;
        page_token?: string;
        sort?: string;
    }): Promise<BarIterator> {
        const queryParams = new URLSearchParams({
            symbols: params.symbols,
            timeframe: params.timeframe,
            limit: (params.limit || 1000).toString(),
            adjustment: params.adjustment || 'raw',
            asof: params.asof || new Date().toISOString().split('T')[0],
            feed: params.feed || 'sip',
            currency: params.currency || 'USD',
            page_token: params.page_token || '',
            sort: params.sort || 'asc',
        });

        const response = await this.fetch<{
            bars: Array<{
                t: string;
                o: number;
                h: number;
                l: number;
                c: number;
                v: number;
            }>;
            next_page_token?: string;
        }>(`/v2/stocks/bars?${queryParams}`, {}, true);

        let index = 0;
        const bars = response.bars || [];

        const iterator: BarIterator = {
            async next() {
                if (index >= bars.length) {
                    return { done: true };
                }

                const bar = bars[index++];
                return {
                    value: {
                        ClosePrice: bar.c,
                        OpenPrice: bar.o,
                        HighPrice: bar.h,
                        LowPrice: bar.l,
                        Volume: bar.v,
                        Timestamp: new Date(bar.t)
                    },
                    done: false
                };
            },
            [Symbol.asyncIterator]() {
                return this;
            }
        };

        return iterator;
    }

    async getAccountPortfolioHistory(params: {
        period: string;
        timeframe: string;
        intraday_reporting: string;
    }) {
        // Validate and adjust timeframe based on period
        const periodTimeframes: { [key: string]: string[] } = {
            '1D': ['1Min', '5Min', '15Min', '30Min', '1H', 'day'],
            '1W': ['1H', 'day'],
            '1M': ['1D', 'week'],
            '3M': ['1D', 'week'],
            '6M': ['1D', 'week'],
            '1A': ['1D', 'week', 'month'],
            'all': ['1D', 'week', 'month']
        };

        const validTimeframes = periodTimeframes[params.period];
        if (!validTimeframes) {
            throw new Error(`Invalid period: ${params.period}`);
        }

        // Default to daily timeframe for periods longer than 1D if an invalid timeframe is provided
        if (!validTimeframes.includes(params.timeframe)) {
            params.timeframe = '1D';
        }

        const queryParams = new URLSearchParams({
            period: params.period,
            timeframe: params.timeframe,
            intraday_reporting: params.intraday_reporting
        });
        
        return this.fetch(`/v2/account/portfolio/history?${queryParams}`);
    }

    async getLatestPrice(symbols: string, feed: string = 'sip', currency: string = 'USD') {
        const queryParams = new URLSearchParams({
            symbols,
            feed,
            currency
        });
        return this.fetch(`/v2/stocks/bars/latest?${queryParams}`, {}, true);
    }
}

export const createAlpacaClient = () => {
    if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_SECRET_KEY) {
        throw new Error('Alpaca API credentials not found in environment variables');
    }

    return new AlpacaClient({
        keyId: process.env.ALPACA_API_KEY,
        secretKey: process.env.ALPACA_SECRET_KEY,
        dataKeyId: process.env.ALPACA_DATA_API_KEY,
        dataSecretKey: process.env.ALPACA_DATA_SECRET_KEY
    });
};