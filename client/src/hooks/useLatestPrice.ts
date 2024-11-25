import { useState, useEffect } from 'react';

export const useLatestPrice = (symbol: string) => {
  const [price, setPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestPrice = async (symbol: string): Promise<number | null> => {
    try {
      const response = await fetch(`/api/latest-price?symbol=${encodeURIComponent(symbol)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch the latest price');
      }
      const data = await response.json();
      return data.results.p; // Updated to match the API response structure
    } catch (error) {
      console.error('Error fetching the latest price:', error);
      throw error;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchPrice = async () => {
      if (!symbol) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const latestPrice = await fetchLatestPrice(symbol);
        if (isMounted) {
          setPrice(latestPrice);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch price');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPrice();

    // Refresh price every 5 seconds
    const interval = setInterval(fetchPrice, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [symbol]);

  return { price, isLoading, error };
};

export default useLatestPrice;
