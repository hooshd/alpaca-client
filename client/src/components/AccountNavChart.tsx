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
  const [period, setPeriod] = useState<string>('1M'); // Default period

  useEffect(() => {
    const fetchPortfolioHistory = async () => {
      try {
        const timeframe = period === '1D' ? '5Min' : '1H'; // Set timeframe based on period
        const response = await fetch(`/api/account/portfolio/history?period=${period}&timeframe=${timeframe}&intraday_reporting=market_hours`);
        if (!response.ok) throw new Error('Failed to fetch portfolio history');
        const data = await response.json();
        console.log('Fetched data:', data); // Debugging log
        const formattedData = data.timestamp.map((time: number, index: number) => ({
          time: new Date(time * 1000).toLocaleString('en-US', { timeZone: 'America/New_York' }),
          equity: data.equity[index],
        }));
        setChartData(formattedData);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPortfolioHistory();
  }, [period, refreshData]);

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`; // Format as dollar amount
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  if (error) return <div>Error fetching data: {error}</div>;

  return (
    <div className="w-full h-64 mb-16"> {/* Increased margin here */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium text-gray-700 mb-6">Account NAV Chart</h2>
        <div className="flex space-x-4">
          <button onClick={() => handlePeriodChange('1D')} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200">1D</button>
          <button onClick={() => handlePeriodChange('1W')} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200">1W</button>
          <button onClick={() => handlePeriodChange('1M')} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200">1M</button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            tickFormatter={(timeStr) => {
              const date = new Date(timeStr);
              return `${date.getDate()}/${date.getMonth() + 1}`; // d/m format
            }} 
          />
          <YAxis 
            tick={{ fontSize: 14, fill: '#4A90E2' }} // Increased font size
            tickFormatter={formatCurrency} // Use the currency formatter
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '8px' }} 
          />
          <Line type="monotone" dataKey="equity" stroke="#4A90E2" strokeWidth={2} /> {/* Increased line thickness */}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AccountNavChart;
