import React, { useState, useEffect } from 'react';
import TickerSearch from './TickerSearch';
import useLatestPrice from '../hooks/useLatestPrice';

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
  const [modalMessage, setModalMessage] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  
  // Use the latest price hook
  const { price: latestPrice, isLoading: isPriceLoading, error: priceError } = useLatestPrice(formData.symbol);

  // Calculate total value
  const calculateTotalValue = (): string => {
    if (!latestPrice || !formData.quantity) return 'N/A';
    
    if (formData.quantityType === 'qty') {
      const total = latestPrice * parseFloat(formData.quantity);
      return `$${total.toFixed(2)}`;
    } else {
      // For notional orders, the quantity is the dollar amount
      return `$${parseFloat(formData.quantity).toFixed(2)}`;
    }
  };

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
  };

  const validateForm = (): string | null => {
    if (!formData.symbol) return 'Symbol is required';
    if (!formData.quantity) return 'Quantity is required';
    if (parseFloat(formData.quantity) <= 0) return 'Quantity must be greater than 0';
    if (formData.orderType === 'limit' && (!formData.limitPrice || parseFloat(formData.limitPrice) <= 0)) {
      return 'Valid limit price is required for limit orders';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setModalMessage(validationError);
      setIsError(true);
      setShowConfirmation(true);
      return;
    }

    // Reset error state and message when showing confirmation
    setIsError(false);
    setModalMessage('');
    setShowConfirmation(true);
  };

  const handleConfirmOrder = async () => {
    try {
      await onOrderSubmit(formData);
      setModalMessage('Order placed successfully!');
      setIsError(false);
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
      setModalMessage(`Failed to submit order: ${(error as Error).message || 'Please try again.'}`);
      setIsError(true);
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
            <h2 className="text-2xl font-semibold mb-6">
              {isError ? 'Order Error' : 'Confirm Order'}
            </h2>
            {!isError && (
              <div className="mb-6">
                <p><strong>Symbol:</strong> {formData.symbol}</p>
                <p><strong>Side:</strong> {formData.side.toUpperCase()}</p>
                <p><strong>Type:</strong> {formData.orderType.toUpperCase()}</p>
                <p><strong>{formData.quantityType === 'qty' ? 'Quantity' : 'Notional Value'}:</strong> {formData.quantity}</p>
                {formData.orderType === 'limit' && (
                  <p><strong>Limit Price:</strong> ${formData.limitPrice}</p>
                )}
              </div>
            )}
            {!isError && (
              <div className="mb-6 text-gray-700">
                <p>
                  <strong>Latest Price:</strong>{' '}
                  {isPriceLoading ? 'Loading...' : 
                   priceError ? 'Error fetching price' :
                   latestPrice ? `$${latestPrice.toFixed(2)}` : 'N/A'}
                </p>
                <p><strong>Total Order Value:</strong> {calculateTotalValue()}</p>
                <p className="text-sm text-gray-500 italic mt-2">
                  {formData.orderType === 'market' 
                    ? 'Market orders may execute at a different price due to market conditions.'
                    : 'Limit orders will only execute at the specified price or better.'}
                </p>
              </div>
            )}
            {modalMessage && (
              <div className={`mb-6 ${isError ? 'text-red-600' : 'text-green-600'}`}>
                <p>{modalMessage}</p>
              </div>
            )}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setModalMessage('');
                  setIsError(false);
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                {isError ? 'Close' : 'Cancel'}
              </button>
              {!isError && (
                <button
                  onClick={handleConfirmOrder}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Confirm
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CreateOrder;
