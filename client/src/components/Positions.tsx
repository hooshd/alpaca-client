import React, { useState, useEffect } from 'react';
import { Position } from '../types';
import { MarketHoursCalculator } from '../utils/marketTime';
import { formatCurrency } from '../utils/formatting';

const formatAssetClass = (assetClass: string): string => {
  const mapping: { [key: string]: string } = {
    us_equity: 'Equity',
    us_option: 'Option',
    crypto: 'Crypto',
  };
  return mapping[assetClass] || assetClass;
};

const formatQuantity = (qty: string, side: 'long' | 'short'): string => {
  const numValue = parseFloat(qty);
  return side === 'short' ? `-${Math.abs(numValue)}` : `${Math.abs(numValue)}`;
};

interface PositionRowProps {
  position: Position;
  onClose: (position: Position) => void;
}

const PositionRow: React.FC<PositionRowProps> = ({ position, onClose }) => {
  const isShort = position.side === 'short';

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="py-4 px-4">
        <div className="font-medium text-gray-900">{position.symbol}</div>
      </td>
      <td className="py-4 px-4">
        <div className="text-gray-600">{formatAssetClass(position.asset_class)}</div>
      </td>
      <td className="py-4 px-4">
        <div className={`${isShort ? 'text-red-600' : 'text-gray-900'}`}>
          {formatQuantity(position.qty, position.side)}
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="text-gray-900">{formatCurrency(position.market_value)}</div>
      </td>
      <td className="py-4 px-4">
        <div className="text-gray-900">{formatCurrency(position.current_price)}</div>
      </td>
      <td className="py-4 px-4">
        <div className={`${parseFloat(position.unrealized_pl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(position.unrealized_pl)}
        </div>
      </td>
      <td className="py-4 px-4">
        <button
          onClick={() => onClose(position)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Close
        </button>
      </td>
    </tr>
  );
};

interface PositionsProps {
  positions: Position[];
  onRefreshPositions: () => Promise<void>;
}

export const Positions: React.FC<PositionsProps> = ({ positions, onRefreshPositions }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCloseAllModalOpen, setIsCloseAllModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [totalUnrealizedPL, setTotalUnrealizedPL] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showCloseButton, setShowCloseButton] = useState(false);

  useEffect(() => {
    // Calculate total unrealized P&L whenever positions change
    const total = positions.reduce((sum, position) => sum + parseFloat(position.unrealized_pl), 0);
    setTotalUnrealizedPL(total);
  }, [positions]);

  const handleClosePosition = (position: Position) => {
    setSelectedPosition(position);
    setIsModalOpen(true);
    // Clear any existing messages when opening modal
    setStatusMessage('');
    setErrorMessage('');
    setShowCloseButton(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setStatusMessage('');
    setErrorMessage('');
    setShowCloseButton(false);
  };

  const handleCloseAllModal = () => {
    setIsCloseAllModalOpen(false);
    setStatusMessage('');
    setErrorMessage('');
  };

  const confirmClosePosition = async () => {
    if (!selectedPosition) return;

    const marketStatus = MarketHoursCalculator.determineMarketStatus();
    setIsLoading(true);
    setStatusMessage('');
    setErrorMessage('');
    setShowCloseButton(false);

    try {
      let response;
      
      if (marketStatus.status === 'CLOSED') {
        setErrorMessage('Cannot close position — Market is currently closed');
        setIsLoading(false);
        return;
      }

      if (marketStatus.status === 'OPEN') {
        response = await fetch(`/api/positions/close/${selectedPosition.symbol}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else if (marketStatus.status === 'EXTENDED HOURS') {
        // Submit a limit order at the last traded price
        // For a long position, we need to sell; for a short position, we need to buy
        const orderSide = selectedPosition.side === 'long' ? 'sell' : 'buy';
        const orderQty = Math.abs(parseFloat(selectedPosition.qty)).toString();

        response = await fetch('/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            symbol: selectedPosition.symbol,
            quantityType: 'qty',
            quantity: orderQty,
            side: orderSide,
            orderType: 'limit',
            limitPrice: selectedPosition.current_price,
            extendedHours: true
          }),
        });
      }

      if (response && response.ok) {
        setStatusMessage('Successfully closed the position.');
        setShowCloseButton(true);
        setTimeout(() => {
          handleCloseModal();
        }, 2000);
      } else if (response) {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to close position.');
        setShowCloseButton(true); // Show close button on error
      }
    } catch (error) {
      setErrorMessage('An error occurred while closing the position.');
      setShowCloseButton(true); // Show close button on error
    } finally {
      setIsLoading(false);
    }
  };

  const confirmCloseAllPositions = async () => {
    const marketStatus = MarketHoursCalculator.determineMarketStatus();
    setIsLoading(true);
    setStatusMessage('');
    setErrorMessage('');

    try {
      if (marketStatus.status === 'CLOSED') {
        setErrorMessage('Cannot close positions — Market is currently closed');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/positions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setStatusMessage('Successfully closed all positions.');
        setTimeout(() => {
          handleCloseAllModal();
          onRefreshPositions();
        }, 2000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to close all positions.');
        setShowCloseButton(true); // Show close button on error
      }
    } catch (error) {
      setErrorMessage('An error occurred while closing all positions.');
      setShowCloseButton(true); // Show close button on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      onRefreshPositions();
    }, 5000);

    return () => clearInterval(interval);
  }, [onRefreshPositions]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isModalOpen]);

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium text-gray-700">Positions</h2>
        {positions.length > 0 && (
          <button
            onClick={() => setIsCloseAllModalOpen(true)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Close All Positions
          </button>
        )}
      </div>
      {positions.length > 0 ? (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Symbol
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset Class
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Market Value
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Price
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unrealized P&L
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {positions.map((position) => (
                <PositionRow key={position.asset_id} position={position} onClose={handleClosePosition} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg text-center text-gray-500 py-4">No positions to display</div>
      )}

      {isModalOpen && selectedPosition && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-md">
            <h3 className="text-lg font-medium mb-4">Confirm Closing Position for {selectedPosition.symbol}?</h3>
            <p>
              {MarketHoursCalculator.determineMarketStatus().status === 'OPEN'
                ? `This will submit an order to close at the market price.`
                : `This will submit a limit order to close at the price of ${formatCurrency(
                    selectedPosition.current_price
                  )}.`}
            </p>
            {isLoading ? (
              <p>Processing...</p>
            ) : (
              <>
                {statusMessage && <p className="text-green-600">{statusMessage}</p>}
                {errorMessage && <p className="text-red-600">{errorMessage}</p>}
                <div className="mt-4">
                  {showCloseButton ? (
                    <button
                      onClick={handleCloseModal}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Close
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={confirmClosePosition}
                        className="mr-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={handleCloseModal}
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isCloseAllModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-md">
            <h3 className="text-lg font-medium mb-4">Confirm Closing All Positions?</h3>
            <p>This will submit orders to close all positions at market price.</p>
            <p className="mt-2">
              Total Unrealized P&L: <span className={`font-medium ${totalUnrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalUnrealizedPL}
              </span>
            </p>
            {isLoading ? (
              <p>Processing...</p>
            ) : (
              <>
                {statusMessage && <p className="text-green-600">{statusMessage}</p>}
                {errorMessage && <p className="text-red-600">{errorMessage}</p>}
                <div className="mt-4">
                  <button
                    onClick={confirmCloseAllPositions}
                    className="mr-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={handleCloseAllModal}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Positions;
