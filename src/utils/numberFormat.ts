/**
 * Utility functions for precise decimal handling, financial calculations,
 * and number formatting without dropping decimals.
 */

/**
 * Format any currency value with exact 2 decimal places and locale grouping.
 * e.g. 1499.5 -> "₹ 1,499.50", 240 -> "₹ 240.00", 0 -> "₹ 0.00"
 */
export function formatMoney(amount: number | string | undefined | null, currency = '₹'): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
  if (isNaN(num)) return `${currency} 0.00`;
  return `${currency} ${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format plain number with at least 2 decimal places.
 * e.g. 1499.5 -> "1,499.50"
 */
export function formatDecimals(amount: number | string | undefined | null, minDecimals = 2, maxDecimals = 2): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
  if (isNaN(num)) return '0.00';
  return num.toLocaleString(undefined, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * Format quantity, supporting integer quantities (e.g. 1, 2) or fractional quantities (e.g. 1.5, 0.25).
 */
export function formatQuantity(qty: number | string | undefined | null): string {
  const num = typeof qty === 'number' ? qty : parseFloat(String(qty || 1));
  if (isNaN(num)) return '1';
  // If whole number, format without decimals, otherwise show up to 3 decimals
  return num % 1 === 0 ? num.toString() : num.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

/**
 * Robust decimal parser that handles OCR artifacts:
 * - "1499 . 50" -> 1499.50
 * - "1499. 50" -> 1499.50
 * - "1499,50" -> 1499.50 (European or OCR comma instead of dot)
 * - "1,499.50" -> 1499.50
 * - "1499·50" -> 1499.50
 */
export function parseDecimalSafe(raw: any): number {
  if (typeof raw === 'number') {
    return isNaN(raw) ? 0 : Math.round(raw * 100) / 100;
  }
  if (!raw || typeof raw !== 'string') return 0;

  let str = raw.trim();
  // Remove currency symbols and word tokens
  str = str.replace(/[₹$€£Rs\.INRUSD]/gi, ' ').trim();

  // Normalize OCR middle dot, bullets, apostrophes
  str = str.replace(/[·•']/g, '.');

  // Collapse spaces around dots or commas: "1499 . 50" -> "1499.50"
  str = str.replace(/([0-9])\s*\.\s*([0-9]{1,4})/g, '$1.$2');

  // If ends with comma followed by 1 or 2 digits, it's a decimal comma: "1499,50" -> "1499.50"
  if (/[0-9]+,[0-9]{1,2}$/.test(str)) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else {
    // Normal comma thousands separators
    str = str.replace(/,/g, '');
  }

  const match = str.match(/[-+]?[0-9]+(?:\.[0-9]+)?/);
  if (!match) return 0;

  const num = parseFloat(match[0]);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}
