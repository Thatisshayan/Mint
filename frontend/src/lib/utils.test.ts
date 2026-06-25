import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  const falseValue = false;
  it('merges class names', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const result = cn('foo', falseValue && 'bar', 'baz');
    expect(result).toBe('foo baz');
  });

  it('deduplicates tailwind classes', () => {
    const result = cn('p-2 p-4');
    expect(result).toBe('p-4');
  });

  it('handles undefined and null', () => {
    const result = cn('foo', undefined, null, 'bar');
    expect(result).toBe('foo bar');
  });

  it('returns empty string for no input', () => {
    const result = cn();
    expect(result).toBe('');
  });
});
