// Response/request types for the ed-network REST API.
//
// Field shapes are verified directly against src/network/network_api.cpp.
// Important deviations from the initial brief, confirmed in source:
//   - Wi-Fi status fields are FLAT on the status object (ssid/rssi/ip/mac),
//     NOT nested under "wifi". See network_api.cpp:348-353.
//   - eth.duplex is serialized as an integer ((int)ETH.duplex()), NOT a
//     string. See network_api.cpp:368.

export type NetworkMode = 'ethernet' | 'wifi' | 'wifi_ap';

/**
 * Shape returned by GET /api/network/status (network_api.cpp:303-372).
 *
 * The Wi-Fi fields (ssid/rssi/ip/mac) are present only while the STA is
 * connected (network_api.cpp:348-353), so they are optional and flat.
 */
export interface NetworkStatus {
  mode: NetworkMode;
  connected: boolean;
  wifiConnected: boolean;
  ethernetConnected: boolean;
  fallbackAP: boolean;
  /** Flat Wi-Fi STA fields, present when WiFi.status() == WL_CONNECTED. */
  ssid?: string;
  rssi?: number;
  ip?: string;
  mac?: string;
  /** Present only in wifi_ap mode (network_api.cpp:355-360). */
  ap?: {
    ssid: string;
    ip: string;
    stations: number;
  };
  /** Present only in ethernet mode (network_api.cpp:362-369). */
  eth?: {
    ip: string;
    mac: string;
    linkUp: boolean;
    speed: number;
    /** int from (int)ETH.duplex(); 1 = full, 0 = half. */
    duplex: number;
  };
}

/**
 * Shape returned by GET /api/network/settings and POST /api/network/settings
 * (network_api.cpp:92-101). Passwords are never returned, only has-flags.
 */
export interface NetworkSettings {
  isAPMode: boolean;
  wifiAPSSID: string;
  /** Stored config flag; see network_api.cpp:97, 251-258. */
  wifiAPHasPassword: boolean;
  wifiSSID: string;
  /** Derived as strlen(wifiPassword) > 0; see network_api.cpp:99. */
  hasWifiPassword: boolean;
  /** Derived as strlen(wifiAPPassword) > 0; see network_api.cpp:100. */
  hasWifiAPPassword: boolean;
}

/**
 * Accepted POST /api/network/settings body keys
 * (network_api.cpp:190-258). All are optional; the server merges a patch.
 */
export interface NetworkSettingsPatch {
  wifiSSID?: string;
  wifiPassword?: string;
  wifiAPSSID?: string;
  wifiAPPassword?: string;
  isAPMode?: boolean;
  wifiAPHasPassword?: boolean;
}

/** One entry from GET /api/wifi/list (network_api.cpp:71-78). */
export interface WifiNetwork {
  ssid: string;
  rssi: number;
  channel: number;
  encrypted: boolean;
}

export interface WifiListResponse {
  networks: WifiNetwork[];
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiFailure {
  ok: false;
  /** Present for HTTP-level failures; absent for network/transport failures. */
  status?: number;
  message: string;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;
