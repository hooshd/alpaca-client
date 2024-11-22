import { 
  fetchBalance, 
  fetchPositions, 
  fetchAccountInfo, 
  updateAllData
} from './alpaca.js';
import { initializeMarketTime } from './marketTime.js';
import { updateLastUpdatedTime } from './components/timeUtils.js';
import { fetchAndUpdateOrders, renderOrders } from './components/orderManager.js';
import { setupPriceUpdates } from './components/priceManager.js';
import { setupTickerSearch } from './components/tickerSearch.js';
import { setupFormHandling } from './components/formManager.js';

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

    // Setup form elements
    const tickerInput = document.getElementById('ticker') as HTMLInputElement;
    const resultsContainer = document.getElementById('ticker-results') as HTMLDivElement;
    const limitPriceInput = document.getElementById('limit-price') as HTMLInputElement;

    // Initialize components
    setupTickerSearch(tickerInput, resultsContainer);
    setupPriceUpdates(tickerInput, limitPriceInput);
    setupFormHandling();

    // Setup update button
    const updateButton = document.getElementById('update-all-button');
    if (updateButton) {
      updateButton.addEventListener('click', async () => {
        await updateAllData();
        await fetchAndUpdateOrders();
        updateLastUpdatedTime();
      });
    }

    // Add event listeners for order filter checkboxes
    const openCheckbox = document.getElementById('open-orders-checkbox');
    const closedCheckbox = document.getElementById('closed-orders-checkbox');

    if (openCheckbox && closedCheckbox) {
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
