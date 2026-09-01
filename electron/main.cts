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
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp'];
const ALLOWED_EXTENSIONS = new Set(IMAGE_EXTENSIONS.map((ext) => `.${ext}`));

const store = new Store<{ state?: unknown }>({ name: 'personal-growth' });

/** Absolute path to the directory holding copied vision-board images. */
let visionDir = '';

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

async function ensureVisionDir(): Promise<void> {
  visionDir = path.join(app.getPath('userData'), VISION_DIRNAME);
  await fs.mkdir(visionDir, { recursive: true });
}

function registerMediaProtocol(): void {
  protocol.handle('media', async (request) => {
    // Only ever resolve a bare filename inside visionDir — never a traversal.
    const url = new URL(request.url);
    const file = path.basename(decodeURIComponent(url.pathname));
    const target = path.join(visionDir, file);

    if (path.dirname(target) !== visionDir) {
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

  ipcMain.handle('vision:remove', async (_event, file: unknown) => {
    if (typeof file !== 'string') return;
    const target = path.join(visionDir, path.basename(file));
    if (path.dirname(target) !== visionDir) return;
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
    await ensureVisionDir();
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
