import React from 'react';
import { Position } from '../types';
import useLatestPrice from '../hooks/useLatestPrice';

interface PositionCardProps {
  position: Position;
}

const PositionCard: React.FC<PositionCardProps> = ({ position }) => {
  const { price: latestPrice, isLoading } = useLatestPrice(position.symbol);
  
  const calculateChange = () => {
    if (!latestPrice) return { value: 0, percentage: 0 };
    
    const currentValue = latestPrice * position.quantity;
    const change = currentValue - position.marketValue;
    const percentage = (change / position.marketValue) * 100;
    
    return { value: change, percentage };
  };

  const { value: changeValue, percentage: changePercentage } = calculateChange();
  const isPositive = changeValue >= 0;
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';

  // Safely format price with fallbacks
  const formatPrice = (price: number | undefined | null): string => {
    if (typeof price !== 'number') return '0.00';
    return price.toFixed(2);
  };

  const displayPrice = isLoading ? '...' : formatPrice(latestPrice || position.currentPrice);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{position.symbol}</h3>
          <p className="text-sm text-gray-600">{position.quantity} shares</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-medium">
            ${displayPrice}
          </p>
          <p className={`text-sm ${changeColor}`}>
            {isPositive ? '+' : ''}{changeValue.toFixed(2)} ({changePercentage.toFixed(2)}%)
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <div>Market Value:</div>
        <div className="text-right">${formatPrice(position.marketValue)}</div>
        <div>Current Price:</div>
        <div className="text-right">
          ${displayPrice}
        </div>
      </div>
    </div>
  );
};

interface PositionsProps {
  positions: Position[];
}

export const Positions: React.FC<PositionsProps> = ({ positions }) => {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-medium text-gray-700 mb-4">Positions</h2>
      <div className="space-y-4">
        {positions.length > 0 ? (
          positions.map((position) => (
            <PositionCard key={position.symbol} position={position} />
          ))
        ) : (
          <div className="text-center text-gray-500 py-4">
            No positions to display
          </div>
        )}
      </div>
    </section>
  );
};

export default Positions;
