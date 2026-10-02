import { afterEach, describe, expect, it, vi } from 'vitest';
import { EdnNetworkSettings } from '../src/components/network-settings';
import type { NetworkSettings } from '../src/api/types';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function baseSettings(overrides: Partial<NetworkSettings> = {}): NetworkSettings {
  return {
    isAPMode: false,
    wifiAPSSID: 'ed-network',
    wifiAPHasPassword: true,
    wifiSSID: 'HomeNet',
    hasWifiPassword: true,
    hasWifiAPPassword: true,
    ...overrides,
  };
}

type Handler = (
  url: string,
  init: RequestInit | undefined,
) => Response | Promise<Response>;

function mount(handler: Handler): {
  element: EdnNetworkSettings;
  fetchMock: ReturnType<typeof vi.fn>;
} {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return handler(url, init);
    },
  );
  vi.stubGlobal('fetch', fetchMock);
  const element = document.createElement('edn-network-settings') as EdnNetworkSettings;
  document.body.append(element);
  return { element, fetchMock };
}

async function waitForForm(element: EdnNetworkSettings): Promise<void> {
  await vi.waitFor(() => {
    expect(element.shadowRoot?.querySelector('form')).toBeTruthy();
  });
}

function input(element: EdnNetworkSettings, name: string): HTMLInputElement {
  const found = element.shadowRoot?.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!found) {
    throw new Error(`input ${name} not found`);
  }
  return found;
}

function fill(target: HTMLInputElement, value: string): void {
  target.value = value;
  target.dispatchEvent(new Event('input', { bubbles: true }));
}

function submit(element: EdnNetworkSettings): void {
  const form = element.shadowRoot?.querySelector('form');
  form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function segButton(element: EdnNetworkSettings, label: string): HTMLButtonElement {
  const buttons = Array.from(element.shadowRoot?.querySelectorAll<HTMLButtonElement>('.seg') ?? []);
  const found = buttons.find((candidate) => candidate.textContent?.trim() === label);
  if (!found) {
    throw new Error(`segment button ${label} not found`);
  }
  return found;
}

function text(element: EdnNetworkSettings): string {
  return element.shadowRoot?.textContent ?? '';
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('<edn-network-settings>', () => {
  it('loads station fields from GET and never autofills the saved password', async () => {
    const { element } = mount(() => jsonResponse(baseSettings()));

    await waitForForm(element);
    expect(text(element)).toContain('Station');
    expect(input(element, 'wifiSSID').value).toBe('HomeNet');
    expect(input(element, 'wifiPassword').value).toBe('');
    expect(text(element)).toContain('leave blank to keep');
  });

  it('switching to Access Point renders the AP fields', async () => {
    const { element } = mount(() => jsonResponse(baseSettings()));

    await waitForForm(element);
    segButton(element, 'Access Point').click();
    await element.updateComplete;

    expect(text(element)).toContain('Access point name');
    expect(text(element)).toContain('Require password');
    expect(input(element, 'wifiAPSSID').value).toBe('ed-network');
    expect(input(element, 'wifiAPPassword').value).toBe('');
    expect(element.shadowRoot?.querySelector('input[name="wifiSSID"]')).toBeNull();
  });

  it('blocks submit with an empty SSID and makes no network call', async () => {
    const { element, fetchMock } = mount(() => jsonResponse(baseSettings({ wifiSSID: '' })));

    await waitForForm(element);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    submit(element);
    await element.updateComplete;

    expect(text(element)).toContain('Wi-Fi name is required in station mode');
    const posts = fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST');
    expect(posts).toHaveLength(0);
  });

  it('blocks submit with a 7-character AP password and makes no network call', async () => {
    const { element, fetchMock } = mount(() => jsonResponse(baseSettings()));

    await waitForForm(element);
    segButton(element, 'Access Point').click();
    await element.updateComplete;
    fill(input(element, 'wifiAPPassword'), 'short12');
    submit(element);
    await element.updateComplete;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(text(element)).toContain('Access point password must be 8');
  });

  it('sends only changed fields and omits an untouched password', async () => {
    const { element, fetchMock } = mount((_url, init) => {
      if (init?.method === 'POST') {
        return jsonResponse(baseSettings({ wifiSSID: 'NewNet' }));
      }
      return jsonResponse(baseSettings());
    });

    await waitForForm(element);
    fill(input(element, 'wifiSSID'), 'NewNet');
    submit(element);

    await vi.waitFor(() => {
      expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(true);
    });
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    const body = JSON.parse(String(post?.[1]?.body)) as Record<string, unknown>;
    expect(body).toEqual({ wifiSSID: 'NewNet' });
  });

  it('shows the clear-password warning and sends wifiPassword:"" when the password was emptied', async () => {
    const { element, fetchMock } = mount((_url, init) => {
      if (init?.method === 'POST') {
        return jsonResponse(baseSettings({ hasWifiPassword: false }));
      }
      return jsonResponse(baseSettings());
    });

    await waitForForm(element);
    fill(input(element, 'wifiPassword'), 'secret123');
    fill(input(element, 'wifiPassword'), '');
    await element.updateComplete;

    // Visible BEFORE Save, not only after the patch fails.
    expect(text(element)).toContain('Warning: saving now will remove the stored password.');

    submit(element);
    await vi.waitFor(() => {
      expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(true);
    });
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    const body = JSON.parse(String(post?.[1]?.body)) as Record<string, unknown>;
    expect(body.wifiPassword).toBe('');
  });

  it('shows the AP clear-password warning when the AP password was emptied', async () => {
    const { element } = mount(() => jsonResponse(baseSettings()));

    await waitForForm(element);
    segButton(element, 'Access Point').click();
    await element.updateComplete;
    fill(input(element, 'wifiAPPassword'), 'secret123');
    fill(input(element, 'wifiAPPassword'), '');
    await element.updateComplete;

    expect(text(element)).toContain('Warning: saving now will remove the stored password.');
  });

  it('blocks a 32-char Cyrillic SSID (64 UTF-8 bytes) client-side without a POST', async () => {
    const { element, fetchMock } = mount(() => jsonResponse(baseSettings()));

    await waitForForm(element);
    fill(input(element, 'wifiSSID'), 'С'.repeat(32));
    submit(element);
    await element.updateComplete;

    expect(text(element)).toContain('Wi-Fi name must be 32');
    const posts = fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST');
    expect(posts).toHaveLength(0);
  });

  it('blocks 10 emoji characters (>32 UTF-8 bytes) for the SSID', async () => {
    const { element, fetchMock } = mount(() => jsonResponse(baseSettings()));

    await waitForForm(element);
    fill(input(element, 'wifiSSID'), '😀'.repeat(10));
    submit(element);
    await element.updateComplete;

    expect(text(element)).toContain('Wi-Fi name must be 32');
    const posts = fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST');
    expect(posts).toHaveLength(0);
  });

  it('allows an ASCII 32-character SSID (exactly 32 UTF-8 bytes)', async () => {
    const { element, fetchMock } = mount((_url, init) => {
      if (init?.method === 'POST') {
        return jsonResponse(baseSettings({ wifiSSID: 'a'.repeat(32) }));
      }
      return jsonResponse(baseSettings());
    });

    await waitForForm(element);
    fill(input(element, 'wifiSSID'), 'a'.repeat(32));
    submit(element);

    await vi.waitFor(() => {
      expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(true);
    });
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    const body = JSON.parse(String(post?.[1]?.body)) as Record<string, unknown>;
    expect(body.wifiSSID).toBe('a'.repeat(32));
  });

  it('aborts the in-flight scan on the 5s timeout and does not stack requests', async () => {
    const listSignals: AbortSignal[] = [];
    const fetchMock = vi.fn(
      (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url =
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        if (url.endsWith('/api/wifi/list')) {
          const signal = init?.signal ?? undefined;
          if (signal) {
            listSignals.push(signal);
          }
          return new Promise<Response>((_resolve, reject) => {
            signal?.addEventListener('abort', () => {
              reject(new DOMException('This operation was aborted', 'AbortError'));
            });
          });
        }
        return Promise.resolve(jsonResponse(baseSettings()));
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const element = document.createElement('edn-network-settings') as EdnNetworkSettings;
    document.body.append(element);
    await vi.waitFor(() => {
      expect(element.shadowRoot?.querySelector('form')).toBeTruthy();
    });

    vi.useFakeTimers();
    element.shadowRoot?.querySelector<HTMLButtonElement>('.scan-head button')?.click();
    expect(listSignals).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(5000);
    await element.updateComplete;

    expect(listSignals[0]?.aborted).toBe(true);
    expect(text(element)).toContain('timed out');
    // No un-aborted scan request survives the timeout message.
    expect(listSignals.filter((signal) => !signal.aborted)).toHaveLength(0);

    // A second scan starts fresh; the first request stays aborted.
    element.shadowRoot?.querySelector<HTMLButtonElement>('.scan-head button')?.click();
    expect(listSignals).toHaveLength(2);
    expect(listSignals[0]?.aborted).toBe(true);
    expect(listSignals[1]?.aborted).toBe(false);

    await vi.advanceTimersByTimeAsync(5000);
    await element.updateComplete;
    expect(listSignals[1]?.aborted).toBe(true);
    expect(listSignals.filter((signal) => !signal.aborted)).toHaveLength(0);
  });

  it('ignores a late stale load result after the baseUrl changes', async () => {
    const resolvers: Array<(response: Response) => void> = [];
    const fetchMock = vi.fn(
      (input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
        const url =
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        if (url.endsWith('/api/network/settings')) {
          return new Promise<Response>((resolve) => {
            resolvers.push(resolve);
          });
        }
        return Promise.resolve(jsonResponse(baseSettings()));
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const element = document.createElement('edn-network-settings') as EdnNetworkSettings;
    document.body.append(element);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    // Change baseUrl → a second load starts for device B.
    element.baseUrl = 'http://device-b.local';
    await element.updateComplete;
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    // Device A's slow load resolves late — its data must NOT be applied.
    resolvers[0]!(jsonResponse(baseSettings({ wifiSSID: 'DeviceA' })));
    await element.updateComplete;
    expect(element.settings).toBeNull();
    expect(element.shadowRoot?.querySelector('input[name="wifiSSID"]')).toBeNull();

    // Device B's load resolves and is applied.
    resolvers[1]!(jsonResponse(baseSettings({ wifiSSID: 'DeviceB' })));
    await vi.waitFor(() => {
      const ssid = element.shadowRoot?.querySelector<HTMLInputElement>(
        'input[name="wifiSSID"]',
      );
      expect(ssid?.value).toBe('DeviceB');
    });
  });

  it('shows the transport-failure save hint when the device may have applied the change', async () => {
    const { element } = mount((_url, init) => {
      if (init?.method === 'POST') {
        return Promise.reject(new TypeError('Failed to fetch'));
      }
      return jsonResponse(baseSettings());
    });
    const errorListener = vi.fn();
    element.addEventListener('edn-error', errorListener);

    await waitForForm(element);
    fill(input(element, 'wifiSSID'), 'NewNet');
    submit(element);

    await vi.waitFor(() => {
      expect(text(element)).toContain('may have applied');
    });
    // Form and dirty draft are kept so the user can retry.
    expect(element.shadowRoot?.querySelector('form')).toBeTruthy();
    const saveButton = element.shadowRoot?.querySelector<HTMLButtonElement>('button.primary');
    expect(saveButton?.disabled).toBe(false);
    expect(errorListener).toHaveBeenCalledTimes(1);
  });

  it('surfaces a server 400 error and keeps the form dirty', async () => {
    const { element } = mount((_url, init) => {
      if (init?.method === 'POST') {
        return jsonResponse({ error: 'wifiSSID too long' }, 400);
      }
      return jsonResponse(baseSettings());
    });
    const errorListener = vi.fn();
    element.addEventListener('edn-error', errorListener);

    await waitForForm(element);
    fill(input(element, 'wifiSSID'), 'NewNet');
    submit(element);

    await vi.waitFor(() => {
      expect(text(element)).toContain('wifiSSID too long');
    });
    const saveButton = element.shadowRoot?.querySelector<HTMLButtonElement>('button.primary');
    expect(saveButton?.disabled).toBe(false);
    expect(errorListener).toHaveBeenCalledTimes(1);
  });

  it('dispatches edn-saved and updates has-flags on success', async () => {
    const { element } = mount((_url, init) => {
      if (init?.method === 'POST') {
        return jsonResponse(baseSettings({ hasWifiPassword: true }));
      }
      return jsonResponse(baseSettings({ hasWifiPassword: false }));
    });
    const savedListener = vi.fn();
    element.addEventListener('edn-saved', savedListener);

    await waitForForm(element);
    fill(input(element, 'wifiPassword'), 'secret123');
    submit(element);

    await vi.waitFor(() => {
      expect(savedListener).toHaveBeenCalledTimes(1);
    });
    const event = savedListener.mock.calls[0][0] as CustomEvent<NetworkSettings>;
    expect(event.detail.hasWifiPassword).toBe(true);
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
    await element.updateComplete;
    expect(input(element, 'wifiPassword').value).toBe('');
    expect(text(element)).toContain('Password saved');
  });

  it('renders the scan list sorted by RSSI and click-to-fills the SSID', async () => {
    const { element } = mount((url) => {
      if (url.endsWith('/api/wifi/list')) {
        return jsonResponse({
          networks: [
            { ssid: 'Weak', rssi: -85, channel: 1, encrypted: false },
            { ssid: 'Strong', rssi: -40, channel: 11, encrypted: true },
            { ssid: 'Middle', rssi: -65, channel: 6, encrypted: true },
          ],
        });
      }
      return jsonResponse(baseSettings());
    });

    await waitForForm(element);
    element.shadowRoot?.querySelector<HTMLButtonElement>('.scan-head button')?.click();

    await vi.waitFor(() => {
      expect(element.shadowRoot?.querySelectorAll('ul.networks li')).toHaveLength(3);
    });
    const order = Array.from(
      element.shadowRoot?.querySelectorAll<HTMLButtonElement>('ul.networks .ssid') ?? [],
    ).map((node) => node.textContent?.trim());
    expect(order).toEqual(['Strong', 'Middle', 'Weak']);
    expect(element.shadowRoot?.querySelectorAll('.lock')).toHaveLength(2);

    element.shadowRoot?.querySelector<HTMLButtonElement>('ul.networks .network')?.click();
    await element.updateComplete;
    expect(input(element, 'wifiSSID').value).toBe('Strong');
  });

  it('shows a banner when the Wi-Fi scan fails', async () => {
    const { element } = mount((url) => {
      if (url.endsWith('/api/wifi/list')) {
        return jsonResponse({ error: 'scan failed' }, 500);
      }
      return jsonResponse(baseSettings());
    });

    await waitForForm(element);
    element.shadowRoot?.querySelector<HTMLButtonElement>('.scan-head button')?.click();

    await vi.waitFor(() => {
      expect(text(element)).toContain('scan failed');
    });
  });
});
