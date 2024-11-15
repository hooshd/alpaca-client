import { 
    fetchBalance, 
    fetchPositions, 
    fetchAccountInfo 
} from './alpaca.js';
import { initializeMarketTime } from './marketTime.js';

async function initializeApp() {
    try {
        await Promise.all([
            fetchBalance(),
            fetchPositions(),
            fetchAccountInfo(),
        ]);
        const cleanup = initializeMarketTime();
        
        // Cleanup on potential page unload
        window.addEventListener('beforeunload', cleanup);
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);

export {};  // Ensure this is a module
