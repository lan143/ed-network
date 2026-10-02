import { LitElement, css, html } from 'lit';
import type { TemplateResult } from 'lit';
// Side-effect imports guarantee both children are defined whenever the composite
// page is used, even if the consumer imports this module directly.
import './network-status';
import './network-settings';

type TabId = 'status' | 'settings';

const TABS: ReadonlyArray<{ id: TabId; label: string }> = [
  { id: 'status', label: 'Status' },
  { id: 'settings', label: 'Network settings' },
];

export class EdnNetworkPage extends LitElement {
  static override properties = {
    baseUrl: { type: String, attribute: 'base-url' },
    pollIntervalMs: { type: Number, attribute: 'poll-interval-ms' },
    activeTab: { state: true },
  };

  static override styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      color: #1f2430;
      --_accent: var(--edn-accent, #2563eb);
      --_border: #e2e5ea;
    }

    .tabs {
      display: flex;
      gap: 0.25rem;
      border-bottom: 1px solid var(--_border);
      max-width: 30rem;
    }

    [role='tab'] {
      font: inherit;
      font-size: 0.85rem;
      padding: 0.45rem 0.8rem;
      border: 0;
      border-bottom: 2px solid transparent;
      background: transparent;
      color: var(--edn-muted, #6b7280);
      cursor: pointer;
      margin-bottom: -1px;
    }

    [role='tab'][aria-selected='true'] {
      color: var(--_accent);
      border-bottom-color: var(--_accent);
      font-weight: 600;
    }

    .panel {
      margin-top: 1rem;
    }
  `;

  /** Prefix for API requests, passed through to the active child. */
  baseUrl = '';

  /** Auto-refresh period in ms, passed through to the status child. */
  pollIntervalMs = 10000;

  /** Mount-on-activate: only the active tab's element is in the DOM. */
  activeTab: TabId = 'status';

  override render(): TemplateResult {
    return html`
      <div class="tabs" role="tablist" aria-label="Network">
        ${TABS.map(
          (tab) => html`
            <button
              type="button"
              role="tab"
              id="tab-${tab.id}"
              aria-controls="panel-${tab.id}"
              aria-selected=${this.activeTab === tab.id}
              @click=${() => this.selectTab(tab.id)}
            >
              ${tab.label}
            </button>
          `,
        )}
      </div>
      <div class="panel" id="panel-${this.activeTab}" role="tabpanel">
        ${this.renderActive()}
      </div>
    `;
  }

  private renderActive(): TemplateResult {
    if (this.activeTab === 'settings') {
      return html`<edn-network-settings base-url=${this.baseUrl}></edn-network-settings>`;
    }
    return html`
      <edn-network-status
        base-url=${this.baseUrl}
        poll-interval-ms=${this.pollIntervalMs}
      ></edn-network-status>
    `;
  }

  private selectTab(id: TabId): void {
    if (this.activeTab === id) {
      return;
    }
    this.activeTab = id;
    this.dispatchEvent(
      new CustomEvent<{ tab: TabId }>('edn-tab-change', {
        detail: { tab: id },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('edn-network-page')) {
  customElements.define('edn-network-page', EdnNetworkPage);
}
