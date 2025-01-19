import { useState } from 'react';
import { useAlpaca } from './context/AlpacaContext';
import { MarketProvider } from './context/MarketContext';
import { MarketHoursCalculator } from './utils/marketTime';
import AccountInfo from './components/AccountInfo';
import { BalanceSection } from './components/BalanceSection';
import MarketTime from './components/MarketTime';
import Orders from './components/Orders';
import Trades from './components/Trades';
import AccountNavChart from './components/AccountNavChart';
import Chat from './components/Chat';

function App() {
  const { accountInfo, orders, positions, error, refreshData, submitOrder, cancelOrder, patchOrder } = useAlpaca();

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
    <MarketProvider>
      <div className="bg-gray-50 min-h-screen flex flex-col items-center p-6 font-inter">
        <div className="w-full max-w-[calc(100%-10px)] bg-white shadow-lg rounded-xl p-8">
          <h1 className="text-3xl font-semibold mb-8 text-center text-gray-800">The Money Glitch</h1>

          {/* Account Info */}
          <AccountInfo />

          {/* Balance and Market Time Sections */}
          <div className="grid sm:grid-cols-2 gap-8 mb-8">
            <BalanceSection accountInfo={accountInfo} />
            <MarketTime lastUpdated={lastUpdated} />
          </div>

          {/* Account NAV Chart Section */}
          <AccountNavChart />

          {/* Chat Section */}
          <Chat />

          {/* Close All Positions Button */}
          <div className="mb-8">
            <button
              onClick={async () => {
                try {
                  const marketStatus = MarketHoursCalculator.determineMarketStatus();

                  if (marketStatus.status === 'EXTENDED HOURS') {
                    // For after-hours trading, submit limit orders for each position
                    await Promise.all(
                      positions.map(async (position) => {
                        const currentPrice = parseFloat(position.current_price);
                        const orderSide = position.side === 'long' ? 'sell' : 'buy';
                        const limitPrice =
                          orderSide === 'sell'
                            ? (currentPrice * 0.99).toFixed(2) // 1% lower for sell orders
                            : (currentPrice * 1.01).toFixed(2); // 1% higher for buy orders

                        return fetch('/api/orders/create', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            symbol: position.symbol,
                            quantityType: 'qty',
                            quantity: Math.abs(parseFloat(position.qty)).toString(),
                            side: orderSide,
                            orderType: 'limit',
                            limitPrice,
                            extendedHours: true,
                          }),
                        });
                      })
                    );
                  } else {
                    // During regular hours, use the standard close all endpoint
                    await fetch('/api/positions', {
                      method: 'DELETE',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    });
                  }
                  refreshData();
                } catch (error) {
                  console.error('Error closing all positions:', error);
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors duration-300"
            >
              Close All Positions
            </button>
          </div>

          {/* Trades Section */}
          <Trades
            positions={positions}
            orders={orders}
            onClose={async (position) => {
              try {
                await fetch(`/api/positions/close/${position.symbol}`, {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                });
                refreshData();
              } catch (error) {
                console.error('Error closing position:', error);
              }
            }}
            onPatchOrder={patchOrder}
          />

          {/* Orders Section */}
          <Orders orders={orders} onCancelOrder={cancelOrder} onRefreshOrders={refreshData} onPatchOrder={patchOrder} />
        </div>
      </div>
    </MarketProvider>
  );
}

export default App;
