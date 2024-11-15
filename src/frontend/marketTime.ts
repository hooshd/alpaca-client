export function getUSEasternTime(): Date {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
}

export function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
}

export function calculateTimeAgo(lastUpdatedTime: Date): string {
    const now = getUSEasternTime();
    const diffMs = now.getTime() - lastUpdatedTime.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
        return `${diffSeconds} second${diffSeconds !== 1 ? 's' : ''} ago`;
    } else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
}

export function determineMarketStatus(time: Date): { 
    status: 'OPEN' | 'EXTENDED' | 'CLOSED', 
    nextStatus: string 
} {
    const day = time.getDay();
    const hour = time.getHours();
    const minute = time.getMinutes();

    // Market hours: 9:30 AM to 4:00 PM Eastern Time on weekdays
    if (day === 0 || day === 6) {
        // Weekend
        return {
            status: 'CLOSED',
            nextStatus: 'Next open on Monday at 9:30 AM ET'
        };
    }

    const currentTimeInMinutes = hour * 60 + minute;
    const marketOpenTime = 9 * 60 + 30;  // 9:30 AM
    const marketCloseTime = 16 * 60;     // 4:00 PM
    const preMarketOpenTime = 4 * 60;    // 4:00 AM
    const postMarketCloseTime = 20 * 60; // 8:00 PM

    if (currentTimeInMinutes >= marketOpenTime && currentTimeInMinutes < marketCloseTime) {
        return {
            status: 'OPEN',
            nextStatus: 'Extended hours begin at 4:00 PM ET'
        };
    }

    if (
        (currentTimeInMinutes >= preMarketOpenTime && currentTimeInMinutes < marketOpenTime) ||
        (currentTimeInMinutes >= marketCloseTime && currentTimeInMinutes < postMarketCloseTime)
    ) {
        return {
            status: 'EXTENDED',
            nextStatus: currentTimeInMinutes < marketOpenTime 
                ? 'Market opens at 9:30 AM ET' 
                : 'Market closes at 8:00 PM ET'
        };
    }

    return {
        status: 'CLOSED',
        nextStatus: 'Next open at 9:30 AM ET tomorrow'
    };
}

export function initializeMarketTime() {
    function updateMarketTimeAndStatus() {
        const now = getUSEasternTime();
        const marketTimeBlockElement = document.getElementById('market-time-block');
        const marketStatusElement = document.getElementById('market-status');
        const marketNextStatusElement = document.getElementById('market-next-status');
        const lastUpdatedTimeElement = document.getElementById('last-updated-time');

        if (marketTimeBlockElement) {
            marketTimeBlockElement.textContent = `Market Time: ${formatTime(now)}`;
        }

        if (marketStatusElement && marketNextStatusElement) {
            const { status, nextStatus } = determineMarketStatus(now);

            // Reset classes
            marketStatusElement.classList.remove('bg-green-600', 'bg-yellow-600', 'bg-gray-600');
            
            // Set status text and background
            switch (status) {
                case 'OPEN':
                    marketStatusElement.textContent = 'The market is: OPEN';
                    marketStatusElement.classList.add('bg-green-600');
                    break;
                case 'EXTENDED':
                    marketStatusElement.textContent = 'The market is: EXTENDED HOURS';
                    marketStatusElement.classList.add('bg-yellow-600');
                    break;
                case 'CLOSED':
                    marketStatusElement.textContent = 'The market is: CLOSED';
                    marketStatusElement.classList.add('bg-gray-600');
                    break;
            }

            marketNextStatusElement.textContent = nextStatus;
        }

        // Update last updated time ago
        if (lastUpdatedTimeElement && lastUpdatedTimeElement.dataset.lastUpdated) {
            const lastUpdatedDate = new Date(lastUpdatedTimeElement.dataset.lastUpdated);
            const timeAgo = calculateTimeAgo(lastUpdatedDate);
            
            // Split the original text to preserve the timestamp
            const originalText = lastUpdatedTimeElement.textContent?.split(' (')[0] || '';
            lastUpdatedTimeElement.textContent = `${originalText} (${timeAgo})`;
        }
    }

    // Update market time and status immediately and then every second
    updateMarketTimeAndStatus();
    const marketTimeInterval = window.setInterval(updateMarketTimeAndStatus, 1000);
    
    return () => {
        clearInterval(marketTimeInterval);
    };
}
