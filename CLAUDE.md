# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev mode (hot reload)
npm run build        # Build all processes
npm run build:win    # Build + package Windows installer (NSIS x64)
npm run build:mac    # Build + package macOS app
npm run build:linux  # Build + package Linux app
```

No test runner is configured.

## Architecture

Electron app with three isolated processes:

- `src/main/` — Main process (Node.js). Entry: `index.ts`. IPC handlers registered in `ipc/index.ts` via `createIPCHandlers()`.
- `src/preload/` — Preload script. Exposes `window.api` to the renderer via `contextBridge`. All renderer→main calls go through `window.api.*` which maps to `ipcRenderer.invoke(channel, ...)`.
- `src/renderer/` — Vue 3 SPA (hash history router). Entry: `src/main.ts`. Uses Element Plus (auto-imported), Pinia stores, and Vue Router.

### IPC pattern

To add a new renderer→main call:
1. Add an `ipcMain.handle('channel', handler)` in `src/main/ipc/index.ts`
2. Add a wrapper in `src/preload/index.ts` under the `api` object
3. The type is declared in `src/preload/index.d.ts` and `src/renderer/src/global.d.ts`

### Renderer structure

- `views/` — Route-level pages (Home, Data, Tools, Settings, AddLot, AddSN, QueryLot, QuerySN, DeleteLot, DeleteSN)
- `components/` — Reusable dialog/form components used inside views
- `stores/` — Pinia stores: `dataMaintenance`, `lotCheck`, `mongoCheck`, `counter`
- Router uses hash history; routes defined in `src/renderer/src/router/index.ts`

### Build config

`electron.vite.config.ts` configures vite for all three processes. `unplugin-auto-import` and `unplugin-vue-components` auto-import Vue/Element Plus APIs — no manual imports needed in `.vue` files.
