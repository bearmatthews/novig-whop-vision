/**
 * Convert decimal price to American odds
 * @param price - Decimal price (e.g., 0.36)
 * @returns American odds string (e.g., "+178")
 */
export function priceToAmericanOdds(price: number): string {
  if (price >= 0.5) {
    const odds = Math.round((price / (1 - price)) * -100);
    return `${odds}`;
  } else {
    const odds = Math.round(((1 - price) / price) * 100);
    return `+${odds}`;
  }
}

/**
 * Calculate risk and to-win amounts
 * @param price - Decimal price
 * @param qty - Total quantity (risk + to-win)
 * @returns Object with risk and toWin amounts
 */
export function calculatePayouts(price: number, qty: number): { risk: number; toWin: number } {
  const totalValue = qty / 100; // Convert cents to dollars
  const risk = totalValue * price;
  const toWin = totalValue * (1 - price);
  
  return {
    risk: Math.round(risk * 100) / 100,
    toWin: Math.round(toWin * 100) / 100,
  };
}

/**
 * Format currency amount
 * @param amount - Amount in cents
 * @returns Formatted string (e.g., "$162")
 */
export function formatCurrency(amount: number): string {
  return `$${Math.round(amount / 100).toLocaleString()}`;
}

/**
 * Format date and time
 * @param dateString - ISO date string
 * @returns Formatted date and time
 */
export function formatGameTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  const timeString = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  if (isToday) {
    return `Today ${timeString}`;
  }
  
  const dateStr = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  
  return `${dateStr} ${timeString}`;
}
