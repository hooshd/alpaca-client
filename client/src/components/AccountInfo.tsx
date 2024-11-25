import React from 'react';
import { AccountInfo as AccountInfoType } from '../types';
import BalanceSection from './BalanceSection'; // Import BalanceSection

interface AccountInfoProps {
  accountInfo: AccountInfoType | null;
  isLoading: boolean;
}

export const AccountInfo: React.FC<AccountInfoProps> = ({ accountInfo, isLoading }) => {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-medium text-gray-700 mb-4">Account Info</h2>
      <div className="grid sm:grid-cols-2 gap-4 text-base text-gray-600">
        <div className="font-medium">User ID:</div>
        <div className="sm:text-right">
          {isLoading ? 'Loading...' : accountInfo?.id}
        </div>
        <div className="font-medium">Account Number:</div>
        <div className="sm:text-right">
          {isLoading ? 'Loading...' : accountInfo?.account_number}
        </div>
      </div>
    </section>
  );
};

export default AccountInfo;