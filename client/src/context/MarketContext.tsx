import React, { createContext, useContext, useState, useEffect } from 'react';
import { MarketHoursCalculator } from '../utils/marketTime';

interface MarketContextType {
  status: string;
  nextStatus: string;
  isExtendedHours: boolean;
}

const MarketContext = createContext<MarketContextType>({
  status: 'CLOSED',
  nextStatus: '',
  isExtendedHours: false,
});

export const useMarket = () => useContext(MarketContext);

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [marketInfo, setMarketInfo] = useState(() => {
    const status = MarketHoursCalculator.determineMarketStatus();
    return {
      status: status.status,
      nextStatus: status.nextStatus,
      isExtendedHours: status.status === 'EXTENDED HOURS'
    };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const status = MarketHoursCalculator.determineMarketStatus();
      setMarketInfo({
        status: status.status,
        nextStatus: status.nextStatus,
        isExtendedHours: status.status === 'EXTENDED HOURS'
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <MarketContext.Provider value={marketInfo}>
      {children}
    </MarketContext.Provider>
  );
};
