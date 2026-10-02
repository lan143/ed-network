import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
  type?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
};

describe('frontend scaffold', () => {
  it('declares exactly one runtime dependency: lit', () => {
    expect(Object.keys(pkg.dependencies ?? {})).toEqual(['lit']);
  });

  it('is an ESM package with the expected pipeline scripts', () => {
    expect(pkg.type).toBe('module');
    for (const script of ['dev', 'build', 'typecheck', 'test', 'test:watch']) {
      expect(pkg.scripts?.[script], `missing script: ${script}`).toBeTruthy();
    }
  });
});
