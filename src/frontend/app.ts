import { fetchBalance, fetchPositions, fetchAccountInfo, updateAllData } from './alpaca.js';
import { initializeMarketTime } from './marketTime.js';

async function initializeApp() {
  try {
    await Promise.all([fetchBalance(), fetchPositions(), fetchAccountInfo()]);
    const cleanup = initializeMarketTime();

    const updateButton = document.getElementById('update-all-button');
    if (updateButton) {
      updateButton.addEventListener('click', updateAllData);
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
