import type {
  ApiResult,
  NetworkSettings,
  NetworkSettingsPatch,
  NetworkStatus,
  WifiListResponse,
} from './types';

export interface NetworkApiClientOptions {
  /** Prefix for every request path. Default '' = same origin. */
  baseUrl?: string;
  /** Extra request headers, merged over the defaults. */
  headers?: Record<string, string>;
}

export interface NetworkApiClient {
  getSettings(signal?: AbortSignal): Promise<ApiResult<NetworkSettings>>;
  saveSettings(
    patch: NetworkSettingsPatch,
    signal?: AbortSignal,
  ): Promise<ApiResult<NetworkSettings>>;
  getStatus(signal?: AbortSignal): Promise<ApiResult<NetworkStatus>>;
  wifiList(signal?: AbortSignal): Promise<ApiResult<WifiListResponse>>;
}

const NETWORK_ERROR_MESSAGE =
  'Network request failed. Check the device connection and try again.';

function messageFromErrorBody(body: unknown): string | undefined {
  if (body && typeof body === 'object' && 'error' in body) {
    const value = (body as { error?: unknown }).error;
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

export function createNetworkApiClient(
  options: NetworkApiClientOptions = {},
): NetworkApiClient {
  const baseUrl = options.baseUrl ?? '';
  const extraHeaders = options.headers ?? {};

  async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          Accept: 'application/json',
          ...(init?.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...extraHeaders,
        },
      });
    } catch (error) {
      // An aborted request is its own outcome: no HTTP status, distinct message.
      const aborted =
        init?.signal?.aborted === true ||
        (typeof error === 'object' &&
          error !== null &&
          (error as { name?: string }).name === 'AbortError');
      if (aborted) {
        return { ok: false, message: 'Request aborted.' };
      }
      // Transport/DNS failures carry no HTTP status.
      return { ok: false, message: NETWORK_ERROR_MESSAGE };
    }

    // Reading the body must never throw through to the caller.
    const text = await response.text().catch(() => '');

    let parsed: unknown;
    let parsedOk = false;
    if (text.length > 0) {
      try {
        parsed = JSON.parse(text);
        parsedOk = true;
      } catch {
        parsedOk = false;
      }
    }

    if (!response.ok) {
      const serverMessage = messageFromErrorBody(parsed);
      return {
        ok: false,
        status: response.status,
        message: serverMessage ?? `Request failed with HTTP ${response.status}.`,
      };
    }

    if (!parsedOk) {
      return {
        ok: false,
        status: response.status,
        message: `Unexpected response from server (HTTP ${response.status}).`,
      };
    }

    return { ok: true, data: parsed as T };
  }

  return {
    getSettings(signal?: AbortSignal): Promise<ApiResult<NetworkSettings>> {
      return request<NetworkSettings>('/api/network/settings', { signal });
    },

    saveSettings(
      patch: NetworkSettingsPatch,
      signal?: AbortSignal,
    ): Promise<ApiResult<NetworkSettings>> {
      return request<NetworkSettings>('/api/network/settings', {
        method: 'POST',
        body: JSON.stringify(patch),
        signal,
      });
    },

    getStatus(signal?: AbortSignal): Promise<ApiResult<NetworkStatus>> {
      return request<NetworkStatus>('/api/network/status', { signal });
    },

    wifiList(signal?: AbortSignal): Promise<ApiResult<WifiListResponse>> {
      return request<WifiListResponse>('/api/wifi/list', { signal });
    },
  };
}
