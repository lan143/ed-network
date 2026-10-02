import { afterEach, describe, expect, it, vi } from 'vitest';
import { EdnNetworkStatus } from '../src/components/network-status';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function shadowText(element: EdnNetworkStatus): string {
  return element.shadowRoot?.textContent ?? '';
}

function mountWithFetch(
  impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
): { element: EdnNetworkStatus; fetchMock: ReturnType<typeof vi.fn> } {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal('fetch', fetchMock);
  const element = document.createElement('edn-network-status') as EdnNetworkStatus;
  element.setAttribute('poll-interval-ms', '0');
  document.body.append(element);
  return { element, fetchMock };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('<edn-network-status>', () => {
  it('renders the flat Wi-Fi fields when mode is wifi', async () => {
    const { element } = mountWithFetch(async () =>
      jsonResponse({
        mode: 'wifi',
        connected: true,
        wifiConnected: true,
        ethernetConnected: false,
        fallbackAP: false,
        ssid: 'HomeNet',
        rssi: -58,
        ip: '192.168.1.42',
        mac: 'AA:BB:CC:DD:EE:02',
      }),
    );

    await vi.waitFor(() => {
      expect(shadowText(element)).toContain('HomeNet');
    });
    const text = shadowText(element);
    expect(text).toContain('Wi-Fi');
    expect(text).toContain('Connected');
    expect(text).toContain('-58 dBm');
    expect(text).toContain('Good');
    expect(text).toContain('192.168.1.42');
    expect(text).toContain('AA:BB:CC:DD:EE:02');
    expect(text).toMatch(/Updated \d{2}:\d{2}:\d{2}/);
  });

  it('renders the Ethernet fields when mode is ethernet', async () => {
    const { element } = mountWithFetch(async () =>
      jsonResponse({
        mode: 'ethernet',
        connected: true,
        wifiConnected: false,
        ethernetConnected: true,
        fallbackAP: false,
        eth: {
          ip: '10.0.0.24',
          mac: 'DE:AD:BE:EF:00:01',
          linkUp: true,
          speed: 1000,
          duplex: 1,
        },
      }),
    );

    await vi.waitFor(() => {
      expect(shadowText(element)).toContain('10.0.0.24');
    });
    const text = shadowText(element);
    expect(text).toContain('Ethernet');
    expect(text).toContain('DE:AD:BE:EF:00:01');
    expect(text).toContain('1000 Mbps');
    expect(text).toContain('Full');
  });

  it('shows a fallback-AP warning in wifi_ap mode', async () => {
    const { element } = mountWithFetch(async () =>
      jsonResponse({
        mode: 'wifi_ap',
        connected: false,
        wifiConnected: false,
        ethernetConnected: false,
        fallbackAP: true,
        ap: { ssid: 'ed-network', ip: '192.168.4.1', stations: 2 },
      }),
    );

    await vi.waitFor(() => {
      expect(shadowText(element)).toContain('ed-network');
    });
    const text = shadowText(element);
    expect(text).toContain('Wi-Fi AP');
    expect(text).toContain('Fallback AP active');
    expect(text).toContain('192.168.4.1');
    expect(text).toContain('2');
  });

  it('shows an error banner and emits edn-error without crashing when fetch fails', async () => {
    const { element } = mountWithFetch(async () => {
      throw new TypeError('Failed to fetch');
    });
    const errorListener = vi.fn();
    element.addEventListener('edn-error', errorListener);

    await vi.waitFor(() => {
      expect(shadowText(element)).toMatch(/network/i);
    });
    expect(shadowText(element)).toContain('Retry');
    expect(errorListener).toHaveBeenCalledTimes(1);
    const event = errorListener.mock.calls[0][0] as CustomEvent<{ message: string }>;
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
    expect(event.detail.message).toMatch(/network/i);
  });

  it('stops polling after disconnect', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        mode: 'ethernet',
        connected: true,
        wifiConnected: false,
        ethernetConnected: true,
        fallbackAP: false,
        eth: { ip: '10.0.0.24', mac: 'DE:AD:BE:EF:00:01', linkUp: true, speed: 100, duplex: 1 },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const element = document.createElement('edn-network-status') as EdnNetworkStatus;
    element.setAttribute('poll-interval-ms', '100');
    document.body.append(element);

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(350);
    const callsWhileConnected = fetchMock.mock.calls.length;
    expect(callsWhileConnected).toBeGreaterThanOrEqual(2);

    element.remove();
    await vi.advanceTimersByTimeAsync(500);
    expect(fetchMock.mock.calls.length).toBe(callsWhileConnected);
  });
});
