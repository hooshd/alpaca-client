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
}