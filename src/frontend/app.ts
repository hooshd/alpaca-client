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
