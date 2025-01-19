import React from 'react';
import { useAlpaca } from '../context/AlpacaContext';

export const AccountInfo: React.FC = () => {
  const { availableAccounts, selectedAccount, switchAccount } = useAlpaca();

  const handleAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const account = availableAccounts.find((acc) => acc.user?.email === e.target.value);
    if (account) {
      switchAccount(account);
    }
  };

  return (
    <section className="mb-8">
      <h2 className="text-xl font-medium text-gray-700 mb-4">
        Account Info
      </h2>

      {/* Account Selection Dropdown */}
      <div className="mb-4">
        <select
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          value={selectedAccount?.user?.email || ''}
          onChange={handleAccountChange}
        >
          {availableAccounts.map((account) => (
            <option key={account.user?.email} value={account.user?.email || ''}>
              {account.user?.email}
            </option>
          ))}
        </select>
      </div>

      {/* Account Details */}
      <div className="grid sm:grid-cols-2 gap-4 text-base text-gray-600">
        {selectedAccount && (
          <>
            <div className="font-medium">Account:</div>
            <div className="sm:text-right">
              {selectedAccount.user?.email}
            </div>
            <div className="font-medium">Account type:</div>
            <div className="sm:text-right">{selectedAccount.type}</div>
          </>
        )}
      </div>
    </section>
  );
};

export default AccountInfo;
