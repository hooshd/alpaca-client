import React, { useState } from 'react';
import TickerSearch from './TickerSearch';

interface OrderFormData {
  symbol: string;
  side: 'buy' | 'sell';
  quantityType: 'qty' | 'notional';
  quantity: string;
  orderType: 'market' | 'limit';
  limitPrice?: string;
  extendedHours: boolean;
}

interface CreateOrderProps {
  onOrderSubmit: (order: OrderFormData) => Promise<void>;
}

export const CreateOrder: React.FC<CreateOrderProps> = ({ onOrderSubmit }) => {
  const [formData, setFormData] = useState<OrderFormData>({
    symbol: '',
    side: 'buy',
    quantityType: 'qty',
    quantity: '',
    orderType: 'market',
    limitPrice: '',
    extendedHours: false
  });

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [latestPrice, setLatestPrice] = useState<string>('Loading...');
  const [totalValue, setTotalValue] = useState<string>('Calculating...');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTickerSelect = (symbol: string) => {
    setFormData(prev => ({ ...prev, symbol }));
    // TODO: Fetch latest price for the selected symbol
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const handleConfirmOrder = async () => {
    try {
      await onOrderSubmit(formData);
      setShowConfirmation(false);
      // Reset form
      setFormData({
        symbol: '',
        side: 'buy',
        quantityType: 'qty',
        quantity: '',
        orderType: 'market',
        limitPrice: '',
        extendedHours: false
      });
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Failed to submit order. Please try again.');
    }
  };

  return (
    <section className="mb-8">
      <h2 className="text-xl font-medium text-gray-700 mb-6">Create Order</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Ticker Search */}
        <div>
          <label htmlFor="symbol" className="block text-sm font-medium text-gray-600 mb-2">
            Ticker
          </label>
          <TickerSearch onSelect={handleTickerSelect} />
        </div>

        {/* Side Select */}
        <div>
          <label htmlFor="side" className="block text-sm font-medium text-gray-600 mb-2">
            Side
          </label>
          <select
            id="side"
            name="side"
            value={formData.side}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>

        {/* Quantity Type Select */}
        <div>
          <label htmlFor="quantityType" className="block text-sm font-medium text-gray-600 mb-2">
            Quantity Type
          </label>
          <select
            id="quantityType"
            name="quantityType"
            value={formData.quantityType}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="qty">Shares</option>
            <option value="notional">Notional</option>
          </select>
        </div>

        {/* Quantity Input */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-600 mb-2">
            Quantity / Notional Value
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Order Type Select */}
        <div>
          <label htmlFor="orderType" className="block text-sm font-medium text-gray-600 mb-2">
            Order Type
          </label>
          <select
            id="orderType"
            name="orderType"
            value={formData.orderType}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="market">Market</option>
            <option value="limit">Limit</option>
          </select>
        </div>

        {/* Limit Price Input */}
        <div>
          <label htmlFor="limitPrice" className="block text-sm font-medium text-gray-600 mb-2">
            Limit Price
          </label>
          <input
            type="number"
            id="limitPrice"
            name="limitPrice"
            value={formData.limitPrice}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            disabled={formData.orderType !== 'limit'}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
          />
        </div>

        {/* Extended Hours Checkbox */}
        <div className="col-span-1 sm:col-span-2 flex items-center">
          <input
            type="checkbox"
            id="extendedHours"
            name="extendedHours"
            checked={formData.extendedHours}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
          />
          <label htmlFor="extendedHours" className="ml-2 text-sm text-gray-600">
            Extended Hours Trading
          </label>
        </div>

        {/* Submit Button */}
        <div className="col-span-1 sm:col-span-2">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300"
          >
            Create Order
          </button>
        </div>
      </form>

      {/* Order Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full">
            <h2 className="text-2xl font-semibold mb-6">Confirm Order</h2>
            <div className="mb-6">
              <p><strong>Symbol:</strong> {formData.symbol}</p>
              <p><strong>Side:</strong> {formData.side.toUpperCase()}</p>
              <p><strong>Type:</strong> {formData.orderType.toUpperCase()}</p>
              <p><strong>{formData.quantityType === 'qty' ? 'Quantity' : 'Notional Value'}:</strong> {formData.quantity}</p>
              {formData.orderType === 'limit' && (
                <p><strong>Limit Price:</strong> ${formData.limitPrice}</p>
              )}
            </div>
            <div className="mb-6 text-gray-700">
              <p><strong>Latest Price:</strong> {latestPrice}</p>
              <p><strong>Total Order Value:</strong> {totalValue}</p>
              <p className="text-sm text-gray-500 italic">
                Executed price may vary depending on the type of order.
              </p>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOrder}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CreateOrder;
