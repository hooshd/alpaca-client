import { Position, AccountInfo } from './types';

const API_BASE_URL = '/api';

export function formatCurrency(value: number): string {
    const formattedValue = value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    if (value < 0) {
        return `<span class="text-red-500">(${formattedValue.slice(1)})</span>`;
    }
    return formattedValue;
}

export function handleError(error: unknown) {
    console.error('Error in Alpaca Trading App:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    let errorElement = document.getElementById('error-display');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'error-display';
        errorElement.className = 'bg-alpaca-red text-white p-3 rounded mt-4';
        document.getElementById('app')?.appendChild(errorElement);
    }
    
    errorElement.textContent = `Error: ${errorMessage}`;
}

function updateAccountInfoElement(elementId: string, value: string) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

export async function fetchAccountInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/account`);
        const accountData: AccountInfo = await response.json();
        
        updateAccountInfoElement('accountId', accountData.id);
        updateAccountInfoElement('accountNumber', accountData.account_number);
        updateAccountInfoElement('cashBalance', formatCurrency(parseFloat(accountData.cash)));
        updateAccountInfoElement('buyingPower', formatCurrency(parseFloat(accountData.buying_power)));
    } catch (error) {
        handleError(error);
    }
}

export async function fetchBalance() {
    try {
        const response = await fetch(`${API_BASE_URL}/balance`);
        const data = await response.json();
        
        const balanceElement = document.getElementById('balanceValue');
        if (balanceElement) {
            balanceElement.textContent = formatCurrency(data.balance);
        }
    } catch (error) {
        handleError(error);
    }
}

export async function fetchPositions() {
    try {
        const response = await fetch(`${API_BASE_URL}/positions`);
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
                        <span class="mr-2">${formatCurrency(position.marketValue)}</span>
                        <button 
                            data-symbol="${position.symbol}" 
                            class="close-position bg-alpaca-red text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                            Close
                        </button>
                    </div>
                </div>
            `).join('');

            document.querySelectorAll('.close-position').forEach(button => {
                button.addEventListener('click', (e) => {
                    const symbol = (e.target as HTMLButtonElement).dataset.symbol;
                    closePosition(symbol);
                });
            });
        }
    } catch (error) {
        handleError(error);
    }
}

async function closePosition(symbol?: string) {
    if (!symbol) return;

    try {
        const response = await fetch(`${API_BASE_URL}/positions/close`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ symbol })
        });

        const result = await response.json();
        
        if (result.success) {
            await Promise.all([
                fetchPositions(),
                fetchBalance(),
                fetchAccountInfo()
            ]);
        } else {
            throw new Error(result.message || 'Failed to close position');
        }
    } catch (error) {
        handleError(error);
    }
}
