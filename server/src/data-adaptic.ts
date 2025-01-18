/**********************************************************************************
 * Adaptic calls
 **********************************************************************************/

import { types } from 'adaptic-backend/server/index';
import { adaptic as adapticUtils } from 'adaptic-utils';
import { ProcessedAssetOverviewResponse } from './types';
import { client } from './apollo-client';

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

    const accounts = (await client.query({
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
export const getAssetOverview = async (symbol: string): Promise<ProcessedAssetOverviewResponse> => {
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
    const errorMessage = `Could not find any suitable accounts found on behalf of which to determine potential trades. Exiting...`;
    console.log(errorMessage);
    return { error: errorMessage, accounts: [] };
  }

  const accountsFound = accounts
    .map((account) => `${account.user?.email} (id: ${account.id}, type: ${account.type})`)
    .join(', ');

  console.log(`Found ${accounts.length} active Alpaca accounts: ${accountsFound}`);

  return { accounts };
}
