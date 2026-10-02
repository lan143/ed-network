import type { ApiResult, NetworkSettings, NetworkSettingsPatch, NetworkStatus, WifiListResponse } from './types';
export interface NetworkApiClientOptions {
    /** Prefix for every request path. Default '' = same origin. */
    baseUrl?: string;
    /** Extra request headers, merged over the defaults. */
    headers?: Record<string, string>;
}
export interface NetworkApiClient {
    getSettings(signal?: AbortSignal): Promise<ApiResult<NetworkSettings>>;
    saveSettings(patch: NetworkSettingsPatch, signal?: AbortSignal): Promise<ApiResult<NetworkSettings>>;
    getStatus(signal?: AbortSignal): Promise<ApiResult<NetworkStatus>>;
    wifiList(signal?: AbortSignal): Promise<ApiResult<WifiListResponse>>;
}
export declare function createNetworkApiClient(options?: NetworkApiClientOptions): NetworkApiClient;
