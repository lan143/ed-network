import { afterEach, describe, expect, it } from 'vitest';
import { installMockApi } from '../demo/mock-api';

afterEach(() => {
  // installMockApi's own uninstall restores window.fetch inside each test.
  document.body.innerHTML = '';
});

describe('demo mock API', () => {
  it('cycles statuses ethernet -> wifi -> wifi_ap', async () => {
    const uninstall = installMockApi({ latencyMs: 0 });
    try {
      const modes: string[] = [];
      for (let i = 0; i < 3; i++) {
        const response = await window.fetch('/api/network/status');
        expect(response.status).toBe(200);
        modes.push(((await response.json()) as { mode: string }).mode);
      }
      expect(modes).toEqual(['ethernet', 'wifi', 'wifi_ap']);
    } finally {
      uninstall();
    }
  });

  it('fails every third Wi-Fi scan with a server-style error body', async () => {
    const uninstall = installMockApi({ latencyMs: 0 });
    try {
      const statuses: number[] = [];
      let lastBody: unknown;
      for (let i = 0; i < 3; i++) {
        const response = await window.fetch('/api/wifi/list');
        statuses.push(response.status);
        lastBody = await response.json();
      }
      expect(statuses).toEqual([200, 200, 500]);
      expect(lastBody).toEqual({ error: 'scan failed' });
    } finally {
      uninstall();
    }
  });

  it('rejects an SSID whose UTF-8 encoding exceeds 32 bytes, mirroring the server', async () => {
    const uninstall = installMockApi({ latencyMs: 0 });
    try {
      const response = await window.fetch('/api/network/settings', {
        method: 'POST',
        body: JSON.stringify({ wifiSSID: 'С'.repeat(32) }),
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'wifiSSID too long' });
    } finally {
      uninstall();
    }
  });
});
