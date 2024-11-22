import React, { useState } from 'react';
import { useAlpaca } from './context/AlpacaContext';
import AccountInfo from './components/AccountInfo';
import BalanceSection from './components/BalanceSection';
import MarketTime from './components/MarketTime';
import CreateOrder from './components/CreateOrder';
import Orders from './components/Orders';
import Positions from './components/Positions';

function App() {
  const {
    accountInfo,
    orders,
    positions,
    isLoading,
    error,
    refreshData,
    submitOrder,
    cancelOrder
  } = useAlpaca();

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const handleRefresh = async () => {
    await refreshData();
    setLastUpdated(new Date());
  };

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
        <div className="bg-white shadow-lg rounded-xl p-8 max-w-lg w-full">
          <h1 className="text-2xl font-semibold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-6 w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center p-6 font-inter">
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-3xl font-semibold mb-8 text-center text-gray-800">
          Alpaca Dashboard
        </h1>

        {/* Update All Button */}
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className={`w-full bg-blue-600 text-white py-3 rounded-lg mb-6 hover:bg-blue-700 transition-colors duration-300 ease-in-out shadow-md ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Updating...' : 'Update All'}
        </button>

        {/* Account Info */}
        <AccountInfo accountInfo={accountInfo} isLoading={isLoading} />

        {/* Balance and Market Time Sections */}
        <div className="grid sm:grid-cols-2 gap-8 mb-8">
          <BalanceSection
            accountInfo={accountInfo}
            isLoading={isLoading}
            accountValue={accountInfo?.cash || '0'}
          />
          <MarketTime lastUpdated={lastUpdated} />
        </div>

        {/* Create Order Section */}
        <CreateOrder onOrderSubmit={submitOrder} />

        {/* Positions Section */}
        <Positions positions={positions} />

        {/* Orders Section */}
        <Orders
          orders={orders}
          onCancelOrder={cancelOrder}
          onRefreshOrders={refreshData}
        />
      </div>
    </div>
  );
}

export default App;
