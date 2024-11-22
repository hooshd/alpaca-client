let fetchPriceTimeout: number | null = null;

export const fetchLatestPrice = async (symbol: string): Promise<number | null> => {
  try {
    const response = await fetch(`/api/latest-price?symbol=${encodeURIComponent(symbol)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch the latest price');
    }
    const data = await response.json();
    return data.price;
  } catch (error) {
    console.error('Error fetching the latest price:', error);
    return null;
  }
};

// Function to update price and total order value in the modal
export const updateOrderPriceInfo = async (symbol: string, quantity: string | undefined) => {
  const latestPriceElement = document.getElementById('latest-price');
  const totalOrderValueElement = document.getElementById('total-order-value');

  if (!latestPriceElement || !totalOrderValueElement) return;

  try {
    // Fetch the latest price
    const price = await fetchLatestPrice(symbol);
    if (price === null) throw new Error('Failed to fetch the latest price');

    latestPriceElement.textContent = `$${price.toFixed(2)}`;

    // Calculate total order value if quantity is provided
    if (quantity) {
      const numericQuantity = parseFloat(quantity);
      const totalValue = price * numericQuantity;
      totalOrderValueElement.textContent = `$${totalValue.toFixed(2)}`;
    } else {
      totalOrderValueElement.textContent = 'N/A';
    }
  } catch (error) {
    console.error('Error updating price info:', error);
    latestPriceElement.textContent = 'Error';
    totalOrderValueElement.textContent = 'Error';
  }
};

// Setup price update on ticker input
export const setupPriceUpdates = (tickerInput: HTMLInputElement, limitPriceInput: HTMLInputElement) => {
  tickerInput.addEventListener('input', () => {
    const symbol = tickerInput.value.trim();
  
    if (fetchPriceTimeout) clearTimeout(fetchPriceTimeout);
  
    if (symbol.length === 0) {
      limitPriceInput.value = '';
      return;
    }
  
    fetchPriceTimeout = window.setTimeout(async () => {
      const price = await fetchLatestPrice(symbol.toUpperCase());
      if (price !== null) {
        limitPriceInput.value = price.toFixed(2); // Update limit price field
      }
    }, 1000); // Debounce delay
  });
};
