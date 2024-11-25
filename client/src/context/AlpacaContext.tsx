import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AccountInfo, Order, Position, SheetAccount } from '../types';

interface AlpacaContextType {
  accountInfo: AccountInfo | null;
  orders: Order[];
  positions: Position[];
  isLoading: boolean;
  error: string | null;
  availableAccounts: SheetAccount[];
  selectedAccount: SheetAccount | null;
  refreshData: () => Promise<void>;
  submitOrder: (orderData: any) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  switchAccount: (account: SheetAccount) => Promise<void>;
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
  const [availableAccounts, setAvailableAccounts] = useState<SheetAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<SheetAccount | null>(null);

  const fetchAvailableAccounts = async () => {
    try {
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
      await Promise.all([
        fetchAccountInfo(),
        fetchOrders(),
        fetchPositions()
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const submitOrder = async (orderData: any) => {
    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) throw new Error('Failed to submit order');
      
      await refreshData();
    } catch (err) {
      throw err;
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to cancel order');
      
      await refreshData();
    } catch (err) {
      throw err;
    }
  };

  const switchAccount = async (account: SheetAccount) => {
    try {
      const response = await fetch('/api/account/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(account)
      });
      
      if (!response.ok) throw new Error('Failed to switch account');
      
      setSelectedAccount(account);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch account');
      throw err;
    }
  };

  useEffect(() => {
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
    submitOrder,
    cancelOrder,
    switchAccount
  };

  return (
    <AlpacaContext.Provider value={value}>
      {children}
    </AlpacaContext.Provider>
  );
};

export default AlpacaProvider;
