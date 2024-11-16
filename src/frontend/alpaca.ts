import { Position, AccountInfo, Order } from './types';

function convertToEasternTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

const API_BASE_URL = '/api';

export function formatCurrency(value: number): string {
  const formattedValue = value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  if (value < 0) {
    return `<span class="text-red-500">(${formattedValue.slice(1)})</span>`;
  }
  return formattedValue;
}

export function handleError(error: unknown) {
  console.error('Error in Alpaca Trading App:', error);
  const errorMessage = error instanceof Error ? error.message : String(error);

  let errorElement = document.getElementById('error-display');
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.id = 'error-display';
    errorElement.className = 'bg-alpaca-red text-white p-3 rounded mt-4';
    document.getElementById('app')?.appendChild(errorElement);
  }

  errorElement.textContent = `Error: ${errorMessage}`;
}

function updateAccountInfoElement(elementId: string, value: string) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  }
}

export async function fetchAccountInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/account`);
    const accountData: AccountInfo = await response.json();

    updateAccountInfoElement('accountId', accountData.id);
    updateAccountInfoElement('accountNumber', accountData.account_number);
    updateAccountInfoElement('cashBalance', formatCurrency(parseFloat(accountData.cash)));
    updateAccountInfoElement('buyingPower', formatCurrency(parseFloat(accountData.buying_power)));
  } catch (error) {
    handleError(error);
  }
}

export async function fetchBalance() {
  try {
    const response = await fetch(`${API_BASE_URL}/balance`);
    const data = await response.json();

    const balanceElement = document.getElementById('balanceValue');
    if (balanceElement) {
      balanceElement.textContent = formatCurrency(data.balance);
    }
  } catch (error) {
    handleError(error);
  }
}

export async function fetchPositions() {
  try {
    const response = await fetch(`${API_BASE_URL}/positions`);
    const positions: Position[] = await response.json();

    const positionsList = document.getElementById('positionsList');
    if (positionsList) {
      positionsList.innerHTML = positions
        .map(
          (position) => `
                <div class="flex justify-between items-center bg-gray-100 p-3 rounded">
                    <div>
                        <span class="font-bold">${position.symbol}</span>
                        <span class="text-gray-600 ml-2">${position.quantity} shares</span>
                    </div>
                    <div class="flex items-center">
                        <span class="mr-2">${formatCurrency(position.marketValue)}</span>
                        <button 
                            data-symbol="${position.symbol}" 
                            class="close-position bg-alpaca-red text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                            Close
                        </button>
                    </div>
                </div>
            `
        )
        .join('');

      document.querySelectorAll('.close-position').forEach((button) => {
        button.addEventListener('click', (e) => {
          const symbol = (e.target as HTMLButtonElement).dataset.symbol;
          closePosition(symbol);
        });
      });
    }
  } catch (error) {
    handleError(error);
  }
}

async function closePosition(symbol?: string) {
  if (!symbol) return;

  try {
    const response = await fetch(`${API_BASE_URL}/positions/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbol }),
    });

    const result = await response.json();

    if (result.success) {
      await Promise.all([fetchPositions(), fetchBalance(), fetchAccountInfo()]);
    } else {
      throw new Error(result.message || 'Failed to close position');
    }
  } catch (error) {
    handleError(error);
  }
}

export async function fetchOrders(status: 'open' | 'closed' | 'all' = 'open'): Promise<Order[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders?status=${status}`);

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    const orders: Order[] = await response.json();

    return orders;
  } catch (error) {
    handleError(error);
    return [];
  }
}

export async function cancelOrder(orderId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to cancel order');
    }

    return true;
  } catch (error) {
    handleError(error);
    return false;
  }
}

export function formatOrder(order: Order): string {
  const time = convertToEasternTime(order.created_at);
  const quantity = order.qty ? `${order.qty} shares` : order.notional ? `$${order.notional}` : 'N/A';

  return `
        <div class="flex justify-between items-center p-2 border-b last:border-b-0 hover:bg-gray-50 transition-colors">
            <div class="flex-1">
                <div class="font-semibold">${order.symbol} (${order.asset_class})</div>
                <div class="text-xs text-gray-500">${time}</div>
            </div>
            <div class="flex-1 text-center">
                <div>${order.side.toUpperCase()} ${order.type.toUpperCase()}</div>
                <div class="text-xs text-gray-500">${quantity}</div>
            </div>
            <div class="flex-1 text-right">
                <div class="text-sm ${order.status === 'new' ? 'text-blue-600' : 'text-green-600'}">
                    ${order.status.toUpperCase()}
                </div>
                ${
                  order.status === 'new'
                    ? `
                    <button 
                        data-order-id="${order.id}" 
                        class="cancel-order-btn text-xs text-red-500 hover:text-red-700 mt-1"
                    >
                        Cancel
                    </button>
                `
                    : ''
                }
            </div>
        </div>
    `;
}

export async function updateAllData() {
  try {
    const updateButton = document.getElementById('update-all-button');
    if (updateButton) {
      updateButton.classList.add('opacity-50', 'cursor-not-allowed');
      updateButton.setAttribute('disabled', 'true');
    }

    await Promise.all([fetchAccountInfo(), fetchBalance(), fetchPositions()]);
  } catch (error) {
    handleError(error);
  } finally {
    const updateButton = document.getElementById('update-all-button');
    if (updateButton) {
      updateButton.classList.remove('opacity-50', 'cursor-not-allowed');
      updateButton.removeAttribute('disabled');
    }
  }
}
