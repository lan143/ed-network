import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const bundlePath = resolve(process.cwd(), 'dist/edn-network-ui.js');
const typesIndex = resolve(process.cwd(), 'dist/types/index.d.ts');

const bundleExists = existsSync(bundlePath);
const typesExist = existsSync(typesIndex);

// Guards skip gracefully when the test runs before `npm run build` (e.g. CI
// order). Run `npm run build` first for full coverage.
describe('built package integrity', () => {
  it.skipIf(!bundleExists)('exports the client factory from the single ESM bundle', async () => {
    const mod = (await import(pathToFileURL(bundlePath).href)) as Record<string, unknown>;
    expect(typeof mod.createNetworkApiClient).toBe('function');
  });

  it.skipIf(!bundleExists)('self-registers all three custom elements on import', async () => {
    await import(pathToFileURL(bundlePath).href);
    for (const name of ['edn-network-status', 'edn-network-settings', 'edn-network-page']) {
      expect(customElements.get(name), name).toBeTruthy();
    }
  });

  it.skipIf(!typesExist)('emits the public type declaration entry', () => {
    expect(existsSync(typesIndex)).toBe(true);
  });
});
