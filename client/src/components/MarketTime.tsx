import React, { useEffect, useState } from 'react';
import { 
  MarketHoursCalculator, 
  getUSEasternTime, 
  formatTime 
} from '../utils/marketTime';

interface MarketTimeProps {
  lastUpdated?: Date;
}

export const MarketTime: React.FC<MarketTimeProps> = ({ lastUpdated }) => {
  const [currentTime, setCurrentTime] = useState(getUSEasternTime());
  const [marketStatus, setMarketStatus] = useState(MarketHoursCalculator.determineMarketStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = getUSEasternTime();
      setCurrentTime(now);
      setMarketStatus(MarketHoursCalculator.determineMarketStatus(now));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-600';
      case 'EXTENDED':
        return 'bg-yellow-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <div className="text-xl font-semibold text-gray-800 mb-4">
        Market Time: {formatTime(currentTime)}
      </div>
      <div className={`px-4 py-2 rounded-full text-white font-medium ${getStatusColor(marketStatus.status)} inline-block`}>
        The market is: {marketStatus.status}
      </div>
      <div className="text-sm text-gray-500 mt-4">
        {marketStatus.nextStatus}
      </div>
    </section>
  );
};

export default MarketTime;
