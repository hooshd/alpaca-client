import React, { useState, useEffect, useRef } from 'react';

interface TickerResult {
  '1. symbol': string;
  '2. name': string;
}

interface TickerSearchProps {
  onSelect: (symbol: string) => void;
}

export const TickerSearch: React.FC<TickerSearchProps> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TickerResult[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchTickerSuggestions = async (searchQuery: string) => {
    try {
      const response = await fetch(`/api/ticker-suggestions?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch ticker suggestions');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching ticker suggestions:', error);
      return [];
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (value.trim().length === 0) {
      setResults([]);
      setIsVisible(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      const searchResults = await fetchTickerSuggestions(value);
      setResults(searchResults);
      setIsVisible(true);
    }, 300);
  };

  const handleResultClick = (result: TickerResult) => {
    setQuery(result['1. symbol']);
    onSelect(result['1. symbol']);
    setIsVisible(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="Enter ticker symbol"
        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
      />
      {isVisible && results.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-2 max-h-48 overflow-y-auto shadow-lg">
          {results.map((result, index) => (
            <div
              key={index}
              onClick={() => handleResultClick(result)}
              className="px-4 py-2 cursor-pointer hover:bg-gray-200"
            >
              <strong>{result['1. symbol']}</strong> - {result['2. name']}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TickerSearch;
