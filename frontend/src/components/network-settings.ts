import { LitElement, css, html, nothing } from 'lit';
import type { PropertyValues, TemplateResult } from 'lit';
import { createNetworkApiClient } from '../api/client';
import type { NetworkApiClient } from '../api/client';
import type {
  ApiResult,
  NetworkSettings,
  NetworkSettingsPatch,
  WifiListResponse,
  WifiNetwork,
} from '../api/types';

type Mode = 'station' | 'ap';

// Limits mirrored from network_api.cpp.
// WIFI_SSID_LEN = 33 and the check is `length >= 33`, so the max is 32
// (network_api.cpp:195,221). WIFI_PWD_LEN = 65 with `length >= 65`, so max 64
// (network_api.cpp:208,234). AP passwords additionally require >= 8 when the
// has-password flag is set (network_api.cpp:264).
//
// The server measures in UTF-8 BYTES (Arduino String.length() counts bytes),
// so the client must too — a 32-char Cyrillic SSID is 64 bytes and rejected.
const MAX_SSID_BYTES = 32;
const MAX_PASSWORD_BYTES = 64;
const MIN_AP_PASSWORD_BYTES = 8;
const SCAN_TIMEOUT_MS = 5000;

const utf8Encoder = new TextEncoder();

/** UTF-8 byte length; mirrors the server's byte-based length checks. */
function utf8Length(value: string): number {
  return utf8Encoder.encode(value).length;
}

interface FieldErrors {
  wifiSSID?: string;
  wifiPassword?: string;
  wifiAPSSID?: string;
  wifiAPPassword?: string;
}

function modeOf(settings: NetworkSettings): Mode {
  return settings.isAPMode ? 'ap' : 'station';
}

export class EdnNetworkSettings extends LitElement {
  static override properties = {
    baseUrl: { type: String, attribute: 'base-url' },
    settings: { state: true },
    loading: { state: true },
    submitting: { state: true },
    errorMessage: { state: true },
    successMessage: { state: true },
    draftMode: { state: true },
    draftWifiSSID: { state: true },
    draftWifiPassword: { state: true },
    draftWifiPasswordDirty: { state: true },
    draftApSSID: { state: true },
    draftApHasPassword: { state: true },
    draftApPassword: { state: true },
    draftApPasswordDirty: { state: true },
    fieldErrors: { state: true },
    scanning: { state: true },
    scanResults: { state: true },
    scanError: { state: true },
  };

  static override styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      color: #1f2430;
      --_accent: var(--edn-accent, #2563eb);
      --_danger: var(--edn-danger, #dc2626);
      --_muted: var(--edn-muted, #6b7280);
      --_border: #e2e5ea;
      --_surface: #ffffff;
    }

    .card {
      background: var(--_surface);
      border: 1px solid var(--_border);
      border-radius: 10px;
      padding: 1rem 1.25rem;
      max-width: 30rem;
      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
    }

    h1 {
      font-size: 1rem;
      margin: 0 0 0.75rem;
    }

    h2 {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--_muted);
      margin: 0 0 0.5rem;
    }

    .banner {
      margin: 0 0 0.75rem;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      justify-content: space-between;
    }

    .banner-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: var(--_danger);
    }

    .banner-success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #15803d;
    }

    fieldset {
      border: 0;
      padding: 0;
      margin: 0 0 0.75rem;
    }

    legend {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--_muted);
      margin-bottom: 0.35rem;
    }

    .segmented {
      display: inline-flex;
      border: 1px solid var(--_border);
      border-radius: 8px;
      overflow: hidden;
    }

    .seg {
      font: inherit;
      font-size: 0.85rem;
      padding: 0.35rem 0.85rem;
      border: 0;
      background: transparent;
      color: var(--_muted);
      cursor: pointer;
    }

    .seg.active {
      background: var(--_accent);
      color: #ffffff;
    }

    .group {
      border-top: 1px solid var(--_border);
      padding-top: 0.75rem;
      margin-bottom: 0.75rem;
    }

    label {
      display: block;
      font-size: 0.85rem;
      margin-bottom: 0.6rem;
    }

    input[type='text'],
    input[type='password'] {
      display: block;
      width: 100%;
      box-sizing: border-box;
      margin-top: 0.25rem;
      font: inherit;
      font-size: 0.9rem;
      padding: 0.4rem 0.55rem;
      border: 1px solid var(--_border);
      border-radius: 6px;
      background: #fff;
      color: inherit;
    }

    input[type='text']:focus,
    input[type='password']:focus {
      outline: 2px solid color-mix(in srgb, var(--_accent) 45%, transparent);
      outline-offset: 1px;
      border-color: var(--_accent);
    }

    .check {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.85rem;
    }

    .hint {
      font-size: 0.78rem;
      color: var(--_muted);
      margin: -0.3rem 0 0.5rem;
    }

    .field-error {
      font-size: 0.78rem;
      color: var(--_danger);
      margin: -0.3rem 0 0.6rem;
    }

    .clear-warning {
      font-size: 0.78rem;
      color: var(--_danger);
      margin: -0.3rem 0 0.6rem;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      border-top: 1px solid var(--_border);
      padding-top: 0.75rem;
    }

    button {
      font: inherit;
      font-size: 0.8rem;
      padding: 0.3rem 0.7rem;
      border-radius: 6px;
      border: 1px solid currentColor;
      background: transparent;
      color: var(--_accent);
      cursor: pointer;
    }

    button:hover:not(:disabled) {
      background: rgba(37, 99, 235, 0.08);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .primary {
      background: var(--_accent);
      border-color: var(--_accent);
      color: #ffffff;
    }

    .primary:hover:not(:disabled) {
      background: color-mix(in srgb, var(--_accent) 88%, #000);
    }

    .scan-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .scan-head h2 {
      margin: 0;
    }

    ul.networks {
      list-style: none;
      margin: 0.5rem 0 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .network {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      width: 100%;
      text-align: left;
      border: 1px solid var(--_border);
      border-radius: 6px;
      padding: 0.35rem 0.55rem;
      color: inherit;
    }

    .network .ssid {
      font-size: 0.85rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .network .meta {
      font-size: 0.75rem;
      color: var(--_muted);
      white-space: nowrap;
    }

    .lock {
      color: var(--_muted);
    }

    .muted {
      color: var(--_muted);
    }

    .status {
      font-size: 0.85rem;
      color: var(--_muted);
    }
  `;

  /** Prefix for API requests. Empty string means same origin. */
  baseUrl = '';

  settings: NetworkSettings | null = null;
  loading = false;
  submitting = false;
  errorMessage = '';
  successMessage = '';

  draftMode: Mode = 'station';
  draftWifiSSID = '';
  draftWifiPassword = '';
  draftWifiPasswordDirty = false;
  draftApSSID = '';
  draftApHasPassword = false;
  draftApPassword = '';
  draftApPasswordDirty = false;

  fieldErrors: FieldErrors = {};

  scanning = false;
  scanResults: WifiNetwork[] = [];
  scanError = '';

  private client?: NetworkApiClient;
  private clientBaseUrl?: string;
  /** Monotonic token so late results from an older load() are ignored. */
  private loadToken = 0;
  /** baseUrl the currently displayed settings were loaded from. */
  private settingsBaseUrl: string | null = null;
  /** In-flight scan request; aborted on timeout and on disconnect. */
  private scanController?: AbortController;

  override connectedCallback(): void {
    super.connectedCallback();
    void this.load();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.scanController?.abort();
    this.scanController = undefined;
  }

  override updated(changed: PropertyValues<this>): void {
    const previousBaseUrl = changed.get('baseUrl');
    if (
      changed.has('baseUrl') &&
      previousBaseUrl !== undefined &&
      previousBaseUrl !== this.baseUrl
    ) {
      this.client = undefined;
      this.scanResults = [];
      this.scanError = '';
      void this.load();
    }
  }

  override render(): TemplateResult {
    const settings = this.settings;
    return html`
      <div class="card">
        <h1>Network settings</h1>
        ${this.errorMessage
          ? html`<div class="banner banner-error" role="alert">
              <span>${this.errorMessage}</span>
              <button type="button" @click=${this.handleRetry}>Retry</button>
            </div>`
          : nothing}
        ${this.successMessage
          ? html`<div class="banner banner-success" role="status">${this.successMessage}</div>`
          : nothing}
        ${settings
          ? html`${this.renderForm(settings)} ${this.renderScan()}`
          : this.loading
            ? html`<p class="status">Loading settings…</p>`
            : html`<p class="status">Settings unavailable.</p>`}
      </div>
    `;
  }

  private renderForm(settings: NetworkSettings): TemplateResult {
    return html`
      <form @submit=${this.handleSubmit}>
        <fieldset>
          <legend>Mode</legend>
          <div class="segmented" role="group" aria-label="Network mode">
            <button
              type="button"
              class="seg ${this.draftMode === 'station' ? 'active' : ''}"
              aria-pressed=${this.draftMode === 'station'}
              @click=${() => this.setMode('station')}
            >
              Station
            </button>
            <button
              type="button"
              class="seg ${this.draftMode === 'ap' ? 'active' : ''}"
              aria-pressed=${this.draftMode === 'ap'}
              @click=${() => this.setMode('ap')}
            >
              Access Point
            </button>
          </div>
        </fieldset>

        ${this.draftMode === 'station'
          ? this.renderStation(settings)
          : this.renderAccessPoint(settings)}

        <div class="actions">
          <button class="primary" type="submit" ?disabled=${this.submitting || !this.dirty}>
            ${this.submitting ? 'Saving…' : 'Save'}
          </button>
          ${this.dirty ? html`<span class="muted">Unsaved changes</span>` : nothing}
        </div>
      </form>
    `;
  }

  private renderStation(settings: NetworkSettings): TemplateResult {
    return html`
      <section class="group">
        <h2>Station</h2>
        <label>
          Wi-Fi name
          <input
            name="wifiSSID"
            type="text"
            autocomplete="off"
            .value=${this.draftWifiSSID}
            @input=${this.handleWifiSSIDInput}
          />
        </label>
        ${this.renderFieldError('wifiSSID')}
        <label>
          Wi-Fi password
          <input
            name="wifiPassword"
            type="password"
            autocomplete="new-password"
            placeholder=${settings.hasWifiPassword ? 'Leave blank to keep saved password' : 'No password set'}
            .value=${this.draftWifiPassword}
            @input=${this.handleWifiPasswordInput}
          />
        </label>
        ${settings.hasWifiPassword
          ? html`<p class="hint">Password saved •••• (leave blank to keep)</p>`
          : nothing}
        ${this.renderPasswordClearWarning('wifiPassword')}
        ${this.renderFieldError('wifiPassword')}
      </section>
    `;
  }

  private renderAccessPoint(settings: NetworkSettings): TemplateResult {
    return html`
      <section class="group">
        <h2>Access point</h2>
        <label>
          Access point name
          <input
            name="wifiAPSSID"
            type="text"
            autocomplete="off"
            .value=${this.draftApSSID}
            @input=${this.handleApSSIDInput}
          />
        </label>
        ${this.renderFieldError('wifiAPSSID')}
        <label class="check">
          <input
            type="checkbox"
            .checked=${this.draftApHasPassword}
            @change=${this.handleApHasPasswordChange}
          />
          Require password
        </label>
        ${this.draftApHasPassword
          ? html`
              <label>
                Access point password
                <input
                  name="wifiAPPassword"
                  type="password"
                  autocomplete="new-password"
                  placeholder=${settings.hasWifiAPPassword ? 'Leave blank to keep saved password' : 'At least 8 characters'}
                  .value=${this.draftApPassword}
                  @input=${this.handleApPasswordInput}
                />
              </label>
              ${settings.hasWifiAPPassword
                ? html`<p class="hint">Password saved •••• (leave blank to keep)</p>`
                : nothing}
              ${this.renderPasswordClearWarning('wifiAPPassword')}
              ${this.renderFieldError('wifiAPPassword')}
            `
          : nothing}
      </section>
    `;
  }

  private renderScan(): TemplateResult {
    return html`
      <section class="group">
        <div class="scan-head">
          <h2>Wi-Fi scan</h2>
          <button type="button" @click=${this.handleScan} ?disabled=${this.scanning}>
            ${this.scanning ? 'Scanning…' : 'Scan'}
          </button>
        </div>
        ${this.scanError
          ? html`<div class="banner banner-error" role="alert">${this.scanError}</div>`
          : nothing}
        ${this.scanResults.length > 0
          ? html`<ul class="networks">
              ${this.scanResults.map((network) => this.renderNetwork(network))}
            </ul>`
          : nothing}
      </section>
    `;
  }

  private renderNetwork(network: WifiNetwork): TemplateResult {
    return html`
      <li>
        <button type="button" class="network" @click=${() => this.handlePickSsid(network.ssid)}>
          <span class="ssid">${network.ssid}</span>
          <span class="meta">
            ${network.encrypted
              ? html`<span class="lock" title="Encrypted" aria-label="Encrypted">🔒</span>`
              : nothing}
            ${network.rssi} dBm · Ch ${network.channel}
          </span>
        </button>
      </li>
    `;
  }

  private renderFieldError(field: keyof FieldErrors): TemplateResult | typeof nothing {
    const message = this.fieldErrors[field];
    return message ? html`<p class="field-error" role="alert">${message}</p>` : nothing;
  }

  /**
   * Danger-styled notice shown before Save when the user explicitly emptied a
   * password field that has a stored counterpart: the patch will send `""`,
   * which the server interprets as "clear" (network_api.cpp:203-214).
   */
  private renderPasswordClearWarning(
    field: 'wifiPassword' | 'wifiAPPassword',
  ): TemplateResult | typeof nothing {
    const clearing =
      field === 'wifiPassword'
        ? this.draftWifiPasswordDirty &&
          this.draftWifiPassword === '' &&
          this.settings?.hasWifiPassword === true
        : this.draftApPasswordDirty &&
          this.draftApPassword === '' &&
          this.draftApHasPassword &&
          this.settings?.hasWifiAPPassword === true;
    return clearing
      ? html`<p class="clear-warning" role="alert">
          Warning: saving now will remove the stored password.
        </p>`
      : nothing;
  }

  private get dirty(): boolean {
    const settings = this.settings;
    if (!settings) {
      return false;
    }
    return (
      this.draftMode !== modeOf(settings) ||
      this.draftWifiSSID !== settings.wifiSSID ||
      this.draftApSSID !== settings.wifiAPSSID ||
      this.draftApHasPassword !== settings.wifiAPHasPassword ||
      this.draftWifiPasswordDirty ||
      this.draftApPasswordDirty
    );
  }

  private ensureClient(): NetworkApiClient {
    if (!this.client || this.clientBaseUrl !== this.baseUrl) {
      this.client = createNetworkApiClient({ baseUrl: this.baseUrl });
      this.clientBaseUrl = this.baseUrl;
    }
    return this.client;
  }

  private async load(): Promise<void> {
    const token = ++this.loadToken;
    this.loading = true;
    const result = await this.ensureClient().getSettings();
    if (token !== this.loadToken) {
      // A newer load owns the UI now: never apply stale data, and never leave
      // a previous device's settings editable under a different baseUrl.
      if (this.settingsBaseUrl !== this.baseUrl) {
        this.settings = null;
      }
      return;
    }
    this.loading = false;

    if (result.ok) {
      this.applyServerSettings(result.data);
      this.errorMessage = '';
      return;
    }

    // A plain refresh failure of the same device keeps the form so the user
    // can retry; a failure after a baseUrl change must not keep the previous
    // device's settings editable.
    if (this.settingsBaseUrl !== this.baseUrl) {
      this.settings = null;
    }
    this.errorMessage = result.message;
    this.emitError(result.message);
  }

  /** Resets the draft from server state. Passwords are intentionally never populated. */
  private applyServerSettings(settings: NetworkSettings): void {
    this.settings = settings;
    this.settingsBaseUrl = this.baseUrl;
    this.draftMode = modeOf(settings);
    this.draftWifiSSID = settings.wifiSSID;
    this.draftApSSID = settings.wifiAPSSID;
    this.draftApHasPassword = settings.wifiAPHasPassword;
    this.draftWifiPassword = '';
    this.draftWifiPasswordDirty = false;
    this.draftApPassword = '';
    this.draftApPasswordDirty = false;
    this.fieldErrors = {};
  }

  private validate(): FieldErrors {
    const settings = this.settings;
    const errors: FieldErrors = {};
    if (!settings) {
      return errors;
    }
    const isApMode = this.draftMode === 'ap';

    // Length caps always apply to a changed/present SSID and are measured in
    // UTF-8 BYTES to match the server (network_api.cpp:195,221).
    if (utf8Length(this.draftWifiSSID) > MAX_SSID_BYTES) {
      errors.wifiSSID = `Wi-Fi name must be ${MAX_SSID_BYTES} characters or fewer.`;
    }
    if (utf8Length(this.draftApSSID) > MAX_SSID_BYTES) {
      errors.wifiAPSSID = `Access point name must be ${MAX_SSID_BYTES} characters or fewer.`;
    }

    // Required-in-mode rules mirror the merged-config checks (network_api.cpp:269-277).
    if (isApMode) {
      if (this.draftApSSID.length === 0) {
        errors.wifiAPSSID = 'Access point name is required in AP mode.';
      }
    } else if (this.draftWifiSSID.length === 0) {
      errors.wifiSSID = 'Wi-Fi name is required in station mode.';
    }

    if (this.draftWifiPasswordDirty && utf8Length(this.draftWifiPassword) > MAX_PASSWORD_BYTES) {
      errors.wifiPassword = `Wi-Fi password must be ${MAX_PASSWORD_BYTES} characters or fewer.`;
    }

    if (this.draftApHasPassword) {
      if (this.draftApPasswordDirty) {
        // An explicitly typed AP password must satisfy 8..64 BYTES
        // (network_api.cpp:264 measures bytes via strlen).
        const apPasswordBytes = utf8Length(this.draftApPassword);
        if (
          apPasswordBytes < MIN_AP_PASSWORD_BYTES ||
          apPasswordBytes > MAX_PASSWORD_BYTES
        ) {
          errors.wifiAPPassword = `Access point password must be ${MIN_AP_PASSWORD_BYTES}–${MAX_PASSWORD_BYTES} characters.`;
        }
      } else if (!settings.hasWifiAPPassword) {
        // Blank keeps a stored password; with none stored the server will reject.
        errors.wifiAPPassword = `Enter an access point password (${MIN_AP_PASSWORD_BYTES}–${MAX_PASSWORD_BYTES} characters).`;
      }
    }

    return errors;
  }

  /** Only changed fields are sent; omitted password keys keep the stored value. */
  private buildPatch(): NetworkSettingsPatch {
    const settings = this.settings;
    const patch: NetworkSettingsPatch = {};
    if (!settings) {
      return patch;
    }
    const isApMode = this.draftMode === 'ap';

    if (isApMode !== settings.isAPMode) {
      patch.isAPMode = isApMode;
    }
    if (this.draftWifiSSID !== settings.wifiSSID) {
      patch.wifiSSID = this.draftWifiSSID;
    }
    if (this.draftWifiPasswordDirty) {
      // An empty string is sent explicitly to clear (network_api.cpp:203-214).
      patch.wifiPassword = this.draftWifiPassword;
    }
    if (this.draftApSSID !== settings.wifiAPSSID) {
      patch.wifiAPSSID = this.draftApSSID;
    }
    if (this.draftApHasPassword !== settings.wifiAPHasPassword) {
      patch.wifiAPHasPassword = this.draftApHasPassword;
    }
    if (this.draftApHasPassword && this.draftApPasswordDirty) {
      patch.wifiAPPassword = this.draftApPassword;
    }
    return patch;
  }

  private async handleSave(): Promise<void> {
    if (this.submitting || !this.settings) {
      return;
    }
    const errors = this.validate();
    this.fieldErrors = errors;
    if (Object.keys(errors).length > 0) {
      return;
    }
    const patch = this.buildPatch();
    if (Object.keys(patch).length === 0) {
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    const result = await this.ensureClient().saveSettings(patch);
    this.submitting = false;

    if (result.ok) {
      this.applyServerSettings(result.data);
      this.successMessage = 'Settings saved.';
      this.dispatchEvent(
        new CustomEvent<NetworkSettings>('edn-saved', {
          detail: result.data,
          bubbles: true,
          composed: true,
        }),
      );
      return;
    }

    // Leave the draft and dirty flags untouched so the user can correct it.
    // A transport failure has no status: the device may have applied the
    // config right after the 200 would have been sent, then dropped the link
    // (network_api.cpp:299-300).
    const message =
      result.status === undefined
        ? 'Could not confirm the save — the device may have applied the changes and reconnected. Check the status widget or retry.'
        : result.message;
    this.errorMessage = message;
    this.emitError(message);
  }

  private async handleScan(): Promise<void> {
    if (this.scanning) {
      return;
    }
    this.scanning = true;
    this.scanError = '';

    // Abort the in-flight fetch when the timeout fires or the component goes
    // away, so no scan request survives past its timeout message.
    const controller = new AbortController();
    this.scanController = controller;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<ApiResult<WifiListResponse>>((resolve) => {
      timer = setTimeout(() => {
        controller.abort();
        resolve({ ok: false, message: 'Wi-Fi scan timed out after 5 seconds.' });
      }, SCAN_TIMEOUT_MS);
    });

    const result = await Promise.race([
      this.ensureClient().wifiList(controller.signal),
      timeout,
    ]);
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    if (this.scanController === controller) {
      this.scanController = undefined;
    }
    this.scanning = false;

    if (result.ok) {
      this.scanResults = [...result.data.networks].sort((a, b) => b.rssi - a.rssi);
      return;
    }

    // Abort results are already reported (timeout) or moot (disconnected).
    if (result.message === 'Request aborted.') {
      return;
    }

    this.scanError = result.message;
    this.emitError(result.message);
  }

  private emitError(message: string): void {
    this.dispatchEvent(
      new CustomEvent<{ message: string }>('edn-error', {
        detail: { message },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private setMode(mode: Mode): void {
    if (this.draftMode === mode) {
      return;
    }
    this.draftMode = mode;
    this.fieldErrors = {};
  }

  private handleWifiSSIDInput = (event: Event): void => {
    this.draftWifiSSID = (event.target as HTMLInputElement).value;
  };

  private handleWifiPasswordInput = (event: Event): void => {
    this.draftWifiPassword = (event.target as HTMLInputElement).value;
    this.draftWifiPasswordDirty = true;
  };

  private handleApSSIDInput = (event: Event): void => {
    this.draftApSSID = (event.target as HTMLInputElement).value;
  };

  private handleApPasswordInput = (event: Event): void => {
    this.draftApPassword = (event.target as HTMLInputElement).value;
    this.draftApPasswordDirty = true;
  };

  private handleApHasPasswordChange = (event: Event): void => {
    this.draftApHasPassword = (event.target as HTMLInputElement).checked;
    if (!this.draftApHasPassword) {
      // The server wipes the stored AP password when the flag is false
      // (network_api.cpp:260-262), so drop any local draft too.
      this.draftApPassword = '';
      this.draftApPasswordDirty = false;
      this.fieldErrors = { ...this.fieldErrors, wifiAPPassword: undefined };
    }
  };

  private handlePickSsid = (ssid: string): void => {
    if (this.draftMode !== 'station') {
      this.draftMode = 'station';
    }
    this.draftWifiSSID = ssid;
    this.fieldErrors = { ...this.fieldErrors, wifiSSID: undefined };
  };

  private handleSubmit = (event: Event): void => {
    event.preventDefault();
    void this.handleSave();
  };

  private handleRetry = (): void => {
    void this.load();
  };
}

if (typeof customElements !== 'undefined' && !customElements.get('edn-network-settings')) {
  customElements.define('edn-network-settings', EdnNetworkSettings);
}
