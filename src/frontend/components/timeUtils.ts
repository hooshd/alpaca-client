// Function to format time in US Eastern Time
export function formatUSEasternTime(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
}

// Function to get US Eastern Time as Date
export function getUSEasternTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
}

// Function to update the last updated time
export function updateLastUpdatedTime() {
  const lastUpdatedTimeElement = document.getElementById('last-updated-time');
  if (lastUpdatedTimeElement) {
    const now = getUSEasternTime();
    lastUpdatedTimeElement.textContent = formatUSEasternTime(now);
    lastUpdatedTimeElement.setAttribute('data-last-updated', now.toISOString());
  }
}
