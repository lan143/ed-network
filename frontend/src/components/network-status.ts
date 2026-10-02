import { LitElement, css, html, nothing } from 'lit';
import type { PropertyValues, TemplateResult } from 'lit';
import { createNetworkApiClient } from '../api/client';
import type { NetworkApiClient } from '../api/client';
import type { NetworkStatus } from '../api/types';

const MODE_LABELS: Record<NetworkStatus['mode'], string> = {
  ethernet: 'Ethernet',
  wifi: 'Wi-Fi',
  wifi_ap: 'Wi-Fi AP',
};

function signalQualityLabel(rssi: number | undefined): string {
  if (rssi === undefined || Number.isNaN(rssi)) {
    return 'Unknown';
  }
  if (rssi >= -55) {
    return 'Excellent';
  }
  if (rssi >= -67) {
    return 'Good';
  }
  if (rssi >= -75) {
    return 'Fair';
  }
  return 'Weak';
}

// ETH.duplex() is serialized as an int in network_api.cpp:368; 1 = full, 0 = half.
function duplexLabel(duplex: number): string {
  if (duplex === 1) {
    return 'Full';
  }
  if (duplex === 0) {
    return 'Half';
  }
  return `Unknown (${duplex})`;
}

function formatTime(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export class EdnNetworkStatus extends LitElement {
  static override properties = {
    baseUrl: { type: String, attribute: 'base-url' },
    pollIntervalMs: { type: Number, attribute: 'poll-interval-ms' },
    status: { state: true },
    errorMessage: { state: true },
    lastUpdated: { state: true },
    loading: { state: true },
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
      max-width: 28rem;
      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
    }

    .head {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .badge {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      background: #eef2ff;
      color: var(--_accent);
    }

    .badge-ethernet {
      background: #e0f2fe;
      color: #0369a1;
    }

    .badge-wifi_ap {
      background: #fef3c7;
      color: #b45309;
    }

    .badge-unknown {
      background: #f3f4f6;
      color: var(--_muted);
    }

    .state {
      font-size: 0.85rem;
      font-weight: 600;
    }

    .state-up {
      color: #15803d;
    }

    .state-down {
      color: var(--_muted);
    }

    .loading {
      font-size: 0.8rem;
      margin-left: auto;
    }

    .banner {
      margin-top: 0.75rem;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      justify-content: space-between;
    }

    .banner-warn {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
    }

    .banner-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: var(--_danger);
    }

    section {
      margin-top: 1rem;
    }

    h2 {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--_muted);
      margin: 0 0 0.5rem;
    }

    .rows {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.35rem 0.75rem;
      margin: 0;
    }

    dt {
      color: var(--_muted);
      font-size: 0.85rem;
    }

    dd {
      margin: 0;
      font-size: 0.9rem;
      word-break: break-word;
    }

    .muted {
      color: var(--_muted);
    }

    .foot {
      margin-top: 1rem;
      font-size: 0.75rem;
    }

    button {
      font: inherit;
      font-size: 0.8rem;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      border: 1px solid currentColor;
      background: transparent;
      color: var(--_accent);
      cursor: pointer;
    }

    button:hover {
      background: rgba(37, 99, 235, 0.08);
    }
  `;

  /** Prefix for API requests. Empty string means same origin. */
  baseUrl = '';

  /** Auto-refresh period in ms. 0 disables polling. */
  pollIntervalMs = 10000;

  status?: NetworkStatus;
  errorMessage = '';
  lastUpdated?: Date;
  loading = false;

  private timerId?: ReturnType<typeof setInterval>;
  private client?: NetworkApiClient;
  private clientBaseUrl?: string;
  /** Monotonic token so a slow refresh result never overwrites a newer one. */
  private refreshSeq = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    void this.refresh();
    this.startPolling();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopPolling();
  }

  override updated(changed: PropertyValues<this>): void {
    if (changed.has('pollIntervalMs')) {
      this.startPolling();
    }
    // Skip the first update: Lit reports class-field defaults ('' from undefined)
    // as a change, but connectedCallback already performed the initial fetch.
    const previousBaseUrl = changed.get('baseUrl');
    if (
      changed.has('baseUrl') &&
      previousBaseUrl !== undefined &&
      previousBaseUrl !== this.baseUrl
    ) {
      this.client = undefined;
      void this.refresh();
    }
  }

  override render(): TemplateResult {
    const status = this.status;
    return html`
      <div class="card">
        <header class="head">
          ${status
            ? html`<span class="badge badge-${status.mode}">${MODE_LABELS[status.mode]}</span>`
            : html`<span class="badge badge-unknown">Unknown</span>`}
          ${status
            ? html`<span class="state ${status.connected ? 'state-up' : 'state-down'}">
                ${status.connected ? 'Connected' : 'Disconnected'}
              </span>`
            : nothing}
          ${this.loading ? html`<span class="muted loading">Refreshing…</span>` : nothing}
        </header>

        ${status?.fallbackAP
          ? html`<div class="banner banner-warn" role="alert">
              Fallback AP active — the device could not reach the configured network.
            </div>`
          : nothing}
        ${this.errorMessage
          ? html`<div class="banner banner-error" role="alert">
              <span>${this.errorMessage}</span>
              <button type="button" @click=${this.handleRetry}>Retry</button>
            </div>`
          : nothing}
        ${status
          ? this.renderSections(status)
          : html`<p class="muted">Loading network status…</p>`}

        <footer class="muted foot">
          ${this.lastUpdated
            ? html`Updated ${formatTime(this.lastUpdated)}`
            : html`Waiting for data…`}
        </footer>
      </div>
    `;
  }

  private renderSections(status: NetworkStatus): TemplateResult {
    switch (status.mode) {
      case 'wifi':
        return this.renderWifi(status);
      case 'wifi_ap':
        return this.renderAp(status);
      case 'ethernet':
        return this.renderEthernet(status);
    }
  }

  private renderWifi(status: NetworkStatus): TemplateResult {
    return html`
      <section>
        <h2>Wi-Fi</h2>
        <dl class="rows">
          ${this.row('SSID', status.ssid)}
          ${this.row(
            'Signal',
            status.rssi === undefined
              ? undefined
              : `${status.rssi} dBm (${signalQualityLabel(status.rssi)})`,
          )}
          ${this.row('IP address', status.ip)} ${this.row('MAC address', status.mac)}
        </dl>
      </section>
    `;
  }

  private renderAp(status: NetworkStatus): TemplateResult {
    const ap = status.ap;
    return html`
      <section>
        <h2>Access point</h2>
        <dl class="rows">
          ${this.row('SSID', ap?.ssid)} ${this.row('IP address', ap?.ip)}
          ${this.row('Stations', ap?.stations)}
        </dl>
      </section>
    `;
  }

  private renderEthernet(status: NetworkStatus): TemplateResult {
    const eth = status.eth;
    return html`
      <section>
        <h2>Ethernet</h2>
        <dl class="rows">
          ${this.row('IP address', eth?.ip)} ${this.row('MAC address', eth?.mac)}
          ${this.row('Link', eth === undefined ? undefined : eth.linkUp ? 'Up' : 'Down')}
          ${this.row('Speed', eth === undefined ? undefined : `${eth.speed} Mbps`)}
          ${this.row('Duplex', eth === undefined ? undefined : duplexLabel(eth.duplex))}
        </dl>
      </section>
    `;
  }

  private row(label: string, value: string | number | undefined): TemplateResult | typeof nothing {
    return value === undefined || value === ''
      ? nothing
      : html`<dt>${label}</dt>
          <dd>${value}</dd>`;
  }

  private ensureClient(): NetworkApiClient {
    if (!this.client || this.clientBaseUrl !== this.baseUrl) {
      this.client = createNetworkApiClient({ baseUrl: this.baseUrl });
      this.clientBaseUrl = this.baseUrl;
    }
    return this.client;
  }

  private async refresh(): Promise<void> {
    const seq = ++this.refreshSeq;
    this.loading = true;
    const result = await this.ensureClient().getStatus();
    if (seq !== this.refreshSeq) {
      // A newer refresh started while this one was in flight; drop the result.
      return;
    }
    this.loading = false;

    if (result.ok) {
      this.status = result.data;
      this.errorMessage = '';
      this.lastUpdated = new Date();
      return;
    }

    this.errorMessage = result.message;
    this.dispatchEvent(
      new CustomEvent('edn-error', {
        detail: { message: result.message },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private startPolling(): void {
    this.stopPolling();
    const interval = Number(this.pollIntervalMs);
    if (!Number.isFinite(interval) || interval <= 0) {
      return;
    }
    this.timerId = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }
      void this.refresh();
    }, interval);
  }

  private stopPolling(): void {
    if (this.timerId !== undefined) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }
  }

  private handleRetry = (): void => {
    void this.refresh();
  };
}

if (typeof customElements !== 'undefined' && !customElements.get('edn-network-status')) {
  customElements.define('edn-network-status', EdnNetworkStatus);
}
