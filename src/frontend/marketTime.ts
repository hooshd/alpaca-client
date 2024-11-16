
interface Holiday {
    name: string;
    date: Date;
}

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


class MarketHoursCalculator {
    private static holidays: { [year: number]: Holiday[] } = {
        2024: [
            { name: 'New Year\'s Day', date: new Date(2024, 0, 1) },
            { name: 'Martin Luther King, Jr. Day', date: new Date(2024, 0, 15) },
            { name: 'Washington\'s Birthday', date: new Date(2024, 1, 19) },
            { name: 'Good Friday', date: new Date(2024, 2, 29) },
            { name: 'Memorial Day', date: new Date(2024, 4, 27) },
            { name: 'Juneteenth National Independence Day', date: new Date(2024, 5, 19) },
            { name: 'Independence Day', date: new Date(2024, 6, 4) },
            { name: 'Labor Day', date: new Date(2024, 8, 2) },
            { name: 'Thanksgiving Day', date: new Date(2024, 10, 28) },
            { name: 'Christmas Day', date: new Date(2024, 11, 25) }
        ],
        2025: [
            { name: 'New Year\'s Day', date: new Date(2025, 0, 1) },
            { name: 'Martin Luther King, Jr. Day', date: new Date(2025, 0, 20) },
            { name: 'Washington\'s Birthday', date: new Date(2025, 1, 17) },
            { name: 'Good Friday', date: new Date(2025, 3, 18) },
            { name: 'Memorial Day', date: new Date(2025, 4, 26) },
            { name: 'Juneteenth National Independence Day', date: new Date(2025, 5, 19) },
            { name: 'Independence Day', date: new Date(2025, 6, 4) },
            { name: 'Labor Day', date: new Date(2025, 8, 1) },
            { name: 'Thanksgiving Day', date: new Date(2025, 10, 27) },
            { name: 'Christmas Day', date: new Date(2025, 11, 25) }
        ],
        2026: [
            { name: 'New Year\'s Day', date: new Date(2026, 0, 1) },
            { name: 'Martin Luther King, Jr. Day', date: new Date(2026, 0, 19) },
            { name: 'Washington\'s Birthday', date: new Date(2026, 1, 16) },
            { name: 'Good Friday', date: new Date(2026, 3, 3) },
            { name: 'Memorial Day', date: new Date(2026, 4, 25) },
            { name: 'Juneteenth National Independence Day', date: new Date(2026, 5, 19) },
            { name: 'Independence Day', date: new Date(2026, 6, 3) },
            { name: 'Labor Day', date: new Date(2026, 8, 7) },
            { name: 'Thanksgiving Day', date: new Date(2026, 10, 26) },
            { name: 'Christmas Day', date: new Date(2026, 11, 25) }
        ]
    };

    private static earlyCloseDates: { [year: number]: { date: Date, time: string }[] } = {
        2024: [
            { date: new Date(2024, 6, 3), time: '1:00 PM' },   // Independence Day eve
            { date: new Date(2024, 10, 29), time: '1:00 PM' }, // Day after Thanksgiving
            { date: new Date(2024, 11, 24), time: '1:00 PM' }  // Christmas Eve
        ],
        2025: [
            { date: new Date(2025, 6, 3), time: '1:00 PM' },   // Independence Day eve
            { date: new Date(2025, 10, 28), time: '1:00 PM' }, // Day after Thanksgiving
            { date: new Date(2025, 11, 24), time: '1:00 PM' }  // Christmas Eve
        ],
        2026: [
            { date: new Date(2026, 6, 3), time: '1:00 PM' },   // Independence Day eve
            { date: new Date(2026, 10, 27), time: '1:00 PM' }, // Day after Thanksgiving
            { date: new Date(2026, 11, 24), time: '1:00 PM' }  // Christmas Eve
        ]
    };

    static isMarketHoliday(date: Date): boolean {
        const year = date.getFullYear();
        const holidays = this.holidays[year] || [];
        return holidays.some(holiday => 
            holiday.date.getMonth() === date.getMonth() && 
            holiday.date.getDate() === date.getDate()
        );
    }

    static isEarlyCloseDay(date: Date): { isEarlyClose: boolean, time?: string } {
        const year = date.getFullYear();
        const earlyClosure = this.earlyCloseDates[year]?.find(closure => 
            closure.date.getMonth() === date.getMonth() && 
            closure.date.getDate() === date.getDate()
        );
        return {
            isEarlyClose: !!earlyClosure,
            time: earlyClosure?.time
        };
    }

    static async findNextMarketOpenTime(fromDate: Date = new Date()): Promise<Date> {
        let checkDate = new Date(fromDate);
        
        while (true) {
            checkDate.setDate(checkDate.getDate() + 1);
            
            // Skip weekends
            if (checkDate.getDay() === 0 || checkDate.getDay() === 6) continue;
            
            // Skip holidays
            if (this.isMarketHoliday(checkDate)) continue;
            
            // Return the next market open date at 9:30 AM
            const nextOpen = new Date(checkDate);
            nextOpen.setHours(9, 30, 0, 0);
            return nextOpen;
        }
    }

    static determineMarketStatus(time: Date = getUSEasternTime()): { 
        status: 'OPEN' | 'EXTENDED' | 'CLOSED', 
        nextStatus: string 
    } {
        const day = time.getDay();
        const hour = time.getHours();
        const minute = time.getMinutes();

        // Weekend check
        if (day === 0 || day === 6) {
            return {
                status: 'CLOSED',
                nextStatus: 'Next open on Monday at 9:30 AM ET'
            };
        }

        // Holiday check
        if (this.isMarketHoliday(time)) {
            return {
                status: 'CLOSED',
                nextStatus: 'Market closed for holiday'
            };
        }

        const currentTimeInMinutes = hour * 60 + minute;
        const marketOpenTime = 9 * 60 + 30;  // 9:30 AM
        const marketCloseTime = 16 * 60;     // 4:00 PM
        const preMarketOpenTime = 4 * 60;    // 4:00 AM
        const postMarketCloseTime = 20 * 60; // 8:00 PM

        // Early close day check
        const { isEarlyClose, time: earlyCloseTime } = this.isEarlyCloseDay(time);
        if (isEarlyClose) {
            const earlyCloseTimeMinutes = 13 * 60; // 1:00 PM
            if (currentTimeInMinutes >= earlyCloseTimeMinutes) {
                return {
                    status: 'CLOSED',
                    nextStatus: `Market closed early at ${earlyCloseTime}`
                };
            }
        }

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
}

export function initializeMarketTime() {
    function updateMarketTimeAndStatus() {
        const now = getUSEasternTime();
        const marketTimeBlockElement = document.getElementById('market-time-block');
        const marketStatusElement = document.getElementById('market-status');
        const marketNextStatusElement = document.getElementById('market-next-status');

        if (marketTimeBlockElement) {
            marketTimeBlockElement.textContent = `Market Time: ${formatTime(now)}`;
        }

        if (marketStatusElement && marketNextStatusElement) {
            const { status, nextStatus } = MarketHoursCalculator.determineMarketStatus(now);

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
    }

    // Update market time and status immediately and then every second
    updateMarketTimeAndStatus();
    const marketTimeInterval = window.setInterval(updateMarketTimeAndStatus, 1000);
    
    return () => {
        clearInterval(marketTimeInterval);
    };
}

export { MarketHoursCalculator };
