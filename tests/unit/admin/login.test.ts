import { describe, expect, it } from 'vitest';
import { sanitiseNext } from '../../../src/lib/admin/login.ts';

describe('sanitiseNext', () => {
  it('accepts /admin paths with url-safe segments and falls back otherwise', () => {
    expect(sanitiseNext('/admin')).toBe('/admin');
    expect(sanitiseNext('/admin/rugs/SL-030')).toBe('/admin/rugs/SL-030');
    expect(sanitiseNext('/admin/')).toBe('/admin/');
    expect(sanitiseNext('/')).toBe('/admin');
    expect(sanitiseNext('/admin/../etc')).toBe('/admin');
    expect(sanitiseNext('https://evil.example/admin')).toBe('/admin');
    expect(sanitiseNext('//evil.example/admin')).toBe('/admin');
    expect(sanitiseNext('/admin?x=1')).toBe('/admin');
    expect(sanitiseNext('/administrator')).toBe('/admin');
    expect(sanitiseNext('/admin/login')).toBe('/admin');
    expect(sanitiseNext(undefined)).toBe('/admin');
    expect(sanitiseNext(42)).toBe('/admin');
  });
});
