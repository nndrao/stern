/**
 * String utility functions
 */

/**
 * Auto-capitalize field path for header names
 *
 * Converts dot-notation and camelCase field paths into human-readable headers
 *
 * @param fieldPath Field path to capitalize
 * @returns Capitalized header name
 *
 * @example
 * autoCapitalize("order.price") → "Order Price"
 * autoCapitalize("user.firstName") → "User First Name"
 * autoCapitalize("id") → "Id"
 * autoCapitalize("totalPnL") → "Total Pn L"
 */
export function autoCapitalize(fieldPath: string): string {
  if (!fieldPath) return '';

  return fieldPath
    .split('.')
    .map(part => {
      // Handle camelCase: firstName → First Name
      const withSpaces = part.replace(/([A-Z])/g, ' $1');
      // Capitalize first letter of each word
      return withSpaces
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    })
    .join(' ')
    .trim();
}

/**
 * Format bytes to human-readable string
 *
 * @param bytes Number of bytes
 * @param decimals Number of decimal places
 * @returns Formatted string (e.g., "1.5 KB")
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Truncate string with ellipsis
 *
 * @param str String to truncate
 * @param maxLength Maximum length
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}
