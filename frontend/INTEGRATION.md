# Integrating the ed-network UI

The bundle is a single self-contained ESM file that defines the client factory and
all three custom elements on import:

```ts
import 'edn-network-ui';
```

There are two supported host paths: bundling into a SPA (e.g. the Prometey Preact
panel) and dropping a static bundle into an ESP32 LittleFS image.

## Bundle budget

Measured with `npm run build` (Vite 8, esbuild minify, lit 3 bundled in):

| Build | Raw | Gzip |
| --- | --- | --- |
| `dist/edn-network-ui.js` (client + all three elements) | 47.72 kB | 12.68 kB |
| Wave-1 status widget alone (before this wave) | 28.27 kB | 9.30 kB |

Bundling `edn-network-ui` into a host adds roughly **12.7 kB gzip**. If the host is
also served from LittleFS, budget that against the filesystem partition.

---

## (a) Primary path — Prometey Preact SPA

Prometey lives at `prometey/frontend` and builds into `prometey/data/` (see
`prometey/AGENTS.md`). This repo sits next to it, so a local file dependency is the
simplest source of truth.

### 1. Add the dependency

```bash
cd prometey/frontend
npm install file:../../ed-network/frontend
```

This installs the built `dist/edn-network-ui.js` + `dist/types/**` and wires the
package `types` field. `dist/` is committed in this repo, so no Node build step
is needed on the consumer side. Install via the local `file:` path above or a
git URL dependency (`npm install <git-url>`); the package is `private` and is
not published to npm.

### 2. Import once at the app entry

```tsx
// prometey/frontend/src/main.tsx
import { render } from 'preact';
import './styles.css';
import { App } from './App';
import 'edn-network-ui'; // registers <edn-network-status|settings|page> globally

const root = document.getElementById('app');
if (root) {
  render(<App />, root);
}
```

### 3. Drop the widget into a new tab

Preact JSX does not know the custom-element tag names by default. Mount
imperatively to avoid JSX intrinsic typing (and any Preact/Lit ownership clash):

```tsx
// prometey/frontend/src/pages/NetworkSettings.tsx
import { useEffect, useRef } from 'preact/hooks';
import 'edn-network-ui';

export function NetworkSettingsPage() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = document.createElement('edn-network-page');
    element.setAttribute('poll-interval-ms', '5000');
    // Same origin by default; use element.setAttribute('base-url', 'http://<device>')
    // to point at another ed-network device (needs CORS on that device).
    host.current?.append(element);
    return () => element.remove();
  }, []);

  return <div ref={host} />;
}
```

Register the tab in `prometey/frontend/src/App.tsx`:

```tsx
import { NetworkSettingsPage } from './pages/NetworkSettings';

type TabId = 'status' | 'connections' | 'boiler' | 'rooms' | 'backup' | 'network';

const TABS: ReadonlyArray<TabItem<TabId>> = [
  // …existing tabs…
  { id: 'network', label: 'Network' },
];

function renderPanel(tab: TabId) {
  switch (tab) {
    // …existing cases…
    case 'network':
      return <NetworkSettingsPage />;
  }
}
```

Then `npm run build` in `prometey/frontend` and `pio run -e kc868a16 -t uploadfs`.

### If you prefer JSX tags

Declare the intrinsics once, e.g. `prometey/frontend/src/ed-network.d.ts`:

```ts
import 'preact';

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'edn-network-status': {
        'base-url'?: string;
        'poll-interval-ms'?: string;
      };
      'edn-network-settings': { 'base-url'?: string };
      'edn-network-page': {
        'base-url'?: string;
        'poll-interval-ms'?: string;
      };
    }
  }
}
```

You can then write `<edn-network-settings base-url="" />` directly.

---

## (b) Standalone path — LittleFS static page

Copy the built bundle (and optionally the types) next to a page:

```bash
cp ed-network/frontend/dist/edn-network-ui.js prometey/data/edn-network-ui.js
```

Create `prometey/data/network.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ed-network</title>
  </head>
  <body>
    <edn-network-page poll-interval-ms="5000"></edn-network-page>
    <script type="module" src="/edn-network-ui.js"></script>
  </body>
</html>
```

Prometey serves the LittleFS root with `index.html` as the default document
(`prometey/src/web/handler.cpp:14`), so `http://<device-ip>/network.html` serves
this page. Upload with `pio run -e kc868a16 -t uploadfs`.

> **LittleFS upload erases the filesystem** (`prometey/AGENTS.md`, Definition of
> Done): back up `/config.bin`, `/boiler.bin` and `/room_<i>.bin` first
> (`GET /api/config/backup`).

---

## (c) Host-side notes (required)

### Endpoint conflicts with Prometey's existing Wi-Fi API

Prometey already owns Wi-Fi routes with different semantics. You must route
ed-network's endpoints or reconcile the paths — do not run both unbounded:

- `GET /api/wifi/list` is registered by Prometey as a **dead stub**: the handler
  body is commented out and sends no response, so the request hangs
  (`prometey/src/web/handler.cpp:24-38`). ed-network registers the same path
  (`network_api.cpp:36`) and returns `{networks:[…]}` or 500 `{"error":"scan failed"}`.
  Remove/replace Prometey's stub, or the registration order decides which wins and
  the UI can hang.
- Prometey's `POST /api/settings/wifi` (`prometey/src/web/handler.cpp:62-89`) is
  urlencoded, replies `422 {"message":…}`, force-clears `isAPMode`, persists
  immediately, and **requires `POST /api/reboot` to apply**
  (`prometey/AGENTS.md:77-78`). ed-network's `POST /api/network/settings` is JSON,
  replies `400/500 {"error":…}`, applies live via `applyConfig()` after the
  response (`network_api.cpp:299-300`), and has no reboot flow. The UI talks only
  to the ed-network contract.
- Prometey's `GET /api/settings` returns the plaintext `wifiPassword`
  (`prometey/src/web/handler.cpp:46-47`). ed-network never returns passwords, only
  `hasWifiPassword`/`hasWifiAPPassword` flags (`network_api.cpp:92-101`).

### Register ed-network's routes and persist via callback

```cpp
#include "network/network_api.h"

EDNetwork::NetworkApi networkApi(networkMgr);
networkApi.onSettingsChanged([this](const EDNetwork::Config& config) {
  // Copy the changed fields into Prometey's own Config, then persist.
  // Return false to make the API reply 500 "settings rejected by controller".
  configMgr.getData()->network = config; // adapt field names to Prometey's struct
  configMgr.store();
  return true;
});
networkApi.registerRoutes(server);
```

The API holds settings in RAM only; without `onSettingsChanged` a save still
applies live but is lost on reboot (`network_api.h:28`). If the callback returns
`false`, the API replies 500 `{"error":"settings rejected by controller"}`
(`network_api.cpp:279-282`).

### Security

The ed-network API has **no authentication and sends no CORS headers**. Serve the
UI same-origin (default `base-url=""`) on a trusted LAN. Do not expose the device
to untrusted networks or the public internet, and do not ship a cross-origin
deployment without adding auth/CORS on the device.
