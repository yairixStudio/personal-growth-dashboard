# Personal Growth Dashboard

A desktop dashboard for the things you want to keep in front of you — goals, values, strengths, gratitude, affirmations, quotes, a vision board and a video shelf, organised into workspaces you can switch between.

React + TypeScript + Vite in the renderer, Electron around it. Everything stays on your machine.

## Panels

| Panel | What it holds |
|---|---|
| **Goals** | What you're working toward |
| **Values** | What you want to stay true to |
| **Strengths** | What you're good at, in your own words |
| **Gratitude** | What's worth noticing |
| **Affirmations** | Short lines you want to repeat |
| **Inspirational Quotes** | Words from other people |
| **Vision Board** | Images you pick, copied into the app |
| **Inspiring Videos** | YouTube links, embedded and playable in place |

Items reorder by drag and drop, and can be dragged **between** list panels. Workspaces reorder the same way.

**Focus mode** clears the grid and puts one panel in the true centre of the screen, enlarged for reading at a distance. It advances on a timer set in Settings, and the active navigation dot fills as that interval runs down. The vision board drops its card here and lays every image straight onto the backdrop as a collage. <kbd>F5</kbd> starts it, <kbd>←</kbd> / <kbd>→</kbd> step, <kbd>Space</kbd> pauses, <kbd>Esc</kbd> leaves.

**Fullscreen** is real OS fullscreen — the window drops its frame and takes the whole display, the way a video player does. Toggle it from the toolbar, from inside focus mode, or with <kbd>F11</kbd>. The button tracks the actual window state, so changing it outside the app keeps the UI in sync.

**Settings** hold the interface language (English or Hebrew, which flips the whole layout to RTL), light/dark, the focus interval, and a background image with a scrim over it whose opacity you control.

**Drag and drop from the desktop** works into every panel: image files onto the vision board, a YouTube link onto the video shelf, and text onto any list — one item per line.

**Brainwave player** generates binaural tones at delta / theta / alpha / beta / gamma frequencies with an optional pink-noise bed. Everything is synthesised live with the Web Audio API — no audio files, no network. Headphones required for the effect to work.

## Getting started

```bash
npm install
npm run electron:dev     # Vite + Electron, hot reload in the renderer
```

Other scripts:

```bash
npm run typecheck        # renderer and main process, both strict
npm run build            # typecheck, bundle the renderer, compile the main process
npm run dist             # build + installer into release/
npm run dist:dir         # build + unpacked app, no installer
```

`npm run dev` starts only the Vite server. On its own that's not much use — the
renderer expects the `window.desktop` bridge that the Electron preload provides.

> **Windows:** turn on Developer Mode (Settings → System → For developers) before
> `npm run dist`. Without it, `electron-builder` cannot unpack its signing
> toolchain and only `npm run dist:dir` will succeed.

> **Distributing to other people:** an unsigned build is blocked outright by
> Windows Smart App Control, with no "run anyway" option. See
> [docs/BUILDING.md](docs/BUILDING.md) for what signing costs and how to set it up.

**[docs/BUILDING.md](docs/BUILDING.md)** covers all of it: prerequisites, every
script, code signing on Windows and macOS, CI releases, and troubleshooting.

## Architecture

```
electron/
  main.cts        main process — owns the store, the image files and the window
  preload.cts     contextBridge: the only path between renderer and Node
src/
  App.tsx         composition root: one DragDropContext, grid built from PANELS
  panels.ts       panel registry — the single source of truth for the grid
  types.ts        domain model
  state/
    reducer.ts    every state transition
    migrate.ts    accepts any stored shape, returns a valid AppState
    useAppState.ts  load once, then debounced write-behind
  components/     one file per panel plus the shared Panel shell
```

Two things worth knowing:

- **The grid is generated.** Adding a panel means adding an entry to `panels.ts`, not another copy-pasted block of JSX.
- **Everything has an id.** Items, workspaces and videos all carry stable ids, which is what makes drag-and-drop and inline editing behave when the list changes underneath them.

### Security

The renderer runs with `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` and `webSecurity: true`. It has no access to Node or to the filesystem; it can only call the handful of functions listed in `preload.cts`. External links open in the system browser, and in-app navigation away from the app's own origin is blocked.

Vision-board images and background wallpapers are copied into the app's own user-data directories and served back through a custom `media://` protocol. It routes by host — `media://vision/…` and `media://background/…` — and each route resolves only a bare filename inside its own directory, never a path that climbs out of it.

## Where your data lives

`electron-store`, in your OS user-data directory — `%APPDATA%/personal-growth-dashboard` on Windows, `~/Library/Application Support/personal-growth-dashboard` on macOS. Images sit alongside it in `vision-board/` and `backgrounds/`.

Nothing is sent anywhere. There is no server and no account. The sample content behind the wand button is generic placeholder text, not anyone's real content.

Data saved by version 1 is migrated automatically on first launch.

## Author

**[Yairix Studio](https://yairix.com)**

- Website: [https://yairix.com](https://yairix.com)
