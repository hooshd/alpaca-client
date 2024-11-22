import { Order } from '../types.js';
import { formatOrder, fetchOrders, cancelOrder, handleError } from '../alpaca.js';

// Define order status arrays
export const openStatuses = [
  'new',
  'partially_filled',
  'done_for_day',
  'accepted',
  'pending_new',
  'accepted_for_bidding',
  'stopped',
  'calculated'
];

export const closedStatuses = [
  'canceled',
  'expired',
  'replaced',
  'pending_cancel',
  'pending_replace',
  'rejected',
  'suspended'
];

// Store orders in memory
let cachedOrders: Order[] = [];

// Function to fetch orders from the backend
export async function fetchAndUpdateOrders() {
  try {
    cachedOrders = await fetchOrders('all');
    await renderOrders();
  } catch (error) {
    handleError(error);
  }
}

// Order filtering and rendering
export async function renderOrders() {
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
export async function submitOrder(orderData: any) {
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
