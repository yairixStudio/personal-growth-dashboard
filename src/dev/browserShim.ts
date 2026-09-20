/** Stand-in for the Electron bridge so the renderer runs in a plain browser
 *  tab (`npm run dev`, open the URL). Dev-only: main.tsx imports it only when
 *  `window.desktop` is missing. State lives in localStorage; images are remote. */
import type { DesktopApi } from '../vite-env';

const KEY = 'pgd-dev-state';
let fullscreen = false;
const listeners = new Set<(value: boolean) => void>();

const picture = (seed: string) => `https://picsum.photos/seed/${seed}/600/450`;
const sample = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const id = `${Date.now()}-${i}`;
    return { id, file: picture(id), name: `Sample ${i + 1}` };
  });

export const browserShim: DesktopApi = {
  loadState: async () => JSON.parse(localStorage.getItem(KEY) ?? 'null'),
  saveState: async (state) => localStorage.setItem(KEY, JSON.stringify(state)),
  addVisionImages: async () => sample(1),
  importVisionImages: async (paths) => sample(paths.length),
  removeVisionImage: async () => {},
  sampleVisionImages: async () => sample(4),
  chooseBackground: async () => picture('bg'),
  removeBackground: async () => {},
  getPathForFile: (file) => file.name,
  setFullscreen: async (value) => {
    fullscreen = value ?? !fullscreen;
    listeners.forEach((fn) => fn(fullscreen));
    return fullscreen;
  },
  isFullscreen: async () => fullscreen,
  onFullscreenChange: (callback) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },
};
