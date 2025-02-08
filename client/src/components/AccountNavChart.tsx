import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LabelProps } from 'recharts';
import { useAlpaca } from '../context/AlpacaContext';

interface ChartData {
  time: string;
  equity: number;
}

const AccountNavChart = () => {
  const { refreshData, error } = useAlpaca();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [period, setPeriod] = useState<string>('1D'); // Default period

  const smoothData = (data: ChartData[]) => {
    if (data.length < 2) return data;

    const smoothed = [data[0]];
    for (let i = 1; i < data.length; i++) {
      const prev = smoothed[i - 1];
      const curr = data[i];
      smoothed.push({
        time: curr.time,
        equity: (prev.equity + curr.equity) / 2,
      });
    }
    return smoothed;
  };

  useEffect(() => {
    const fetchPortfolioHistory = async () => {
      try {
        const timeframe = period === '1D' ? '1Min' : '1H'; // Changed to 1Min for 1D view
        const response = await fetch(`/api/account/portfolio/history?period=${period}&timeframe=${timeframe}&intraday_reporting=market_hours`);
        if (!response.ok) throw new Error('Failed to fetch portfolio history');
        const data = await response.json();
        let formattedData = data.timestamp.map((time: number, index: number) => ({
          time: new Date(time * 1000).toLocaleString('en-US', { timeZone: 'America/New_York' }),
          equity: data.equity[index],
        }));
        
        // Apply smoothing for 1D view
        if (period === '1D') {
          formattedData = smoothData(formattedData);
        }
        
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
    <div className="w-full h-64 mb-16">
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
              return `${date.getDate()}/${date.getMonth() + 1}`;
            }}
            interval={period === '1D' ? 5 : 'preserveStartEnd'}
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
            dot={false}
            label={{
              position: 'right',
              content: (props: LabelProps) => {
                const { x, y, value } = props;
                const lastPoint = chartData[chartData.length - 1];
                if (lastPoint && value === lastPoint.equity && typeof x === 'number' && typeof y === 'number') {
                  return (
                    <text x={x} y={y} dy={-10} fill="#4A90E2" fontSize={12} textAnchor="middle">
                      {formatCurrency(value)}
                    </text>
                  );
                }
                return null;
              }
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AccountNavChart;
