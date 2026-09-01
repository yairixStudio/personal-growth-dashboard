/**
 * Main process.
 *
 * Owns everything the renderer is not allowed to touch: the persisted store,
 * the vision-board image files, and the window itself. The renderer talks to
 * it only through the narrow IPC surface defined in `preload.cts`.
 */
import { app, BrowserWindow, dialog, ipcMain, net, protocol, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import Store from 'electron-store';

interface VisionImage {
  id: string;
  file: string;
  name: string;
}

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';
const VISION_DIRNAME = 'vision-board';
const BACKGROUND_DIRNAME = 'backgrounds';
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp'];
const ALLOWED_EXTENSIONS = new Set(IMAGE_EXTENSIONS.map((ext) => `.${ext}`));

const store = new Store<{ state?: unknown }>({ name: 'personal-growth' });

/** Absolute paths to the directories holding copied user images. */
let visionDir = '';
let backgroundDir = '';

/** `media://<area>/<file>` resolves through here, and nowhere else. */
function areaDir(area: string): string | null {
  if (area === 'vision') return visionDir;
  if (area === 'background') return backgroundDir;
  return null;
}

/**
 * `media://` serves vision-board images. Registering it as privileged has to
 * happen before the app is ready, hence the top-level call.
 */
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

/** Dev means "load from the Vite server". A packaged app never is, and
 *  NODE_ENV=production lets the built bundle be run unpackaged for testing. */
function isDev(): boolean {
  return !app.isPackaged && process.env.NODE_ENV !== 'production';
}

async function ensureDirs(): Promise<void> {
  const userData = app.getPath('userData');
  visionDir = path.join(userData, VISION_DIRNAME);
  backgroundDir = path.join(userData, BACKGROUND_DIRNAME);
  await fs.mkdir(visionDir, { recursive: true });
  await fs.mkdir(backgroundDir, { recursive: true });
}

function registerMediaProtocol(): void {
  protocol.handle('media', async (request) => {
    // Only ever resolve a bare filename inside a known directory — no traversal.
    const url = new URL(request.url);
    const dir = areaDir(url.hostname);
    if (!dir) return new Response('Not found', { status: 404 });

    const file = path.basename(decodeURIComponent(url.pathname));
    const target = path.join(dir, file);

    if (path.dirname(target) !== dir) {
      return new Response('Forbidden', { status: 403 });
    }
    try {
      await fs.access(target);
    } catch {
      return new Response('Not found', { status: 404 });
    }
    return net.fetch(pathToFileURL(target).toString());
  });
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#f9fafb',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  win.once('ready-to-show', () => win.show());

  // Keep the renderer's fullscreen button in sync with the real window state,
  // which the OS can also change (F11, the green button, a window manager).
  const reportFullScreen = () => {
    if (!win.isDestroyed()) win.webContents.send('window:fullscreen-changed', win.isFullScreen());
  };
  win.on('enter-full-screen', reportFullScreen);
  win.on('leave-full-screen', reportFullScreen);

  // External links open in the user's browser, never in an app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });

  // Nothing may navigate the app frame away from its own origin.
  win.webContents.on('will-navigate', (event, url) => {
    const allowed = isDev() ? DEV_SERVER_URL : 'file://';
    if (!url.startsWith(allowed)) event.preventDefault();
  });

  if (isDev()) {
    void win.loadURL(DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    void win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  return win;
}

function registerIpc(): void {
  ipcMain.handle('state:load', () => store.get('state') ?? null);

  ipcMain.handle('state:save', (_event, next: unknown) => {
    store.set('state', next);
  });

  /** Real OS fullscreen — the window loses its frame and covers the display. */
  ipcMain.handle('window:set-fullscreen', (event, value: unknown): boolean => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return false;
    const next = typeof value === 'boolean' ? value : !win.isFullScreen();
    win.setFullScreen(next);
    return next;
  });

  ipcMain.handle('window:is-fullscreen', (event): boolean => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win ? win.isFullScreen() : false;
  });

  ipcMain.handle('vision:add', async (event): Promise<VisionImage[]> => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return [];

    const result = await dialog.showOpenDialog(win, {
      title: 'Add images to your vision board',
      buttonLabel: 'Add',
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Images', extensions: IMAGE_EXTENSIONS }],
    });
    if (result.canceled) return [];

    const added: VisionImage[] = [];
    for (const source of result.filePaths) {
      const extension = path.extname(source).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(extension)) continue;

      const id = randomUUID();
      const file = `${id}${extension}`;
      try {
        await fs.copyFile(source, path.join(visionDir, file));
        added.push({ id, file, name: path.basename(source, extension) });
      } catch (error) {
        console.error(`Could not copy ${source}:`, error);
      }
    }
    return added;
  });

  /** Same copy-into-userData flow as the dialog, for files dropped onto the board. */
  ipcMain.handle('vision:import', async (_event, paths: unknown): Promise<VisionImage[]> => {
    if (!Array.isArray(paths)) return [];

    const added: VisionImage[] = [];
    for (const source of paths) {
      if (typeof source !== 'string') continue;
      const extension = path.extname(source).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(extension)) continue;

      const id = randomUUID();
      const file = `${id}${extension}`;
      try {
        await fs.copyFile(source, path.join(visionDir, file));
        added.push({ id, file, name: path.basename(source, extension) });
      } catch (error) {
        console.error(`Could not copy ${source}:`, error);
      }
    }
    return added;
  });

  ipcMain.handle('vision:remove', async (_event, file: unknown) => {
    if (typeof file !== 'string') return;
    const target = path.join(visionDir, path.basename(file));
    if (path.dirname(target) !== visionDir) return;
    await fs.rm(target, { force: true });
  });

  /** Generated rather than shipped, so no binary assets ride along in the app. */
  ipcMain.handle('vision:samples', async (): Promise<VisionImage[]> => {
    const swatches: Array<[number, number, string, string, string]> = [
      [900, 1200, '#6366f1', '#a78bfa', 'Somewhere high'],
      [1200, 800, '#0ea5e9', '#22d3ee', 'Open water'],
      [1000, 1000, '#f59e0b', '#fbbf24', 'Long light'],
      [900, 1250, '#10b981', '#34d399', 'Deep green'],
      [1200, 780, '#ef4444', '#fb7185', 'Last hour'],
      [950, 1150, '#8b5cf6', '#c084fc', 'After dark'],
    ];

    const added: VisionImage[] = [];
    for (const [width, height, from, to, name] of swatches) {
      const id = randomUUID();
      const file = `${id}.svg`;
      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
        `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
        `<rect width="${width}" height="${height}" fill="url(#g)"/>` +
        `<circle cx="${width * 0.68}" cy="${height * 0.28}" r="${Math.min(width, height) * 0.16}" fill="rgba(255,255,255,0.22)"/>` +
        `<path d="M0 ${height} L${width * 0.32} ${height * 0.58} L${width * 0.56} ${height * 0.8} L${width * 0.8} ${height * 0.48} L${width} ${height} Z" fill="rgba(0,0,0,0.16)"/>` +
        `</svg>`;
      try {
        await fs.writeFile(path.join(visionDir, file), svg, 'utf8');
        added.push({ id, file, name });
      } catch (error) {
        console.error('Could not write a sample image:', error);
      }
    }
    return added;
  });

  ipcMain.handle('background:choose', async (event): Promise<string | null> => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;

    const result = await dialog.showOpenDialog(win, {
      title: 'Choose a background image',
      buttonLabel: 'Use image',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: IMAGE_EXTENSIONS }],
    });
    const source = result.canceled ? undefined : result.filePaths[0];
    if (!source) return null;

    const extension = path.extname(source).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) return null;

    const file = `${randomUUID()}${extension}`;
    try {
      await fs.copyFile(source, path.join(backgroundDir, file));
      return file;
    } catch (error) {
      console.error('Could not copy the background:', error);
      return null;
    }
  });

  ipcMain.handle('background:remove', async (_event, file: unknown) => {
    if (typeof file !== 'string') return;
    const target = path.join(backgroundDir, path.basename(file));
    if (path.dirname(target) !== backgroundDir) return;
    await fs.rm(target, { force: true });
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  void app.whenReady().then(async () => {
    await ensureDirs();
    registerMediaProtocol();
    registerIpc();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
