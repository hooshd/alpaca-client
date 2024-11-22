import { 
  fetchBalance, 
  fetchPositions, 
  fetchAccountInfo, 
  updateAllData, 
  fetchOrders, 
  formatOrder, 
  handleError,
  cancelOrder 
} from './alpaca.js';
import { initializeMarketTime } from './marketTime.js';
import { Order } from './types.js';
import { CreateOrderRequest } from '../backend/types';

// Store orders in memory
let cachedOrders: Order[] = [];

// Define order status arrays
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

// Function to format time in US Eastern Time
function formatUSEasternTime(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
}

// Function to get US Eastern Time as Date
function getUSEasternTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
}

// Function to update the last updated time
function updateLastUpdatedTime() {
  const lastUpdatedTimeElement = document.getElementById('last-updated-time');
  if (lastUpdatedTimeElement) {
    const now = getUSEasternTime();
    lastUpdatedTimeElement.textContent = formatUSEasternTime(now);
    lastUpdatedTimeElement.setAttribute('data-last-updated', now.toISOString());
  }
}

// Function to fetch orders from the backend
async function fetchAndUpdateOrders() {
  try {
    cachedOrders = await fetchOrders('all');
    await renderOrders();
  } catch (error) {
    handleError(error);
  }
}

// Order filtering and rendering
async function renderOrders() {
  try {
    const openCheckbox = document.getElementById('open-orders-checkbox') as HTMLInputElement;
    const closedCheckbox = document.getElementById('closed-orders-checkbox') as HTMLInputElement;
    console.log(`Change in checkbox status: Open: ${openCheckbox.checked}, Closed: ${closedCheckbox.checked}`);
    const ordersList = document.getElementById('ordersList');

    if (!ordersList || !openCheckbox || !closedCheckbox) return;

    // If neither checkbox is checked, show no orders
    if (!openCheckbox.checked && !closedCheckbox.checked) {
      console.log('No orders to display');
      ordersList.innerHTML = '<div class="p-4 text-center text-gray-500">No orders to display</div>';
      return;
    }

    // Filter orders based on checkbox states using cached orders
    const filteredOrders = cachedOrders.filter(order => {
      if (openCheckbox.checked && openStatuses.includes(order.status)) return true;
      if (closedCheckbox.checked && closedStatuses.includes(order.status)) return true;
      return false;
    });

    console.log(`Filtered orders: ${filteredOrders.length}`);

    // Render filtered orders
    ordersList.innerHTML = filteredOrders.length 
      ? filteredOrders.map(formatOrder).join('')
      : '<div class="p-4 text-center text-gray-500">No orders to display</div>';

    // Add event listeners for cancel order buttons
    document.querySelectorAll('.cancel-order-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const orderId = (e.target as HTMLButtonElement).dataset.orderId;
        if (orderId) {
          await cancelOrder(orderId);
          await fetchAndUpdateOrders(); // Refresh orders after cancellation
        }
      });
    });
  } catch (error) {
    handleError(error);
  }
}

// Order submission function
async function submitOrder(orderData: CreateOrderRequest) {
  try {
    const response = await fetch('/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (response.ok) {
      // Order successful
      alert(`Order created successfully! Order ID: ${result.id}`);
      
      // Refresh orders list
      await fetchAndUpdateOrders();
      
      // Reset form
      const orderForm = document.getElementById('order-form') as HTMLFormElement;
      orderForm.reset();
      
      // Hide modal
      const orderConfirmationModal = document.getElementById('order-confirmation-modal') as HTMLDivElement;
      orderConfirmationModal.classList.add('hidden');
    } else {
      // Handle error
      throw new Error(result.message || 'Failed to create order');
    }
  } catch (error) {
    handleError(error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const tickerInput = document.getElementById('ticker') as HTMLInputElement;
  const resultsContainer = document.getElementById('ticker-results') as HTMLDivElement;

  let searchTimeout: number | null = null;

  const fetchTickerSuggestions = async (query: string) => {
    try {
        const response = await fetch(`/api/ticker-suggestions?query=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch ticker suggestions');
        }
        const results = await response.json();
        return results;
    } catch (error) {
        console.error('Error fetching ticker suggestions:', error);
        return [];
    }
};


  const renderResults = (results: any[]) => {
    if (results.length === 0) {
      resultsContainer.classList.add('hidden');
      return;
    }

    resultsContainer.innerHTML = results
      .map(
        (result) => `
          <div class="px-4 py-2 cursor-pointer hover:bg-gray-200" data-symbol="${result['1. symbol']}" data-name="${result['2. name']}">
            <strong>${result['1. symbol']}</strong> - ${result['2. name']}
          </div>
        `
      )
      .join('');

    resultsContainer.classList.remove('hidden');

    // Add click event listeners to suggestions
    Array.from(resultsContainer.children).forEach((child) => {
      child.addEventListener('click', (event: Event) => {
        const target = event.currentTarget as HTMLDivElement;
        tickerInput.value = target.getAttribute('data-symbol') || '';
        resultsContainer.classList.add('hidden'); // Hide results after selection
      });
    });
  };

  tickerInput.addEventListener('input', () => {
    const query = tickerInput.value.trim();
    if (searchTimeout) clearTimeout(searchTimeout);

    if (query.length === 0) {
      resultsContainer.classList.add('hidden');
      return;
    }

    searchTimeout = window.setTimeout(async () => {
      const results = await fetchTickerSuggestions(query);
      renderResults(results);
    }, 300); // Debounce API calls
  });

  // Hide results if clicked outside
  document.addEventListener('click', (event) => {
    if (!resultsContainer.contains(event.target as Node) && event.target !== tickerInput) {
      resultsContainer.classList.add('hidden');
    }
  });
});

async function initializeApp() {
  try {
    // Update last updated time on initial load
    updateLastUpdatedTime();

    // Initial data fetch
    await Promise.all([
      fetchBalance(), 
      fetchPositions(), 
      fetchAccountInfo(),
      fetchAndUpdateOrders() // Initial order fetch
    ]);
    const cleanup = initializeMarketTime();

    // Order form setup
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
      const orderType = (document.getElementById('order-type') as HTMLSelectElement).value as 'market' | 'limit';
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

      // Add qty or notional based on selection
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

    const updateButton = document.getElementById('update-all-button');
    if (updateButton) {
      updateButton.addEventListener('click', async () => {
        await updateAllData();
        await fetchAndUpdateOrders(); // Fetch fresh orders on update
        updateLastUpdatedTime();
      });
    }

    // Add event listeners for order filter checkboxes
    const openCheckbox = document.getElementById('open-orders-checkbox');
    const closedCheckbox = document.getElementById('closed-orders-checkbox');

    if (openCheckbox && closedCheckbox) {
      // Add input event listeners to catch all changes including programmatic ones
      openCheckbox.addEventListener('input', () => renderOrders());
      closedCheckbox.addEventListener('input', () => renderOrders());
    }

    // Cleanup on potential page unload
    window.addEventListener('beforeunload', cleanup);
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);

export {}; // Ensure this is a module
