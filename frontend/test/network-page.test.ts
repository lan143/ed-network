import { afterEach, describe, expect, it, vi } from 'vitest';
import { EdnNetworkPage } from '../src/components/network-page';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function stubApi(): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.endsWith('/api/network/settings')) {
      return jsonResponse({
        isAPMode: false,
        wifiAPSSID: 'ed-network',
        wifiAPHasPassword: true,
        wifiSSID: 'HomeNet',
        hasWifiPassword: true,
        hasWifiAPPassword: true,
      });
    }
    return jsonResponse({
      mode: 'ethernet',
      connected: true,
      wifiConnected: false,
      ethernetConnected: true,
      fallbackAP: false,
      eth: { ip: '10.0.0.24', mac: 'DE:AD:BE:EF:00:01', linkUp: true, speed: 1000, duplex: 1 },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function mountPage(): EdnNetworkPage {
  stubApi();
  const element = document.createElement('edn-network-page') as EdnNetworkPage;
  document.body.append(element);
  return element;
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('<edn-network-page>', () => {
  it('mounts the status child on the default tab', async () => {
    const element = mountPage();
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector('edn-network-status')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('edn-network-settings')).toBeNull();
  });

  it('switches tabs, mounts the right child and emits edn-tab-change', async () => {
    const element = mountPage();
    await element.updateComplete;
    const listener = vi.fn();
    element.addEventListener('edn-tab-change', listener);

    const settingsTab = Array.from(
      element.shadowRoot?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
    ).find((button) => button.textContent?.trim() === 'Network settings');
    settingsTab?.click();
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector('edn-network-settings')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('edn-network-status')).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0] as CustomEvent<{ tab: string }>;
    expect(event.detail.tab).toBe('settings');
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });
});
