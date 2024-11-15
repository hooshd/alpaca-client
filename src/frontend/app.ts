import { fetchBalance, fetchPositions, fetchAccountInfo, updateAllData } from './alpaca.js';
import { initializeMarketTime } from './marketTime.js';

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

// Function to update the last updated time
function updateLastUpdatedTime() {
  const lastUpdatedTimeElement = document.getElementById('last-updated-time');
  if (lastUpdatedTimeElement) {
    lastUpdatedTimeElement.textContent = formatUSEasternTime();
  }
}

async function initializeApp() {
  try {
    // Update last updated time on initial load
    updateLastUpdatedTime();

    await Promise.all([fetchBalance(), fetchPositions(), fetchAccountInfo()]);
    const cleanup = initializeMarketTime();

    const updateButton = document.getElementById('update-all-button');
    if (updateButton) {
      updateButton.addEventListener('click', async () => {
        await updateAllData();
        // Update last updated time after clicking update button
        updateLastUpdatedTime();
      });
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
