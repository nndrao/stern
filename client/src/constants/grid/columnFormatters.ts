/**
 * Column Formatter and Renderer Constants
 * Based on AGV3 implementation
 */

export interface FormatterOption {
  value: string;
  label: string;
}

/**
 * Number formatters (19 options from AGV3)
 */
export const NUMBER_FORMATTERS: FormatterOption[] = [
  { value: '0Decimal', label: '0 Decimals (1234)' },
  { value: '1Decimal', label: '1 Decimal (1234.5)' },
  { value: '2Decimal', label: '2 Decimals (1234.56)' },
  { value: '3Decimal', label: '3 Decimals (1234.567)' },
  { value: '4Decimal', label: '4 Decimals (1234.5678)' },
  { value: '5Decimal', label: '5 Decimals' },
  { value: '6Decimal', label: '6 Decimals' },
  { value: '7Decimal', label: '7 Decimals' },
  { value: '8Decimal', label: '8 Decimals' },
  { value: '9Decimal', label: '9 Decimals' },
  { value: '0DecimalWithThousandSeparator', label: '0 Decimals (1,234)' },
  { value: '1DecimalWithThousandSeparator', label: '1 Decimal (1,234.5)' },
  { value: '2DecimalWithThousandSeparator', label: '2 Decimals (1,234.56)' },
  { value: '3DecimalWithThousandSeparator', label: '3 Decimals (1,234.567)' },
  { value: '4DecimalWithThousandSeparator', label: '4 Decimals (1,234.5678)' },
  { value: '5DecimalWithThousandSeparator', label: '5 Decimals (1,234.56789)' },
  { value: '6DecimalWithThousandSeparator', label: '6 Decimals' },
  { value: '7DecimalWithThousandSeparator', label: '7 Decimals' },
  { value: '8DecimalWithThousandSeparator', label: '8 Decimals' },
  { value: '9DecimalWithThousandSeparator', label: '9 Decimals' },
];

/**
 * Date formatters (18 options from AGV3)
 */
export const DATE_FORMATTERS: FormatterOption[] = [
  { value: 'ISODate', label: 'ISO Date (YYYY-MM-DD)' },
  { value: 'ISODateTime', label: 'ISO DateTime (YYYY-MM-DD HH:mm:ss)' },
  { value: 'ISODateTimeMillis', label: 'ISO DateTime Millis (YYYY-MM-DD HH:mm:ss.SSS)' },
  { value: 'USDate', label: 'US Date (MM/DD/YYYY)' },
  { value: 'USDateTime', label: 'US DateTime (MM/DD/YYYY HH:mm:ss)' },
  { value: 'USDateTime12Hour', label: 'US DateTime 12H (MM/DD/YYYY hh:mm:ss AM/PM)' },
  { value: 'EUDate', label: 'EU Date (DD/MM/YYYY)' },
  { value: 'EUDateTime', label: 'EU DateTime (DD/MM/YYYY HH:mm:ss)' },
  { value: 'LongDate', label: 'Long Date (January 1, 2024)' },
  { value: 'ShortDate', label: 'Short Date (Jan 1, 2024)' },
  { value: 'LongDateTime', label: 'Long DateTime (January 1, 2024 12:30:45 PM)' },
  { value: 'ShortDateTime', label: 'Short DateTime (1/1/2024 12:30 PM)' },
  { value: 'Time24Hour', label: '24-Hour Time (14:30:45)' },
  { value: 'Time12Hour', label: '12-Hour Time (2:30:45 PM)' },
  { value: 'TimeShort', label: 'Time Short (2:30 PM)' },
  { value: 'DateFromNow', label: 'Relative (2 hours ago)' },
  { value: 'UnixTimestamp', label: 'Unix Timestamp (seconds since epoch)' },
  { value: 'UnixTimestampMillis', label: 'Unix Timestamp (milliseconds since epoch)' },
];

/**
 * Text/String formatters
 */
export const TEXT_FORMATTERS: FormatterOption[] = [
  { value: '', label: 'Default' },
  { value: 'Uppercase', label: 'UPPERCASE' },
  { value: 'Lowercase', label: 'lowercase' },
  { value: 'Capitalize', label: 'Capitalize First Letter' },
];

/**
 * Cell renderers
 */
export const CELL_RENDERERS: FormatterOption[] = [
  { value: '', label: 'Default' },
  { value: 'NumericCellRenderer', label: 'Numeric (right-aligned)' },
];

/**
 * Get formatter options based on cell data type
 */
export function getFormatterOptions(cellDataType: string | undefined): FormatterOption[] {
  switch (cellDataType) {
    case 'number':
      return NUMBER_FORMATTERS;
    case 'date':
    case 'dateString':
      return DATE_FORMATTERS;
    case 'text':
    case 'string':
      return TEXT_FORMATTERS;
    default:
      return [{ value: '', label: 'Default' }];
  }
}

/**
 * Get renderer options based on cell data type
 */
export function getRendererOptions(cellDataType: string | undefined): FormatterOption[] {
  switch (cellDataType) {
    case 'number':
      return CELL_RENDERERS;
    default:
      return [{ value: '', label: 'Default' }];
  }
}

/**
 * Get default formatter for a cell data type
 */
export function getDefaultFormatter(cellDataType: string | undefined): string {
  switch (cellDataType) {
    case 'number':
      return '2DecimalWithThousandSeparator';
    case 'date':
    case 'dateString':
      return 'ISODateTime';
    default:
      return '';
  }
}

/**
 * Get default renderer for a cell data type
 */
export function getDefaultRenderer(cellDataType: string | undefined): string {
  switch (cellDataType) {
    case 'number':
      return 'NumericCellRenderer';
    default:
      return '';
  }
}
