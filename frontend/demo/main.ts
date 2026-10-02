import { installMockApi } from './mock-api';

// Mock is enabled automatically in the demo; the real backend needs no client
// changes because both speak the same same-origin REST contract.
installMockApi();

// Imported dynamically so the component module (and its first fetch on
// connectedCallback) only evaluates after the mock fetch is installed.
await import('../src/index');

function mount(id: string, tag: string, attributes: Record<string, string> = {}): void {
  const target = document.querySelector(id);
  if (!target) {
    return;
  }
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  target.append(element);
}

// All three public elements, each self-registering from the single bundle import.
mount('#page', 'edn-network-page', { 'poll-interval-ms': '5000' });
mount('#settings', 'edn-network-settings');
mount('#status', 'edn-network-status', { 'poll-interval-ms': '5000' });
