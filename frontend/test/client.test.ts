import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNetworkApiClient } from '../src/api/client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockFetch(
  impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
) {
  const fn = vi.fn(impl);
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createNetworkApiClient', () => {
  it('parses a 200 JSON status response into ok:true', async () => {
    const status = {
      mode: 'wifi',
      connected: true,
      wifiConnected: true,
      ethernetConnected: false,
      fallbackAP: false,
      ssid: 'HomeNet',
      rssi: -52,
      ip: '192.168.1.42',
      mac: 'AA:BB:CC:DD:EE:FF',
    };
    const fetchMock = mockFetch(async () => jsonResponse(status));

    const client = createNetworkApiClient();
    const result = await client.getStatus();

    expect(result).toEqual({ ok: true, data: status });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/network/status');
    expect(init?.headers).toMatchObject({ Accept: 'application/json' });
  });

  it('maps an HTTP 400 {"error":...} body to ok:false with the server message', async () => {
    mockFetch(async () => jsonResponse({ error: 'invalid json' }, 400));

    const client = createNetworkApiClient();
    const result = await client.saveSettings({ wifiSSID: 'x' });

    expect(result).toEqual({ ok: false, status: 400, message: 'invalid json' });
  });

  it('maps an HTTP 500 non-JSON body to a generic message including the status', async () => {
    mockFetch(
      async () =>
        new Response('<html>boom</html>', {
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        }),
    );

    const client = createNetworkApiClient();
    const result = await client.getStatus();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(500);
      expect(result.message).toContain('500');
    }
  });

  it('maps a fetch rejection to a network message with no status', async () => {
    mockFetch(async () => {
      throw new TypeError('Failed to fetch');
    });

    const client = createNetworkApiClient();
    const result = await client.getStatus();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBeUndefined();
      expect(result.message).toMatch(/network/i);
    }
  });

  it('maps an aborted request (AbortSignal) to ok:false with no status', async () => {
    const fetchMock = mockFetch(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('This operation was aborted', 'AbortError'));
          });
        }),
    );

    const client = createNetworkApiClient();
    const controller = new AbortController();
    const promise = client.wifiList(controller.signal);
    controller.abort();
    const result = await promise;

    expect(result).toEqual({ ok: false, message: 'Request aborted.' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.signal).toBe(controller.signal);
  });

  it('POSTs saveSettings as JSON with the patch body', async () => {
    const settings = {
      isAPMode: false,
      wifiAPSSID: 'ed-network',
      wifiAPHasPassword: true,
      wifiSSID: 'HomeNet',
      hasWifiPassword: true,
      hasWifiAPPassword: true,
    };
    const fetchMock = mockFetch(async () => jsonResponse(settings));

    const client = createNetworkApiClient();
    const result = await client.saveSettings({ wifiSSID: 'HomeNet', wifiPassword: 'secret123' });

    expect(result).toEqual({ ok: true, data: settings });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/network/settings');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(String(init?.body))).toEqual({
      wifiSSID: 'HomeNet',
      wifiPassword: 'secret123',
    });
  });

  it('applies baseUrl and passthrough headers to every request', async () => {
    const fetchMock = mockFetch(async () => jsonResponse({ networks: [] }));

    const client = createNetworkApiClient({
      baseUrl: 'http://device.local',
      headers: { 'X-Token': 'abc' },
    });
    const result = await client.wifiList();

    expect(result).toEqual({ ok: true, data: { networks: [] } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://device.local/api/wifi/list');
    expect(init?.headers).toMatchObject({ 'X-Token': 'abc' });
  });
});
