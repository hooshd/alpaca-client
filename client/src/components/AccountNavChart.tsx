import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useAlpaca } from '../context/AlpacaContext';

interface ChartData {
  time: string;
  equity: number;
}

const AccountNavChart = () => {
  const { refreshData, error } = useAlpaca();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [period, setPeriod] = useState<string>('1D'); // Default period

  // Filter data points to 30-minute intervals for 1D view
  const filterDataPoints = (data: ChartData[]) => {
    if (period !== '1D') return data;
    
    return data.filter((_, index) => index % 6 === 0); // Every 6th point (30 min intervals)
  };

  useEffect(() => {
    const fetchPortfolioHistory = async () => {
      try {
        const timeframe = period === '1D' ? '5Min' : '1H'; // Set timeframe based on period
        const response = await fetch(`/api/account/portfolio/history?period=${period}&timeframe=${timeframe}&intraday_reporting=market_hours`);
        if (!response.ok) throw new Error('Failed to fetch portfolio history');
        const data = await response.json();
        console.log('Fetched data:', data); // Debugging log
        let formattedData = data.timestamp.map((time: number, index: number) => ({
          time: new Date(time * 1000).toLocaleString('en-US', { timeZone: 'America/New_York' }),
          equity: data.equity[index],
        }));
        
        // Apply data filtering for 1D view
        formattedData = filterDataPoints(formattedData);
        
        setChartData(formattedData);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPortfolioHistory();
  }, [period, refreshData]);

  const formatCurrency = (value: number, full: boolean = false) => {
    if (full) {
      return `$${value.toLocaleString()}`; // Full format
    }
    // Compact format
    const absValue = Math.abs(value);
    if (absValue >= 1e3 && absValue < 1e6) {
      return `$${(value / 1e3).toFixed(0)}K`; // e.g., "$25K"
    } else if (absValue >= 1e6) {
      return `$${(value / 1e6).toFixed(0)}M`; // e.g., "$2M"
    }
    return value.toString(); // Return as is for values less than 1K
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  const calculateYAxisDomain = () => {
    if (chartData.length === 0) return [0, 100];
    
    const values = chartData.map(data => data.equity);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    // Add 10% padding above and below
    const padding = range * 0.1;
    let lowerBound = Math.floor((min - padding) / 1000) * 1000;
    let upperBound = Math.ceil((max + padding) / 1000) * 1000;
    
    // Ensure minimum range of 3000 for readability
    if (upperBound - lowerBound < 3000) {
      const midPoint = (upperBound + lowerBound) / 2;
      lowerBound = Math.floor(midPoint - 1500);
      upperBound = Math.ceil(midPoint + 1500);
    }
    
    return [lowerBound, upperBound];
  };

  const yAxisDomain = calculateYAxisDomain();

  if (error) return <div>Error fetching data: {error}</div>;

  return (
    <div className="w-full h-64 mb-16"> {/* Increased margin here */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium text-gray-700 mb-6">Account NAV Chart</h2>
        <div className="flex space-x-4">
          <button 
            onClick={() => handlePeriodChange('1D')} 
            className={`px-4 py-2 rounded transition duration-200 ${
              period === '1D' 
                ? 'bg-blue-700 text-white shadow-inner shadow-blue-900' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >1D</button>
          <button 
            onClick={() => handlePeriodChange('1W')} 
            className={`px-4 py-2 rounded transition duration-200 ${
              period === '1W' 
                ? 'bg-blue-700 text-white shadow-inner shadow-blue-900' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >1W</button>
          <button 
            onClick={() => handlePeriodChange('1M')} 
            className={`px-4 py-2 rounded transition duration-200 ${
              period === '1M' 
                ? 'bg-blue-700 text-white shadow-inner shadow-blue-900' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >1M</button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            tickFormatter={(timeStr) => {
              const date = new Date(timeStr);
              if (period === '1D') {
                return date.toLocaleTimeString('en-US', { 
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true 
                });
              }
              return `${date.getDate()}/${date.getMonth() + 1}`; // d/m format
            }}
            interval={period === '1D' ? 5 : 'preserveStartEnd'} // Show fewer ticks for 1D view
          />
          <YAxis 
            domain={yAxisDomain as [number, number]}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '8px' }} 
            formatter={(value: string | number | (string | number)[]) => {
              const numValue = Array.isArray(value) ? Number(value[0]) : Number(value);
              return [formatCurrency(numValue, true), 'Equity'];
            }}
          />
          <Line 
            type="monotone" 
            dataKey="equity" 
            stroke="#4A90E2" 
            strokeWidth={2} 
            dot={period === '1D'} // Only show dots in 1D view
            label={period === '1D' ? { 
              position: 'top', 
              formatter: (value: number) => formatCurrency(value),
              fontSize: 10
            } : false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AccountNavChart;
