import React, { useState, useEffect } from 'react';
import { Order } from '../types';

interface OrdersProps {
  orders: Order[];
  onCancelOrder: (orderId: string) => Promise<void>;
  onRefreshOrders: () => Promise<void>;
}

const openStatuses = [
  'new',
  'partially_filled',
  'done_for_day',
  'accepted',
  'pending_new',
  'accepted_for_bidding',
  'stopped',
  'calculated'
];

const closedStatuses = [
  'canceled',
  'expired',
  'replaced',
  'pending_cancel',
  'pending_replace',
  'rejected',
  'suspended'
];

export const Orders: React.FC<OrdersProps> = ({ orders, onCancelOrder, onRefreshOrders }) => {
  const [showOpen, setShowOpen] = useState(true);
  const [showClosed, setShowClosed] = useState(true);

  const filteredOrders = orders.filter(order => {
    if (showOpen && openStatuses.includes(order.status)) return true;
    if (showClosed && closedStatuses.includes(order.status)) return true;
    return false;
  });

  const formatOrder = (order: Order) => {
    const isOpen = openStatuses.includes(order.status);
    const statusClass = isOpen ? 'bg-green-100' : 'bg-gray-100';
    const quantityDisplay = order.qty ? `${order.qty} shares` : `$${order.notional}`;

    return (
      <div key={order.id} className={`p-4 border-b border-gray-200 ${statusClass}`}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="font-semibold">{order.symbol}</span>
            <span className="ml-2 text-sm text-gray-600">
              {order.side.toUpperCase()} {quantityDisplay}
            </span>
          </div>
          {isOpen && (
            <button
              onClick={() => onCancelOrder(order.id)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Cancel
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div>Type: {order.type.toUpperCase()}</div>
          <div>Status: {order.status.replace(/_/g, ' ').toUpperCase()}</div>
          {order.filled_qty && (
            <>
              <div>Filled: {order.filled_qty}</div>
              <div>Avg Price: ${order.filled_avg_price}</div>
            </>
          )}
          <div className="col-span-2">
            Created: {new Date(order.created_at).toLocaleString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium text-gray-700">Orders</h2>
        <div className="flex space-x-4">
          <label className="inline-flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showOpen}
              onChange={(e) => setShowOpen(e.target.checked)}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <span className="ml-2">Open</span>
          </label>
          <label className="inline-flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showClosed}
              onChange={(e) => setShowClosed(e.target.checked)}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <span className="ml-2">Closed</span>
          </label>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
        {filteredOrders.length > 0 ? (
          filteredOrders.map(formatOrder)
        ) : (
          <div className="p-4 text-center text-gray-500">No orders to display</div>
        )}
      </div>
    </section>
  );
};

export default Orders;