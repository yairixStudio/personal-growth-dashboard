# Personal Growth Dashboard

A desktop dashboard for the things you want to keep in front of you — goals, values, strengths, gratitude, affirmations, quotes, a vision board and a video shelf, organised into workspaces you can switch between.

Built with React + TypeScript + Vite, wrapped in Electron. Everything is stored locally on your machine.

## Panels

| Panel | What it holds |
|---|---|
| **Goals** | What you're working toward |
| **Values** | What you want to stay true to |
| **Strengths** | What you're good at, in your own words |
| **Gratitude** | What's worth noticing |
| **Affirmations** | Short lines you want to repeat |
| **Inspirational Quotes** | Words from other people |
| **Vision Board** | Images |
| **Inspiring Videos** | YouTube links, embedded and playable in place |

Panels can be reordered by drag and drop. Light and dark mode included. Multiple **workspaces** let you keep separate sets — e.g. "Main" and "Personal Projects".

## Getting started

```bash
npm install
```

> **Known issue.** `npm install` currently fails at the `postinstall` step with
> `'electron-builder' is not recognized`. Three tools the scripts call —
> `electron-builder`, `cross-env` and `concurrently` — are not declared in
> `devDependencies`. The dependencies themselves do install (the failure comes
> after), so `npm run dev` works today. Affected scripts: `postinstall`,
> `electron:dev`, `electron:build`. To fix:
>
> ```bash
> npm i -D electron-builder cross-env concurrently
> ```

### Run in the browser (fastest)

```bash
npm run dev          # http://127.0.0.1:5173
```

In the browser the app uses `src/mock-store.ts`, which persists to `localStorage`. Vite aliases `./store` to it in `vite.config.ts`, so no Electron APIs are needed.

### Run as a desktop app

```bash
npm run electron:dev
```

### Build

```bash
npm run build            # web bundle into dist/
npm run electron:build   # packaged desktop app
```

## Where your data lives

- **Desktop (Electron):** `electron-store`, in your OS user-data directory — not in this repo.
- **Browser (dev):** `localStorage` under the key `mock-store`.

Nothing is sent anywhere. There is no server and no account. The defaults shipped in `store.ts` / `mock-store.ts` are generic placeholders, not anyone's real content.

## Structure

```
index.html                        Vite entry
src/main.tsx                      React root
src/personal-growth-dashboard.tsx the dashboard — all panels and editing
src/components/MusicPlayer.tsx    brainwave player widget (UI only, no audio yet)
src/store.ts                      electron-store adapter (desktop)
src/mock-store.ts                 localStorage adapter (browser)
src/electron/main.ts              Electron main process
src/electron/preload.ts           preload bridge
src/types/                        shared TypeScript types
vite.config.ts                    Vite config, incl. the store alias
```

## Author

**[Yairix Studio](https://yairix.com)**

- Website: [https://yairix.com](https://yairix.com)
