import { useState } from 'react';
import { useAlpaca } from './context/AlpacaContext';
import AccountInfo from './components/AccountInfo';
import BalanceSection from './components/BalanceSection';
import MarketTime from './components/MarketTime';
import CreateOrder from './components/CreateOrder';
import Orders from './components/Orders';
import Positions from './components/Positions';
import AccountNavChart from './components/AccountNavChart';

function App() {
  const {
    accountInfo,
    orders,
    positions,
    isLoading,
    error,
    refreshData,
    submitOrder,
    cancelOrder,
    patchOrder
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
          The Money Glitch
        </h1>

        {/* Account Info */}
        <AccountInfo />

        {/* Balance and Market Time Sections */}
        <div className="grid sm:grid-cols-2 gap-8 mb-8">
          <BalanceSection
            accountInfo={accountInfo}
            isLoading={isLoading}
            equity={accountInfo?.equity || '0'}
          />
          <MarketTime lastUpdated={lastUpdated} />
        </div>

        {/* Account NAV Chart Section */}
        <AccountNavChart />

        {/* Create Order Section */}
        <CreateOrder onOrderSubmit={submitOrder} />

        {/* Positions Section */}
        <Positions 
          positions={positions}
          orders={orders}
          onRefreshPositions={refreshData}
        />

        {/* Orders Section */}
        <Orders
          orders={orders}
          onCancelOrder={cancelOrder}
          onRefreshOrders={refreshData}
          onPatchOrder={patchOrder}
        />
      </div>
    </div>
  );
}

export default App;
