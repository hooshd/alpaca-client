import React, { useEffect, useState } from 'react';
import { AccountInfo } from '../types';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface BalanceSectionProps {
  accountInfo: AccountInfo | null;
}

export const BalanceSection: React.FC<BalanceSectionProps> = ({ accountInfo }) => {
  const [gainLoss, setGainLoss] = useState<{ amount: number; percentage: number } | null>(null);

  useEffect(() => {
    const fetchYesterdayNav = async () => {
      try {
        const response = await fetch('/api/account/portfolio/history?period=1D&timeframe=5Min&intraday_reporting=market_hours');
        if (!response.ok) throw new Error('Failed to fetch portfolio history');
        const data = await response.json();
        console.log('Portfolio history response:', data);
        
        if (data.timestamp && data.equity && Array.isArray(data.equity) && data.equity.length > 0) {
          // Calculate gain/loss
          const currentNav = Number(accountInfo?.equity || 0);
          const yesterdayClosingNav = data.equity[0]; // First value should be yesterday's closing
          console.log('Current NAV:', currentNav, 'Yesterday NAV:', yesterdayClosingNav);
          
          const amountChange = currentNav - yesterdayClosingNav;
          const percentageChange = (amountChange / yesterdayClosingNav) * 100;
          
          setGainLoss({
            amount: amountChange,
            percentage: percentageChange
          });
        } else {
          console.log('No equity data available in portfolio history response');
        }
      } catch (error) {
        console.error('Error fetching yesterday NAV:', error);
      }
    };

    if (accountInfo?.equity) {
      fetchYesterdayNav();
    }
  }, [accountInfo?.equity]);

  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <div className="text-xl font-semibold text-gray-800 mb-4">Account Value</div>
      <div className="grid grid-cols-2 gap-4 text-base text-gray-600">
        <h2 className="font-medium">Current NAV</h2>
        <div className="text-right font-semibold text-gray-800">
          {formatCurrency(Number(accountInfo?.equity || 0))}
        </div>
        {gainLoss && (
          <>
            <div className="font-medium">Today's Gain/Loss</div>
            <div className={`text-right font-semibold ${gainLoss.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(gainLoss.amount)} ({formatPercentage(gainLoss.percentage)})
            </div>
          </>
        )}
        <div className="font-medium">Cash Balance:</div>
        <div className="text-right font-semibold text-green-500">
          {formatCurrency(Number(accountInfo?.cash || 0))}
        </div>
        <div className="font-medium">Buying Power:</div>
        <div className="text-right font-semibold text-blue-500">
          {formatCurrency(Number(accountInfo?.buying_power || 0))}
        </div>
      </div>
    </section>
  );
};