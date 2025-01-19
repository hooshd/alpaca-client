import React from 'react';
import { useAlpaca } from '../context/AlpacaContext';

export const AccountInfo: React.FC = () => {
  const { accountInfo, availableAccounts, selectedAccount, switchAccount } = useAlpaca();

  const handleAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const account = availableAccounts.find((acc) => acc.display_name === e.target.value);
    if (account) {
      switchAccount(account);
    }
  };

  const accountInfoURL =
    'https://docs.google.com/spreadsheets/d/1XooIEued5d1znnz5Gufh3--U_Ahn3WMNgOgrlR-bjGc/edit#gid=0';

  return (
    <section className="mb-8">
      <h2 className="text-xl font-medium text-gray-700 mb-4">
        Account Info{' '}
        <a
          href={accountInfoURL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline hover:text-blue-700"
        >
          (edit)
        </a>
      </h2>

      {/* Account Selection Dropdown */}
      <div className="mb-4">
        <select
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          value={selectedAccount?.display_name || ''}
          onChange={handleAccountChange}
        >
          {availableAccounts.map((account) => (
            <option key={account.display_name} value={account.display_name}>
              {account.display_name}
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
              {selectedAccount.name} ({selectedAccount.email})
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
