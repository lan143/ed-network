import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as ui from '../src/index';

describe('public barrel and build target', () => {
  it('exposes the client factory and status element, and registers the element', () => {
    expect(typeof ui.createNetworkApiClient).toBe('function');
    expect(typeof ui.EdnNetworkStatus).toBe('function');
    expect(customElements.get('edn-network-status')).toBe(ui.EdnNetworkStatus);
  });

  it('points the package build target at the single ESM library file', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
      module?: string;
      exports?: Record<string, unknown>;
      files?: string[];
    };
    expect(pkg.module).toBe('dist/edn-network-ui.js');
    expect(pkg.exports?.['.']).toEqual({
      types: './dist/types/index.d.ts',
      default: './dist/edn-network-ui.js',
    });
    expect(pkg.files).toContain('dist');
  });
});
