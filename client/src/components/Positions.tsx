import React, { useState } from 'react';
import { Position } from '../types';

const formatCurrency = (value: string | undefined): string => {
  if (!value) return '$0.00';
  const numValue = parseFloat(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

const formatAssetClass = (assetClass: string): string => {
  const mapping: { [key: string]: string } = {
    'us_equity': 'Equity',
    'us_option': 'Option',
    'crypto': 'Crypto'
  };
  return mapping[assetClass] || assetClass;
};

const formatQuantity = (qty: string, side: 'long' | 'short'): string => {
  const numValue = parseFloat(qty);
  return side === 'short' ? `-${Math.abs(numValue)}` : `${Math.abs(numValue)}`;
};

interface PositionRowProps {
  position: Position;
}

const PositionRow: React.FC<PositionRowProps> = ({ position }) => {
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
    </tr>
  );
};

interface PositionsProps {
  positions: Position[];
}

export const Positions: React.FC<PositionsProps> = ({ positions }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalUnrealizedPL, setTotalUnrealizedPL] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCloseAllPositions = () => {
    const total = positions.reduce((sum, position) => sum + parseFloat(position.unrealized_pl || '0'), 0);
    setTotalUnrealizedPL(total);
    setIsModalOpen(true);
  };

  const confirmCloseAllPositions = async () => {
    setIsLoading(true);
    setStatusMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/positions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cancel_orders: true }),
      });

      if (response.ok) {
        setStatusMessage('Successfully closed all positions.');
        setTimeout(() => {
          setIsModalOpen(false);
        }, 2000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to close positions.');
      }
    } catch (error) {
      setErrorMessage('An error occurred while closing positions.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-medium text-gray-700 mb-4">Positions</h2>
      <button
        onClick={handleCloseAllPositions}
        className="mb-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Close All Positions
      </button>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {positions.map((position) => (
                <PositionRow key={position.asset_id} position={position} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg text-center text-gray-500 py-4">
          No positions to display
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-md">
            <h3 className="text-lg font-medium mb-4">Close All Positions?</h3>
            <p className={totalUnrealizedPL < 0 ? 'text-red-600' : 'text-gray-900'}>
              Net Unrealised Gains/Losses: {formatCurrency(totalUnrealizedPL.toString())}
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
                    onClick={() => setIsModalOpen(false)}
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
