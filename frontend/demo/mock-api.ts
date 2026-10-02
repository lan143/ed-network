import type {
  NetworkSettings,
  NetworkSettingsPatch,
  NetworkStatus,
  WifiListResponse,
} from '../src/api/types';

export interface MockApiOptions {
  /** Artificial latency so the loading state is visible. Default 120 ms. */
  latencyMs?: number;
}

interface MockResult {
  status: number;
  body: unknown;
}

interface MockState {
  settingsView(): NetworkSettings;
  nextStatus(): NetworkStatus;
  nextWifiList(): WifiListResponse | { error: string };
  applyPatch(patch: NetworkSettingsPatch): MockResult;
}

// Mirrors the server-side limits in network_api.cpp: WIFI_SSID_LEN / WIFI_PWD_LEN
// and the 2048-byte body cap. Length checks are UTF-8 BYTES to match the
// server's Arduino String.length()/strlen() byte counting (network_api.cpp:195,
// 208, 221, 234, 264).
const MAX_BODY_BYTES = 2048;
const MAX_SSID_BYTES = 32;
const MAX_PASSWORD_BYTES = 64;
const MIN_AP_PASSWORD_BYTES = 8;

const utf8Encoder = new TextEncoder();

function utf8Length(value: string): number {
  return utf8Encoder.encode(value).length;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createMockState(): MockState {
  const settings: NetworkSettings = {
    isAPMode: false,
    wifiAPSSID: 'ed-network',
    wifiAPHasPassword: true,
    wifiSSID: 'HomeNet',
    hasWifiPassword: true,
    hasWifiAPPassword: true,
  };
  // The server stores plaintext but only ever exposes derived has-flags
  // (network_api.cpp:92-101); the mock keeps plaintext privately for the same reason.
  let wifiPassword = 'homesecret';
  let apPassword = 'ednetwork123';

  const statusScenarios: NetworkStatus[] = [
    {
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
    },
    {
      mode: 'wifi',
      connected: true,
      wifiConnected: true,
      ethernetConnected: false,
      fallbackAP: false,
      ssid: 'HomeNet',
      rssi: -58,
      ip: '192.168.1.42',
      mac: 'AA:BB:CC:DD:EE:02',
    },
    {
      mode: 'wifi_ap',
      connected: false,
      wifiConnected: false,
      ethernetConnected: false,
      fallbackAP: true,
      ap: { ssid: 'ed-network', ip: '192.168.4.1', stations: 2 },
    },
  ];

  const wifiNetworks: WifiListResponse['networks'] = [
    { ssid: 'HomeNet', rssi: -58, channel: 6, encrypted: true },
    { ssid: 'Neighbor_5G', rssi: -71, channel: 44, encrypted: true },
    { ssid: 'Guest', rssi: -80, channel: 1, encrypted: false },
  ];

  let statusIndex = 0;
  let wifiListIndex = 0;

  return {
    settingsView(): NetworkSettings {
      return { ...settings };
    },

    nextStatus(): NetworkStatus {
      const scenario = statusScenarios[statusIndex % statusScenarios.length];
      statusIndex += 1;
      return scenario;
    },

    nextWifiList(): WifiListResponse | { error: string } {
      wifiListIndex += 1;
      if (wifiListIndex % 3 === 0) {
        return { error: 'scan failed' };
      }
      return { networks: wifiNetworks };
    },

    // Mirrors network_api.cpp:116-301: merge the patch onto a copy of the stored
    // config, then run the clear/length/mode checks against the MERGED result.
    applyPatch(patch: NetworkSettingsPatch): MockResult {
      let isAPMode = settings.isAPMode;
      let wifiSSID = settings.wifiSSID;
      let wifiAPSSID = settings.wifiAPSSID;
      let wifiAPHasPassword = settings.wifiAPHasPassword;
      let nextWifiPassword = wifiPassword;
      let nextApPassword = apPassword;

      // Only a *present* key is applied. An omitted key keeps the stored value;
      // an empty string is present, so it clears (network_api.cpp:149-166,203-214,229-240).
      if (typeof patch.wifiSSID === 'string') {
        if (utf8Length(patch.wifiSSID) > MAX_SSID_BYTES) {
          return { status: 400, body: { error: 'wifiSSID too long' } };
        }
        wifiSSID = patch.wifiSSID;
      }
      if (typeof patch.wifiPassword === 'string') {
        if (utf8Length(patch.wifiPassword) > MAX_PASSWORD_BYTES) {
          return { status: 400, body: { error: 'wifiPassword too long' } };
        }
        nextWifiPassword = patch.wifiPassword;
      }
      if (typeof patch.wifiAPSSID === 'string') {
        if (utf8Length(patch.wifiAPSSID) > MAX_SSID_BYTES) {
          return { status: 400, body: { error: 'wifiAPSSID too long' } };
        }
        wifiAPSSID = patch.wifiAPSSID;
      }
      if (typeof patch.wifiAPPassword === 'string') {
        if (utf8Length(patch.wifiAPPassword) > MAX_PASSWORD_BYTES) {
          return { status: 400, body: { error: 'wifiAPPassword too long' } };
        }
        nextApPassword = patch.wifiAPPassword;
      }
      if (typeof patch.isAPMode === 'boolean') {
        isAPMode = patch.isAPMode;
      }
      if (typeof patch.wifiAPHasPassword === 'boolean') {
        wifiAPHasPassword = patch.wifiAPHasPassword;
      }

      // Unsetting the flag always wipes the stored AP password, even when the
      // flag was already false and no password was sent (network_api.cpp:260-262).
      if (!wifiAPHasPassword) {
        nextApPassword = '';
      }

      // An untouched blank AP password keeps the stored one, so this only fails
      // when the flag is set and no usable password exists (network_api.cpp:264-267).
      if (wifiAPHasPassword && utf8Length(nextApPassword) < MIN_AP_PASSWORD_BYTES) {
        return { status: 400, body: { error: 'wifiAPPassword must be at least 8 characters' } };
      }
      if (isAPMode && wifiAPSSID.length === 0) {
        return { status: 400, body: { error: 'wifiAPSSID required in AP mode' } };
      }
      if (!isAPMode && wifiSSID.length === 0) {
        return { status: 400, body: { error: 'wifiSSID required in client mode' } };
      }

      settings.isAPMode = isAPMode;
      settings.wifiSSID = wifiSSID;
      settings.wifiAPSSID = wifiAPSSID;
      settings.wifiAPHasPassword = wifiAPHasPassword;
      wifiPassword = nextWifiPassword;
      apPassword = nextApPassword;
      settings.hasWifiPassword = wifiPassword.length > 0;
      settings.hasWifiAPPassword = apPassword.length > 0;
      return { status: 200, body: { ...settings } };
    },
  };
}

function handleSave(state: MockState, init?: RequestInit): Response {
  const body = typeof init?.body === 'string' ? init.body : '';
  if (body.length > MAX_BODY_BYTES) {
    return json({ error: 'request body too large' }, 400);
  }

  let patch: NetworkSettingsPatch;
  try {
    patch = body.length > 0 ? (JSON.parse(body) as NetworkSettingsPatch) : {};
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  const result = state.applyPatch(patch);
  return json(result.body, result.status);
}

/**
 * Monkey-patches window.fetch for the four ed-network REST endpoints.
 * Returns an uninstall function that restores the original fetch.
 */
export function installMockApi(options: MockApiOptions = {}): () => void {
  const latencyMs = options.latencyMs ?? 120;
  const originalFetch = window.fetch;
  const state = createMockState();

  const patched = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const raw =
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw, window.location.href);

    await delay(latencyMs);

    if (url.pathname === '/api/network/status') {
      return json(state.nextStatus());
    }
    if (url.pathname === '/api/wifi/list') {
      const result = state.nextWifiList();
      return 'error' in result ? json({ error: result.error }, 500) : json(result);
    }
    if (url.pathname === '/api/network/settings') {
      const method = (init?.method ?? 'GET').toUpperCase();
      return method === 'GET' ? json(state.settingsView()) : handleSave(state, init);
    }

    return originalFetch(input, init);
  }) as typeof fetch;

  window.fetch = patched;
  return () => {
    if (window.fetch === patched) {
      window.fetch = originalFetch;
    }
  };
}
