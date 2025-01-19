// Enums
// =====================
export enum MarketSentimentLevel {
  VERY_BEARISH = 'VERY_BEARISH',
  SOMEWHAT_BEARISH = 'SOMEWHAT_BEARISH',
  BEARISH = 'BEARISH',
  NEUTRAL = 'NEUTRAL',
  SOMEWHAT_BULLISH = 'SOMEWHAT_BULLISH',
  BULLISH = 'BULLISH',
  VERY_BULLISH = 'VERY_BULLISH',
}

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum ScheduledOptionOrderStatus {
  PENDING = 'PENDING',
  EXECUTED = 'EXECUTED',
  CANCELED = 'CANCELED',
}

export enum TradeStrategy {
  TECHNICAL_ANALYSIS = 'TECHNICAL_ANALYSIS',
  TREND_FOLLOWING = 'TREND_FOLLOWING',
  MEAN_REVERSION = 'MEAN_REVERSION',
  OPTIONS_STRATEGY = 'OPTIONS_STRATEGY',
  MOMENTUM_STRATEGY = 'MOMENTUM_STRATEGY',
  MARKET_MAKING = 'MARKET_MAKING',
  NEWS_BASED_STRATEGY = 'NEWS_BASED_STRATEGY',
  SENTIMENT_ANALYSIS = 'SENTIMENT_ANALYSIS',
  SCALPING = 'SCALPING',
  VOLATILITY_TRADING = 'VOLATILITY_TRADING',
  EVENT_DRIVEN = 'EVENT_DRIVEN',
  BREAKOUT_STRATEGY = 'BREAKOUT_STRATEGY',
  ORDER_FLOW_TRADING = 'ORDER_FLOW_TRADING',
  NO_STRATEGY = 'NO_STRATEGY',
}

export enum TradeSignal {
  GOLDEN_CROSS = 'GOLDEN_CROSS',
  MOVING_AVERAGE_CROSSOVER = 'MOVING_AVERAGE_CROSSOVER',
  RSI_OVERBOUGHT = 'RSI_OVERBOUGHT',
  RSI_OVERSOLD = 'RSI_OVERSOLD',
  MACD_CROSSOVER = 'MACD_CROSSOVER',
  BOLLINGER_BANDS_BREAKOUT = 'BOLLINGER_BANDS_BREAKOUT',
  TREND_REVERSAL = 'TREND_REVERSAL',
  VOLATILITY_SPIKE = 'VOLATILITY_SPIKE',
  PRICE_ACTION = 'PRICE_ACTION',
  IMPLIED_VOLATILITY_SURGE = 'IMPLIED_VOLATILITY_SURGE',
  BREAKOUT_ABOVE_RESISTANCE = 'BREAKOUT_ABOVE_RESISTANCE',
  BREAKDOWN_BELOW_SUPPORT = 'BREAKDOWN_BELOW_SUPPORT',
  SUPPORT_LEVEL_HOLD = 'SUPPORT_LEVEL_HOLD',
  RESISTANCE_LEVEL_HOLD = 'RESISTANCE_LEVEL_HOLD',
  FIBONACCI_RETRACEMENT = 'FIBONACCI_RETRACEMENT',
  ELLIOTT_WAVE = 'ELLIOTT_WAVE',
  PARABOLIC_SAR = 'PARABOLIC_SAR',
  ADX_TREND_STRENGTH = 'ADX_TREND_STRENGTH',
  CCI_OVERBOUGHT = 'CCI_OVERBOUGHT',
  CCI_OVERSOLD = 'CCI_OVERSOLD',
  STOCHASTIC_OVERSOLD = 'STOCHASTIC_OVERSOLD',
  STOCHASTIC_OVERBOUGHT = 'STOCHASTIC_OVERBOUGHT',
  DIVERGENCE_SIGNAL = 'DIVERGENCE_SIGNAL',
  GANN_FAN = 'GANN_FAN',
  DONCHIAN_CHANNEL_BREAKOUT = 'DONCHIAN_CHANNEL_BREAKOUT',
  PIVOT_POINT = 'PIVOT_POINT',
  KELTNER_CHANNEL_BREAK = 'KELTNER_CHANNEL_BREAK',
  HEIKIN_ASHI_CROSSOVER = 'HEIKIN_ASHI_CROSSOVER',
  VOLUME_SURGE = 'VOLUME_SURGE',
  ORDER_BOOK_IMBALANCE = 'ORDER_BOOK_IMBALANCE',
  TIME_SERIES_ANOMALY = 'TIME_SERIES_ANOMALY',
  MEAN_REVERSION_LEVEL = 'MEAN_REVERSION_LEVEL',
  PAIR_TRADING_SIGNAL = 'PAIR_TRADING_SIGNAL',
  SENTIMENT_SCORE_THRESHOLD = 'SENTIMENT_SCORE_THRESHOLD',
  NEWS_SENTIMENT_CHANGE = 'NEWS_SENTIMENT_CHANGE',
  ORDER_FLOW_IMPACT = 'ORDER_FLOW_IMPACT',
  LIQUIDITY_DRIVEN_MOVE = 'LIQUIDITY_DRIVEN_MOVE',
  MACHINE_LEARNING_PREDICTION = 'MACHINE_LEARNING_PREDICTION',
  SENTIMENT_ANALYSIS_TRIGGER = 'SENTIMENT_ANALYSIS_TRIGGER',
  NO_SIGNAL = 'NO_SIGNAL',
}

export enum AssetType {
  STOCK = 'STOCK',
  ETF = 'ETF',
  MUTUAL_FUND = 'MUTUAL_FUND',
  CRYPTOCURRENCY = 'CRYPTOCURRENCY',
  INDEX = 'INDEX',
  COMMODITY = 'COMMODITY',
  CURRENCY = 'CURRENCY',
  OPTION = 'OPTION',
  FUTURE = 'FUTURE',
  BOND = 'BOND',
  WARRANT = 'WARRANT',
  ADR = 'ADR',
  GDR = 'GDR',
  UNIT = 'UNIT',
  RIGHT = 'RIGHT',
  REIT = 'REIT',
  STRUCTURED_PRODUCT = 'STRUCTURED_PRODUCT',
  SWAP = 'SWAP',
  SPOT = 'SPOT',
  FORWARD = 'FORWARD',
  OTHER = 'OTHER',
}

export enum AlpacaAccountType {
  PAPER = 'PAPER',
  LIVE = 'LIVE',
}

export enum ActionType {
  BUY = 'BUY',
  BUY_OPTION = 'BUY_OPTION',
  EXERCISE_OPTION = 'EXERCISE_OPTION',
  SELL = 'SELL',
  CANCEL = 'CANCEL',
  ADJUST = 'ADJUST',
  HEDGE = 'HEDGE',
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum ActionStatus {
  STAGED = 'STAGED',
  EXECUTED = 'EXECUTED',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

export enum TradeStatus {
  PENDING = 'PENDING',
  OPEN = 'OPEN',
  PARTIAL = 'PARTIAL',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP = 'STOP',
  STOP_LIMIT = 'STOP_LIMIT',
  TRAILING_STOP = 'TRAILING_STOP',
}

export enum OrderClass {
  SIMPLE = 'SIMPLE',
  BRACKET = 'BRACKET',
  OCO = 'OCO',
  OSO = 'OSO',
  OTO = 'OTO',
}

export enum OptionType {
  CALL = 'CALL',
  PUT = 'PUT',
}

export enum OptionStyle {
  AMERICAN = 'AMERICAN',
  EUROPEAN = 'EUROPEAN',
}

export enum DeliverableType {
  CASH = 'CASH',
  EQUITY = 'EQUITY',
}

export enum OrderStatus {
  STAGED = 'STAGED',
  NEW = 'NEW',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  FILLED = 'FILLED',
  DONE_FOR_DAY = 'DONE_FOR_DAY',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
  HELD = 'HELD',
  REPLACED = 'REPLACED',
  PENDING_CANCEL = 'PENDING_CANCEL',
  PENDING_REPLACE = 'PENDING_REPLACE',
  ACCEPTED = 'ACCEPTED',
  PENDING_NEW = 'PENDING_NEW',
  ACCEPTED_FOR_BIDDING = 'ACCEPTED_FOR_BIDDING',
  STOPPED = 'STOPPED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
  CALCULATED = 'CALCULATED',
}

export enum TimeInForce {
  DAY = 'DAY',
  GTC = 'GTC',
  OPG = 'OPG',
  CLS = 'CLS',
  IOC = 'IOC',
  FOK = 'FOK',
}

export enum AlertType {
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  INFO = 'INFO',
}

export enum EventImportance {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS',
}

export enum OpenaiModel {
  GPT_4O = 'GPT_4O',
  GPT_4O_MINI = 'GPT_4O_MINI',
  O1_PREVIEW = 'O1_PREVIEW',
  O1_MINI = 'O1_MINI',
}

// =====================
// Interfaces
// =====================

export interface MarketSentiment {
  id: string;
  sentiment: MarketSentimentLevel;
  description: string;
  longDescription: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
  user: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  emailVerified?: Date;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  role: UserRole;
  bio?: string;
  jobTitle?: string;
  currentAccount: AlpacaAccountType;
  customerId?: number;
  plan?: SubscriptionPlan;
  openaiAPIKey?: string;
  openaiModel?: OpenaiModel;
  customer?: Customer;
  accounts?: Account[];
  sessions?: Session[];
  authenticators?: Authenticator[];
  alpacaAccounts?: AlpacaAccount[];
}

export interface AlpacaAccount {
  id: string;
  type: AlpacaAccountType;
  APIKey: string;
  APISecret: string;
  configuration?: any;
  marketOpen: boolean;
  realTime: boolean;
  minOrderSize: number;
  maxOrderSize: number;
  minPercentageChange: number;
  volumeThreshold: number;
  userId: string;
  user: User;
  createdAt: Date;
  updatedAt: Date;
  trades?: Trade[];
  orders?: Order[];
  positions?: Position[];
  alerts?: Alert[];
}

export interface Position {
  id: string;
  symbol: string;
  assetId?: string;
  asset?: Asset;
  averageEntryPrice: number;
  qty: number;
  qtyAvailable: number;
  marketValue: number;
  costBasis: number;
  unrealizedPL: number;
  unrealizedPLPC: number;
  unrealisedIntradayPL: number;
  unrealisedIntradayPLPC: number;
  currentPrice: number;
  lastTradePrice: number;
  changeToday: number;
  assetMarginable: boolean;
  alpacaAccountId: string;
  alpacaAccount?: AlpacaAccount;
  closed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Authenticator {
  id: string;
  userId: string;
  credentialID: string;
  publicKey: string;
  counter: number;
  user: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export interface VerificationToken {
  id: string;
  identifier: string;
  token: string;
  expires: Date;
}

export interface Customer {
  id: number;
  authUserId: string;
  name?: string;
  plan?: SubscriptionPlan;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  stripeCurrentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
  users?: User[];
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  logoUrl?: string;
  description?: string;
  cik?: string;
  exchange?: string;
  currency?: string;
  country?: string;
  sector?: string;
  industry?: string;
  address?: string;
  officialSite?: string;
  fiscalYearEnd?: string;
  latestQuarter?: string;
  marketCapitalization?: string;
  ebitda?: string;
  peRatio?: string;
  pegRatio?: string;
  bookValue?: string;
  dividendPerShare?: string;
  dividendYield?: string;
  eps?: string;
  revenuePerShareTTM?: string;
  profitMargin?: string;
  operatingMarginTTM?: string;
  returnOnAssetsTTM?: string;
  returnOnEquityTTM?: string;
  revenueTTM?: string;
  grossProfitTTM?: string;
  dilutedEPSTTM?: string;
  quarterlyEarningsGrowthYOY?: string;
  quarterlyRevenueGrowthYOY?: string;
  analystTargetPrice?: string;
  analystRatingStrongBuy?: string;
  analystRatingBuy?: string;
  analystRatingHold?: string;
  analystRatingSell?: string;
  analystRatingStrongSell?: string;
  trailingPE?: string;
  forwardPE?: string;
  priceToSalesRatioTTM?: string;
  priceToBookRatio?: string;
  evToRevenue?: string;
  evToEbitda?: string;
  beta?: string;
  week52High?: string;
  week52Low?: string;
  day50MovingAverage?: string;
  day200MovingAverage?: string;
  sharesOutstanding?: string;
  dividendDate?: string;
  exDividendDate?: string;
  askPrice?: number;
  bidPrice?: number;
  createdAt: Date;
  updatedAt: Date;
  trades?: Trade[];
  orders?: Order[];
  positions?: Position[];
  newsMentions?: NewsArticleAssetSentiment[];
  contracts?: Contract[];
}

export interface Contract {
  id: string;
  alpacaId: string;
  symbol: string;
  name: string;
  status: string;
  tradable: boolean;
  expirationDate: Date;
  rootSymbol: string;
  underlyingSymbol: string;
  underlyingAssetId: string;
  type: OptionType;
  style: OptionStyle;
  strikePrice: number;
  multiplier: number;
  size: number;
  openInterest?: number;
  openInterestDate?: Date;
  closePrice?: number;
  closePriceDate?: Date;
  deliverables?: Deliverable[];
  ppind?: boolean;
  assetId?: string;
  asset?: Asset;
  orderId?: string;
  order?: Order;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deliverable {
  id: string;
  type: DeliverableType;
  symbol: string;
  assetId?: string;
  amount?: number;
  allocationPercentage: number;
  settlementType: string;
  settlementMethod: string;
  delayedSettlement: boolean;
  contractId: string;
  contract: Contract;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trade {
  id: string;
  alpacaAccountId: string;
  assetId?: string;
  qty: number;
  price: number;
  total: number;
  optionType?: OptionType;
  signal: TradeSignal;
  strategy: TradeStrategy;
  analysis: string;
  summary: string;
  confidence: number;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  status: TradeStatus;
  alpacaAccount: AlpacaAccount;
  asset?: Asset;
  actions?: Action[];
}

export interface Action {
  id: string;
  sequence: number;
  tradeId: string;
  type: ActionType;
  note: string;
  status: ActionStatus;
  fee?: number;
  trade: Trade;
  order?: Order;
  dependsOn: string[];
  dependedOnBy: string[];
}

export interface Order {
  id: string;
  clientOrderId?: string;
  alpacaAccountId: string;
  assetId?: string;
  qty?: number;
  notional?: number;
  side: OrderSide;
  type: OrderType;
  orderClass: OrderClass;
  timeInForce: TimeInForce;
  limitPrice?: number;
  stopPrice?: number;
  stopLoss?: StopLoss;
  takeProfit?: TakeProfit;
  trailPrice?: number;
  trailPercent?: number;
  extendedHours?: boolean;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  filledAt?: Date;
  filledQty?: number;
  filledAvgPrice?: number;
  cancelRequestedAt?: Date;
  canceledAt?: Date;
  actionId?: string;
  alpacaAccount: AlpacaAccount;
  action?: Action;
  asset?: Asset;
  fee?: number;
  strikePrice?: number;
  expirationDate?: Date;
  optionType?: OptionType;
  stopLossId?: string;
  takeProfitId?: string;
  contractId?: string;
  contract?: Contract;
}

export interface StopLoss {
  id: string;
  stopPrice?: number;
  limitPrice?: number;
  createdAt: Date;
  updatedAt: Date;
  orderId: string;
  Order: Order;
}

export interface TakeProfit {
  id: string;
  limitPrice?: number;
  stopPrice?: number;
  createdAt: Date;
  updatedAt: Date;
  orderId: string;
  Order: Order;
}

export interface Alert {
  id: string;
  alpacaAccountId: string;
  message: string;
  type: AlertType;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  alpacaAccount: AlpacaAccount;
}

export interface NewsArticle {
  id: string;
  title: string;
  content?: string;
  source: string;
  sourceDomain?: string;
  url: string;
  sentiment: string;
  authors: string[];
  summary?: string;
  bannerImage?: string;
  timePublished: string;
  category?: string;
  topics: string[];
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
  assets?: NewsArticleAssetSentiment[];
}

export interface NewsArticleAssetSentiment {
  id: string;
  assetId?: string;
  newsArticleId: string;
  url: string;
  news: NewsArticle;
  asset?: Asset;
  relevancyScore?: string;
  sentimentScore?: string;
  sentimentLabel?: string;
}

export interface EconomicEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  importance: EventImportance;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledOptionOrder {
  id: string;
  payload: any;
  status: ScheduledOptionOrderStatus;
}
