# ed-network UI (`edn-network-ui`)

Framework-agnostic Web Components ( Lit 3) for the ed-network firmware REST API.
They speak the same same-origin JSON contract as `src/network/network_api.cpp` and
work in any host: plain HTML, Preact/React/Vue, or an ESP32 LittleFS page.

The package ships one self-contained ESM bundle. Importing it once defines and
registers every custom element:

```ts
import 'edn-network-ui';
```

## Layout

```
src/
  api/client.ts        typed fetch client (ApiResult<T>, never throws)
  api/types.ts         request/response types verified against network_api.cpp
  components/network-status.ts     <edn-network-status>
  components/network-settings.ts   <edn-network-settings>
  components/network-page.ts       <edn-network-page>
  index.ts             public barrel
test/                  vitest (jsdom)
demo/                  Vite dev demo with an in-browser mock API
dist/                  built bundle + emitted .d.ts (prebuilt bundles are committed; rebuild after source changes)
```

## Commands

```bash
npm install
npm run dev         # Vite dev server with demo/mock-api.ts
npm run typecheck   # tsc --noEmit (strict)
npm run test        # vitest run
npm run build       # vite build + tsc -p tsconfig.build.json (emits dist + dist/types)
```

`npm run build` produces:

- `dist/edn-network-ui.js` — single ESM bundle (all three elements + client factory)
- `dist/types/**/*.d.ts` — declarations for `src/**`, entry `dist/types/index.d.ts`

## Components

### `<edn-network-status>`

Reads `GET /api/network/status` and can poll.

| Attribute | Type | Default | Meaning |
| --- | --- | --- | --- |
| `base-url` | string | `''` | Request prefix; empty = same origin. |
| `poll-interval-ms` | number | `10000` | Auto-refresh period; `0` disables polling. |

| Event | `detail` | When |
| --- | --- | --- |
| `edn-error` | `{ message: string }` | Fetch/parse failure. Bubbles + composed. |

### `<edn-network-settings>`

Reads `GET /api/network/settings`, saves with `POST /api/network/settings`, and
scans with `GET /api/wifi/list`.

| Attribute | Type | Default | Meaning |
| --- | --- | --- | --- |
| `base-url` | string | `''` | Request prefix; empty = same origin. |

| Event | `detail` | When |
| --- | --- | --- |
| `edn-saved` | `NetworkSettings` | Save succeeded; detail is the refreshed settings. Bubbles + composed. |
| `edn-error` | `{ message: string }` | Load, save, or scan failure. Bubbles + composed. |

Behaviour notes:

- Load is async with a loading state; mode is a Station / Access Point segmented
  control that drives which field group is visible.
- Plaintext passwords are never returned by the server and are **never** written
  into the inputs. When the server reports a stored password a hint shows
  `Password saved •••• (leave blank to keep)`.
- The Save button is disabled until a field changes and while a save is in flight.
- Only changed fields are sent. Password fields are sent only if the user typed
  into them (or explicitly cleared them).
- Wi-Fi scan renders results sorted by RSSI descending with channel and a lock
  icon for encrypted networks; clicking a row fills the station SSID. Scan has a
  5-second timeout and an inline error banner on failure.

### `<edn-network-page>`

Composite tab container: `Status` and `Network settings`. The active tab's child
is mounted on activation and removed when you switch away (mount-on-activate, no
keep-alive — a tab switch discards unsaved settings edits).

| Attribute | Type | Default | Meaning |
| --- | --- | --- | --- |
| `base-url` | string | `''` | Passed through to the active child. |
| `poll-interval-ms` | number | `10000` | Passed through to the status child. |

| Event | `detail` | When |
| --- | --- | --- |
| `edn-tab-change` | `{ tab: 'status' \| 'settings' }` | Active tab changed. Bubbles + composed. |

Child `edn-error` / `edn-saved` events bubble through the page host.

## Theming

All components use Shadow DOM only — there is no global CSS and no `<style>` leak.
Theme them by setting CSS custom properties on the element or any ancestor:

```css
.my-panel {
  --edn-accent: #7c3aed;
  --edn-danger: #db2777;
  --edn-muted: #64748b;
}
```

| Variable | Default | Used by |
| --- | --- | --- |
| `--edn-accent` | `#2563eb` | badges, buttons, active tab/mode |
| `--edn-danger` | `#dc2626` | error banners and field errors |
| `--edn-muted` | `#6b7280` | secondary text, hints, tab idle state |

## Password keep/clear semantics

Mirrors `network_api.cpp` exactly (verified in source):

- A key that is **omitted** keeps the stored value; an **empty string is a present
  value and clears it** (`hasValue`/`getString`, lines 149-166, 203-214, 229-240).
- Setting `wifiAPHasPassword: false` always wipes the stored AP password
  (lines 260-262).
- An AP password must be 8–64 chars when `wifiAPHasPassword` is true; a blank
  field keeps an existing stored password (lines 264-267).
- SSID ≤ 32, password ≤ 64 (limits `WIFI_SSID_LEN`/`WIFI_PWD_LEN`, checks at
  lines 195, 208, 221, 234).
- Mode-required checks: `wifiSSID` required when `isAPMode` is false, `wifiAPSSID`
  required when true (lines 269-277).

The save payload contains only changed keys, so an untouched password is omitted
(keep) while an explicitly emptied one is sent as `""` (clear).

See [INTEGRATION.md](./INTEGRATION.md) for host wiring and security notes.
