import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('class1', 'class2');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'conditional', false && 'hidden');
    expect(result).toContain('base');
    expect(result).toContain('conditional');
    expect(result).not.toContain('hidden');
  });

  it('should merge Tailwind classes correctly', () => {
    // twMerge should resolve conflicting Tailwind classes
    const result = cn('p-4', 'p-2');
    // Should keep only the last padding class
    expect(result).toBe('p-2');
  });

  it('should handle array of classes', () => {
    const result = cn(['class1', 'class2']);
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('should handle objects with boolean values', () => {
    const result = cn({
      active: true,
      disabled: false,
      'is-visible': true,
    });
    expect(result).toContain('active');
    expect(result).toContain('is-visible');
    expect(result).not.toContain('disabled');
  });

  it('should handle empty inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle null and undefined', () => {
    const result = cn('class1', null, undefined, 'class2');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
    expect(result).not.toContain('null');
    expect(result).not.toContain('undefined');
  });

  it('should merge complex Tailwind utilities', () => {
    const result = cn('bg-red-500', 'bg-blue-500');
    // Should keep only the last background color
    expect(result).toBe('bg-blue-500');
  });

  it('should handle multiple arguments with duplicates', () => {
    const result = cn('text-sm', 'font-bold', 'text-sm');
    // Should deduplicate - order may vary but both should be present
    expect(result).toContain('text-sm');
    expect(result).toContain('font-bold');
  });
});
