// Alpaca Trading Interface Frontend

interface Position {
    symbol: string;
    quantity: number;
    marketValue: number;
    currentPrice: number;
}

interface AccountInfo {
    id: string;
    account_number: string;
    cash: string;
    buying_power: string;
}

class AlpacaTradingApp {
    private apiBaseUrl = '/api';
    private marketTimeInterval: number | null = null;

    constructor() {
        this.initializeApp();
    }

    private async initializeApp() {
        try {
            await Promise.all([
                this.fetchBalance(),
                this.fetchPositions(),
                this.fetchAccountInfo(),
                this.initializeMarketTime()
            ]);
        } catch (error) {
            this.handleError(error);
        }
    }

    private initializeMarketTime() {
        // Update market time and status immediately and then every second
        this.updateMarketTimeAndStatus();
        this.marketTimeInterval = window.setInterval(() => {
            this.updateMarketTimeAndStatus();
        }, 1000);
    }

    private getUSEasternTime(): Date {
        return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
    }

    private formatTime(date: Date): string {
        return date.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
    }

    private determineMarketStatus(time: Date): { 
        status: 'OPEN' | 'EXTENDED' | 'CLOSED', 
        nextStatus: string 
    } {
        const day = time.getDay(); // 0 (Sunday) to 6 (Saturday)
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

    private updateMarketTimeAndStatus() {
        const now = this.getUSEasternTime();
        const marketTimeBlockElement = document.getElementById('market-time-block');
        const marketStatusElement = document.getElementById('market-status');
        const marketNextStatusElement = document.getElementById('market-next-status');

        if (marketTimeBlockElement) {
            marketTimeBlockElement.textContent = `Market Time: ${this.formatTime(now)}`;
        }

        if (marketStatusElement && marketNextStatusElement) {
            const { status, nextStatus } = this.determineMarketStatus(now);

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

    private async fetchAccountInfo() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/account`);
            const accountData: AccountInfo = await response.json();
            
            // Update Account Info Section
            this.updateAccountInfoElement('accountId', accountData.id);
            this.updateAccountInfoElement('accountNumber', accountData.account_number);
            this.updateAccountInfoElement('cashBalance', this.formatCurrency(parseFloat(accountData.cash)));
            this.updateAccountInfoElement('buyingPower', this.formatCurrency(parseFloat(accountData.buying_power)));
        } catch (error) {
            this.handleError(error);
        }
    }

    private updateAccountInfoElement(elementId: string, value: string) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    private async fetchBalance() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/balance`);
            const data = await response.json();
            
            const balanceElement = document.getElementById('balanceValue');
            if (balanceElement) {
                balanceElement.textContent = this.formatCurrency(data.balance);
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    private async fetchPositions() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/positions`);
            const positions: Position[] = await response.json();
            
            const positionsList = document.getElementById('positionsList');
            if (positionsList) {
                positionsList.innerHTML = positions.map(position => `
                    <div class="flex justify-between items-center bg-gray-100 p-3 rounded">
                        <div>
                            <span class="font-bold">${position.symbol}</span>
                            <span class="text-gray-600 ml-2">${position.quantity} shares</span>
                        </div>
                        <div class="flex items-center">
                            <span class="mr-2">${this.formatCurrency(position.marketValue)}</span>
                            <button 
                                data-symbol="${position.symbol}" 
                                class="close-position bg-alpaca-red text-white px-2 py-1 rounded hover:bg-red-600"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                `).join('');

                // Add event listeners to close position buttons
                document.querySelectorAll('.close-position').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const symbol = (e.target as HTMLButtonElement).dataset.symbol;
                        this.closePosition(symbol);
                    });
                });
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    private async closePosition(symbol?: string) {
        if (!symbol) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/positions/close`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ symbol })
            });

            const result = await response.json();
            
            if (result.success) {
                // Refresh positions after closing
                await Promise.all([
                    this.fetchPositions(),
                    this.fetchBalance(),
                    this.fetchAccountInfo()
                ]);
            } else {
                throw new Error(result.message || 'Failed to close position');
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    private handleError(error: unknown) {
        console.error('Error in Alpaca Trading App:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Create or update an error display element
        let errorElement = document.getElementById('error-display');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'error-display';
            errorElement.className = 'bg-alpaca-red text-white p-3 rounded mt-4';
            document.getElementById('app')?.appendChild(errorElement);
        }
        
        errorElement.textContent = `Error: ${errorMessage}`;
    }

    private formatCurrency(value: number): string {
        const formattedValue = value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        if (value < 0) {
            return `<span class="text-red-500">(${formattedValue.slice(1)})</span>`;
        }
        return formattedValue;
    }

    // Clean up interval when the app is potentially destroyed
    public cleanup() {
        if (this.marketTimeInterval) {
            clearInterval(this.marketTimeInterval);
        }
    }
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new AlpacaTradingApp();
});

export {};  // Ensure this is a module
