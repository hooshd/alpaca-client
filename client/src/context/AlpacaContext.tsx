import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AccountInfo } from '../types';
import { Order, Position } from 'adaptic-utils';
import { types } from 'adaptic-backend/server/index';

interface AlpacaContextType {
  accountInfo: AccountInfo | null;
  orders: Order[];
  positions: Position[];
  isLoading: boolean;
  error: string | null;
  availableAccounts: types.AlpacaAccount[];
  selectedAccount: types.AlpacaAccount | null;
  refreshData: () => Promise<void>;
  refreshConfig: () => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  patchOrder: (orderId: string, data: { trail?: string }) => Promise<void>;
  switchAccount: (account: types.AlpacaAccount) => Promise<void>;
}

const AlpacaContext = createContext<AlpacaContextType | undefined>(undefined);

export const useAlpaca = () => {
  const context = useContext(AlpacaContext);
  if (!context) {
    throw new Error('useAlpaca must be used within an AlpacaProvider');
  }
  return context;
};

interface AlpacaProviderProps {
  children: ReactNode;
}

export const AlpacaProvider: React.FC<AlpacaProviderProps> = ({ children }) => {
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableAccounts, setAvailableAccounts] = useState<types.AlpacaAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<types.AlpacaAccount | null>(null);

  const refreshConfig = async () => {
    try {
      const response = await fetch('/api/account/refresh', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to refresh accounts');
      const data = await response.json();
      setAvailableAccounts(data.accounts);
      if (data.accounts.length > 0 && !selectedAccount) {
        setSelectedAccount(data.accounts[0]);
      }
      return data.accounts;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh accounts');
      throw err;
    }
  };

  const fetchAvailableAccounts = async () => {
    try {
      // This will internally call the refresh endpoint
      const response = await fetch('/api/accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const accounts = await response.json();
      setAvailableAccounts(accounts);
      if (accounts.length > 0 && !selectedAccount) {
        setSelectedAccount(accounts[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
    }
  };

  const fetchAccountInfo = async () => {
    try {
      const response = await fetch('/api/account');
      if (!response.ok) throw new Error('Failed to fetch account info');
      const data = await response.json();
      setAccountInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch account info');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    }
  };

  const fetchPositions = async () => {
    try {
      const response = await fetch('/api/positions');
      if (!response.ok) throw new Error('Failed to fetch positions');
      const data = await response.json();
      setPositions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch positions');
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([fetchAccountInfo(), fetchOrders(), fetchPositions()]);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to cancel order');

      await refreshData();
    } catch (err) {
      throw err;
    }
  };

  const patchOrder = async (orderId: string, data: { trail?: string }) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to patch order');

      await refreshData();
    } catch (err) {
      throw err;
    }
  };

  const switchAccount = async (account: types.AlpacaAccount) => {
    try {
      // Refresh config first to ensure we have the latest account data
      const accounts = await refreshConfig();
      const updatedAccount = accounts.find((acc: types.AlpacaAccount) => acc.user?.email === account.user?.email);
      if (!updatedAccount) {
        throw new Error('Account no longer exists in config');
      }

      const response = await fetch('/api/account/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedAccount),
      });

      if (!response.ok) throw new Error('Failed to switch account');

      setSelectedAccount(updatedAccount);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch account');
      throw err;
    }
  };

  useEffect(() => {
    // Initial load - fetch accounts which will internally refresh config
    fetchAvailableAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      refreshData();
    }

    // Refresh data every minute
    const interval = setInterval(refreshData, 60000);

    return () => clearInterval(interval);
  }, [selectedAccount]);

  const value = {
    accountInfo,
    orders,
    positions,
    isLoading,
    error,
    availableAccounts,
    selectedAccount,
    refreshData,
    refreshConfig,
    cancelOrder,
    patchOrder,
    switchAccount,
  };

  return <AlpacaContext.Provider value={value}>{children}</AlpacaContext.Provider>;
};

export default AlpacaProvider;
