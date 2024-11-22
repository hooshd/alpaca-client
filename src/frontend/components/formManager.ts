import { CreateOrderRequest } from '../../backend/types';
import { submitOrder } from './orderManager.js';
import { updateOrderPriceInfo } from './priceManager.js';

export const setupFormHandling = () => {
  const orderForm = document.getElementById('order-form') as HTMLFormElement;
  const orderTypeSelect = document.getElementById('order-type') as HTMLSelectElement;
  const limitPriceInput = document.getElementById('limit-price') as HTMLInputElement;
  const extendedHoursCheckbox = document.getElementById('extended-hours') as HTMLInputElement;
  const quantityTypeSelect = document.getElementById('quantity-type') as HTMLSelectElement;
  const orderConfirmationModal = document.getElementById('order-confirmation-modal') as HTMLDivElement;
  const orderConfirmationDetails = document.getElementById('order-confirmation-details') as HTMLDivElement;
  const confirmOrderBtn = document.getElementById('confirm-order-btn') as HTMLButtonElement;
  const cancelOrderBtn = document.getElementById('cancel-order-btn') as HTMLButtonElement;

  let pendingOrderData: CreateOrderRequest | null = null;

  // Dynamic form behavior
  orderTypeSelect.addEventListener('change', () => {
    const isLimitOrder = orderTypeSelect.value === 'limit';
    limitPriceInput.disabled = !isLimitOrder;
    limitPriceInput.classList.toggle('bg-gray-200', !isLimitOrder);
    
    extendedHoursCheckbox.disabled = !isLimitOrder;
    if (!isLimitOrder) {
      extendedHoursCheckbox.checked = false;
    }
  });

  // Quantity type behavior
  quantityTypeSelect.addEventListener('change', () => {
    const quantityInput = document.getElementById('quantity') as HTMLInputElement;
    quantityInput.placeholder = quantityTypeSelect.value === 'qty' 
      ? 'Number of shares' 
      : 'Dollar amount';
  });

  // Order form submission
  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const ticker = (document.getElementById('ticker') as HTMLInputElement).value.toUpperCase();
    const side = (document.getElementById('side') as HTMLSelectElement).value as 'buy' | 'sell';
    const quantityType = (document.getElementById('quantity-type') as HTMLSelectElement).value;
    const quantity = (document.getElementById('quantity') as HTMLInputElement).value;
    const orderType = (document.getElementById('order-type') as HTMLSelectElement).value as 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
    const limitPrice = (document.getElementById('limit-price') as HTMLInputElement).value;
    const extendedHours = (document.getElementById('extended-hours') as HTMLInputElement).checked;
  
    // Prepare order data
    const orderData: CreateOrderRequest = {
      symbol: ticker,
      side: side,
      type: orderType,
      time_in_force: 'day', // Default to day order
      extended_hours: extendedHours
    };
  
    // Add `qty` or `notional` based on selection
    if (quantityType === 'qty') {
      orderData.qty = quantity;
    } else {
      orderData.notional = quantity;
    }
  
    // Add limit price for limit orders
    if (orderType === 'limit' && limitPrice) {
      orderData.limit_price = limitPrice;
    }
  
    // Show confirmation modal
    pendingOrderData = orderData;
    orderConfirmationDetails.innerHTML = `
      <p><strong>Symbol:</strong> ${orderData.symbol}</p>
      <p><strong>Side:</strong> ${orderData.side}</p>
      <p><strong>Type:</strong> ${orderData.type}</p>
      ${orderData.qty ? `<p><strong>Quantity:</strong> ${orderData.qty} shares</p>` : ''}
      ${orderData.notional ? `<p><strong>Notional Value:</strong> $${orderData.notional}</p>` : ''}
      ${orderData.limit_price ? `<p><strong>Limit Price:</strong> $${orderData.limit_price}</p>` : ''}
      <p><strong>Extended Hours:</strong> ${orderData.extended_hours ? 'Yes' : 'No'}</p>
    `;
    orderConfirmationModal.classList.remove('hidden');
  
    // Fetch the latest price and calculate total value
    await updateOrderPriceInfo(ticker, quantityType === 'qty' ? orderData.qty : '');
  });

  // Confirm order
  confirmOrderBtn.addEventListener('click', async () => {
    if (!pendingOrderData) return;
    await submitOrder(pendingOrderData);
    pendingOrderData = null;
  });

  // Cancel order
  cancelOrderBtn.addEventListener('click', () => {
    orderConfirmationModal.classList.add('hidden');
    pendingOrderData = null;
  });
};
