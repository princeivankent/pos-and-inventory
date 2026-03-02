import { describe, it, expect, beforeEach } from 'vitest';
import { PhpCurrencyPipe } from './php-currency.pipe';

describe('PhpCurrencyPipe', () => {
  let pipe: PhpCurrencyPipe;

  beforeEach(() => {
    pipe = new PhpCurrencyPipe();
  });

  it('returns ₱0.00 for null', () => {
    expect(pipe.transform(null)).toBe('₱0.00');
  });

  it('returns ₱0.00 for undefined', () => {
    expect(pipe.transform(undefined)).toBe('₱0.00');
  });

  it('returns ₱0.00 for empty string', () => {
    expect(pipe.transform('')).toBe('₱0.00');
  });

  it('returns ₱0.00 for non-numeric string', () => {
    expect(pipe.transform('abc')).toBe('₱0.00');
  });

  it('returns ₱0.00 for 0', () => {
    expect(pipe.transform(0)).toBe('₱0.00');
  });

  it('formats 1234.56 with peso sign and thousands separator', () => {
    const result = pipe.transform(1234.56);
    expect(result).toContain('₱');
    expect(result).toContain('1,234.56');
  });

  it('formats 1000000 with correct separators', () => {
    const result = pipe.transform(1000000);
    expect(result).toContain('1,000,000.00');
  });

  it('formats 0.5 as ₱0.50', () => {
    expect(pipe.transform(0.5)).toBe('₱0.50');
  });

  it('accepts numeric string and formats like the number', () => {
    const fromString = pipe.transform('1234.56');
    const fromNumber = pipe.transform(1234.56);
    expect(fromString).toBe(fromNumber);
  });
});
