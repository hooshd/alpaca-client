export const setupTickerSearch = (
  tickerInput: HTMLInputElement,
  resultsContainer: HTMLDivElement
) => {
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

  // Input event handler with debounce
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
};
