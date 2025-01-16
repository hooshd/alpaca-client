import React, { useState } from 'react';
import { Position, Order } from '../types';
import { formatCurrency } from '../utils/formatting';
import { useMarket } from '../context/MarketContext';

interface TradesProps {
  positions: Position[];
  orders: Order[];
  onClose: (position: Position) => void;
  onPatchOrder?: (orderId: string, data: { trail?: string }) => Promise<void>;
}

type SortField = 'symbol' | 'marketValue' | 'unrealizedPL' | 'trail' | 'targetPL';
type SortDirection = 'asc' | 'desc';

const activeOrderStatuses = [
  'new',
  'partially_filled',
  'accepted',
  'pending_new',
  'accepted_for_bidding',
  'calculated',
  'stopped'
];

const calculateTrailPrice = (order: Order) => {
  if (order.type !== 'trailing_stop' || !order.hwm) {
    return null;
  }

  const hwm = parseFloat(order.hwm);
  
  if (order.trail_percent) {
    const trailPercent = parseFloat(order.trail_percent);
    const trailPrice = (hwm * (1 - trailPercent / 100)).toFixed(2);
    return { price: trailPrice, percent: trailPercent };
  }
  
  if (order.trail_price) {
    const trailPrice = (hwm - parseFloat(order.trail_price)).toFixed(2);
    const trailPercent = ((parseFloat(order.trail_price) / hwm) * 100).toFixed(1);
    return { price: trailPrice, percent: parseFloat(trailPercent) };
  }

  return null;
};

export const Trades: React.FC<TradesProps> = ({ positions, orders, onClose, onPatchOrder }) => {
  const { isExtendedHours } = useMarket();
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const getLinkedOrder = (symbol: string) => {
    return orders?.find(order => 
      order.symbol === symbol && 
      activeOrderStatuses.includes(order.status.toLowerCase())
    );
  };

  const calculateTargetPL = (position: Position, trailPrice: string) => {
    const qty = parseFloat(position.qty);
    const entryPrice = parseFloat(position.avg_entry_price);
    const trail = parseFloat(trailPrice);
    return formatCurrency(((trail - entryPrice) * qty).toString());
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedPositions = () => {
    if (!sortField) return positions;

    return [...positions].sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;

      switch (sortField) {
        case 'symbol':
          return direction * a.symbol.localeCompare(b.symbol);
        case 'marketValue':
          return direction * (parseFloat(a.market_value) - parseFloat(b.market_value));
        case 'unrealizedPL':
          return direction * (parseFloat(a.unrealized_plpc) - parseFloat(b.unrealized_plpc));
        case 'trail': {
          const orderA = getLinkedOrder(a.symbol);
          const orderB = getLinkedOrder(b.symbol);
          const trailA = orderA ? parseFloat(orderA.trail_percent || '0') : 0;
          const trailB = orderB ? parseFloat(orderB.trail_percent || '0') : 0;
          return direction * (trailA - trailB);
        }
        case 'targetPL': {
          const orderA = getLinkedOrder(a.symbol);
          const orderB = getLinkedOrder(b.symbol);
          const trailInfoA = orderA ? calculateTrailPrice(orderA) : null;
          const trailInfoB = orderB ? calculateTrailPrice(orderB) : null;
          const targetPLA = trailInfoA ? parseFloat(calculateTargetPL(a, trailInfoA.price).replace(/[^0-9.-]+/g, '')) : 0;
          const targetPLB = trailInfoB ? parseFloat(calculateTargetPL(b, trailInfoB.price).replace(/[^0-9.-]+/g, '')) : 0;
          return direction * (targetPLA - targetPLB);
        }
        default:
          return 0;
      }
    });
  };

  const handleClosePosition = async (position: Position) => {
    try {
      if (isExtendedHours) {
        // For after-hours trading, submit a limit order
        const currentPrice = parseFloat(position.current_price);
        const orderSide = position.side === 'long' ? 'sell' : 'buy';
        const limitPrice = orderSide === 'sell' 
          ? (currentPrice * 0.99).toFixed(2) // 1% lower for sell orders
          : (currentPrice * 1.01).toFixed(2); // 1% higher for buy orders

        await fetch('/api/orders/create', {
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
            extendedHours: true
          }),
        });
      } else {
        // During regular hours, use market orders
        await fetch(`/api/positions/close/${position.symbol}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }
      onClose(position);
    } catch (error) {
      console.error('Error closing position:', error);
    }
  };

  const handleCreateTrailingStop = async (position: Position) => {
    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: position.symbol,
          qty: position.qty,  
          side: position.side === 'long' ? 'sell' : 'buy',
          type: 'trailing_stop',
          time_in_force: 'gtc',
          trail_percent: 4.0,  
          extended_hours: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create trailing stop order');
      }

      // Refresh orders after creating a new one
      if (onClose) {
        onClose(position);
      }
    } catch (error) {
      console.error('Error creating trailing stop order:', error);
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-medium text-gray-700 mb-4">Trades</h2>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('symbol')}
              >
                Symbol {sortField === 'symbol' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry Price</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
              <th 
                className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('marketValue')}
              >
                Market Value {sortField === 'marketValue' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('unrealizedPL')}
              >
                Unrealised P&L {sortField === 'unrealizedPL' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HWM</th>
              <th 
                className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('trail')}
              >
                Trail {sortField === 'trail' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('targetPL')}
              >
                Target P&L {sortField === 'targetPL' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {getSortedPositions().map((position) => {
              const linkedOrder = getLinkedOrder(position.symbol);
              const trailInfo = linkedOrder ? calculateTrailPrice(linkedOrder) : null;
              
              return (
                <tr key={position.asset_id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">{position.symbol}</td>
                  <td className="py-4 px-4">{position.qty}</td>
                  <td className="py-4 px-4">{formatCurrency(position.avg_entry_price)}</td>
                  <td className="py-4 px-4">{formatCurrency(position.current_price)}</td>
                  <td className="py-4 px-4">{formatCurrency(position.market_value)}</td>
                  <td className={`py-4 px-4 ${parseFloat(position.unrealized_pl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(position.unrealized_pl)}{' '}
                    <span>
                      ({parseFloat(position.unrealized_plpc) >= 0 ? '+' : ''}
                      {(parseFloat(position.unrealized_plpc) * 100).toFixed(1)}%)
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {linkedOrder?.hwm ? formatCurrency(linkedOrder.hwm) : '-'}
                  </td>
                  <td className="py-4 px-4">
                    {trailInfo ? 
                      `${trailInfo.percent}% (${formatCurrency(trailInfo.price)})` : 
                      '-'
                    }
                  </td>
                  <td className="py-4 px-4">
                    {trailInfo ? 
                      calculateTargetPL(position, trailInfo.price) :
                      '-'
                    }
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      {linkedOrder && onPatchOrder && linkedOrder.type === 'trailing_stop' && (
                        <button
                          onClick={() => {
                            const currentTrail = parseFloat(linkedOrder.trail_percent || '0');
                            const newTrail = Math.max(0.1, currentTrail - 0.5).toFixed(1);
                            onPatchOrder(linkedOrder.id, { trail: newTrail });
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Trim Trail 0.5%
                        </button>
                      )}
                      {!linkedOrder && (
                        <button
                          onClick={() => handleCreateTrailingStop(position)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Add T-Stop
                        </button>
                      )}
                      <button
                        onClick={() => handleClosePosition(position)}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors duration-300"
                      >
                        Close
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Trades;
