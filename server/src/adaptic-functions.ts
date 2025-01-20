/**********************************************************************************
 * Adaptic calls
 **********************************************************************************/

import adaptic, { types } from 'adaptic-backend';
import { adaptic as adapticUtils, AssetOverviewResponse } from 'adaptic-utils';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client';   
import { apolloClient } from './apollo-client';

export const fetchAllLiveAlpacaAccounts = async (): Promise<types.AlpacaAccount[]> => {
  try {
    const selectionSet = `
      id
      type
      APIKey
      APISecret
      configuration
      marketOpen
      realTime
      minOrderSize
      maxOrderSize
      minPercentageChange
      volumeThreshold
      user {
        id
        name
        email
        openaiAPIKey
        openaiModel
      }
      userId
    `;

    const accounts = (await apolloClient.query({
      query: adapticUtils.apollo.gql`
        query {
          alpacaAccounts (where: { marketOpen: {equals: true} }) {
            ${selectionSet}
          }
        }
      `,
    })) as { data: { alpacaAccounts: types.AlpacaAccount[] } };

    return accounts.data.alpacaAccounts;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error fetching accounts via gql:', errorMessage);
    return [];
  }
};

interface AdapticAssetResponse {
  asset: {
    id: string;
    symbol: string;
    [key: string]: unknown;
  };
}

// Get Asset Overview from Adaptic
export const getAssetOverview = async (symbol: string): Promise<AssetOverviewResponse> => {
  if (!symbol) {
    return {
      asset: null,
      error: 'Symbol is required',
      success: false,
    };
  }

  try {
    const encodedSymbol = encodeURIComponent(symbol.trim().toUpperCase());
    const urlToFetch = `https://adaptic.ai/api/asset/overview?symbol=${encodedSymbol}`;
    const res = await fetch(urlToFetch);

    if (!res.ok) {
      const errorData = (await res.json()) as { error?: string };
      console.error(`Failed to fetch asset data for ${symbol}:`, errorData);
      return {
        asset: null,
        error: errorData.error || `Failed to fetch asset data for ${symbol}`,
        success: false,
      };
    }

    const data = (await res.json()) as AdapticAssetResponse;

    if (!data.asset || !data.asset.id) {
      console.error(`Invalid asset data received for ${symbol}:`, data);
      return {
        asset: null,
        error: `Invalid asset data received for ${symbol}`,
        success: false,
      };
    }

    return {
      asset: {
        ...data.asset,
        symbol: data.asset.symbol || symbol,
      },
      error: null,
      success: true,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Error fetching asset data for ${symbol}:`, errorMessage);
    return {
      asset: null,
      error: errorMessage,
      success: false,
    };
  }
};

export async function fetchAndValidateAccounts(eventOnlyDana: boolean = false) {
  let accounts = await fetchAllLiveAlpacaAccounts();

  if (accounts.length === 0) {
    const errorMessage = `Could not find any live accounts in Adaptic. Exiting...`;
    console.log(errorMessage);
    return { error: errorMessage, accounts: [] };
  }

  const accountsFound = accounts
    .map((account) => `${account.user?.email} (id: ${account.id}, type: ${account.type})`)
    .join(', ');

  console.log(`Found ${accounts.length} active Alpaca accounts: ${accountsFound}`);

  return { accounts };
}

interface TradeQueryProps extends types.Trade {
  sort?: {
    field: keyof types.Trade;
    order?: 'asc' | 'desc';
  };
  limit?: number;
}

adaptic.trade.findMany = async function (
  props: TradeQueryProps,
  clientToUse: ApolloClient<NormalizedCacheObject>
) {
  const selectionSet = `
    id
    assetId
    qty
    price
    total
    signal
    summary
    createdAt
    updatedAt
    status
    asset {
      id
      symbol
      name
      exchange
    }
    actions {
      id
      sequence
      tradeId
      type
      primary
      status
      order {
        id
        clientOrderId
        qty
        side
        type
        limitPrice
        stopPrice
        trailPercent
        status
        createdAt
        updatedAt
        filledQty
        filledAvgPrice
      }
    }
    `;

  const FIND_MANY_TRADE = adapticUtils.apollo.gql`
    query findManyTrade(
      $where: TradeWhereInput!
      $orderBy: [TradeOrderByWithRelationInput!]
      $take: Int
    ) {
      trades(
        where: $where
        orderBy: $orderBy
        take: $take
      ) {
        ${selectionSet}
      }
    }`;

  const variables = {
    where: {
      id: props.id !== undefined ? { equals: props.id } : undefined,
      alpacaAccountId: props.alpacaAccountId !== undefined 
        ? { equals: props.alpacaAccountId }
        : undefined,
      createdAt: props.createdAt !== undefined
        ? typeof props.createdAt === 'string'
          ? { gte: props.createdAt }
          : props.createdAt
        : undefined,
    },
    orderBy: props.sort 
      ? [{ [props.sort.field]: props.sort.order || 'desc' }]
      : [{ createdAt: 'desc' }], // Default sort
    take: props.limit || 10, // Default limit
  };

  try {
    const response = await clientToUse.query({ query: FIND_MANY_TRADE, variables });
    if (response.errors && response.errors.length > 0) 
      throw new Error(response.errors[0].message);
    return response.data?.trades ?? [];
  } catch (error) {
    if (error instanceof adapticUtils.apollo.ApolloError && 
        error.message === 'No Trade object found') {
      return null;
    } else {
      console.error('Error in findManyTrade:', error);
      throw error;
    }
  }
};

export const fetchRecentTrades = async (
  startTimeUtc: Date,
  options?: {
    alpacaAccountId?: string;
    limit?: number;
    sort?: {
      field: keyof types.Trade;
      order?: 'asc' | 'desc';
    };
  }
): Promise<types.Trade[] | null> => {
  const { alpacaAccountId, limit, sort } = options || {};
  try {
    const nowUtc = new Date();

    adapticUtils.utils.logIfDebug(`Start time UTC: ${startTimeUtc.toISOString()}`);
    adapticUtils.utils.logIfDebug(`Current time in UTC: ${nowUtc.toISOString()}`);

    const trades = await adaptic.trade.findMany(
      {
        alpacaAccountId,
        createdAt: {
          gte: startTimeUtc.toISOString(),
          lte: nowUtc.toISOString(),
        },
        limit,
        sort,
      } as unknown as TradeQueryProps,
      apolloClient
    );

    if (trades && trades?.length > 0) {
      adapticUtils.utils.logIfDebug(`Found ${trades?.length} recent trades`);
      return trades;
    }
    adapticUtils.utils.logIfDebug(`No trades found. Response: ${JSON.stringify(trades)}`);
    return null;
  } catch (error) {
    console.error('Error fetching recent trades:', error);
    throw new Error('Failed to fetch trades from backend');
  }
};
