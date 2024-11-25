import React from 'react';
import { AccountInfo } from '../types';

interface BalanceSectionProps {
  accountInfo: AccountInfo | null;
  isLoading: boolean;
  equity: string; // Changed from accountValue to equity
}

// Utility function to format numbers as currency
const formatCurrency = (value: number): string => {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const BalanceSection: React.FC<BalanceSectionProps> = ({ accountInfo, isLoading, equity }) => {
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <div className="text-xl font-semibold text-gray-800 mb-4">Account Value</div>
      <div className="grid grid-cols-2 gap-4 text-base text-gray-600">
        <h2 className="font-medium">Current NAV</h2>
        <div className="text-right font-semibold text-gray-800">
          {formatCurrency(Number(accountInfo?.equity))} {/* Updated to use equity */}
        </div>
        <div className="font-medium">Cash Balance:</div>
        <div className="text-right font-semibold text-green-500">
          {formatCurrency(Number(accountInfo?.cash))}
        </div>
        <div className="font-medium">Buying Power:</div>
        <div className="text-right font-semibold text-blue-500">
          {formatCurrency(Number(accountInfo?.buying_power))}
        </div>
      </div>
    </section>
  );
};

export default BalanceSection;