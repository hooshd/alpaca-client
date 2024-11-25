import React from 'react';
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
  return (
    <div className="mb-8">
      <h2 className="text-xl font-medium text-gray-700 mb-4">Positions</h2>
      {positions.length > 0 ? (
        <div className="overflow-x-auto">
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
        <div className="text-center text-gray-500 py-4">
          No positions to display
        </div>
      )}
    </div>
  );
};

export default Positions;
