/// <reference types="vite/client" />

import type { VisionImage } from './types';

/** Shape of the bridge exposed by `electron/preload.cts`. */
export interface DesktopApi {
  loadState: () => Promise<unknown>;
  saveState: (state: unknown) => Promise<void>;
  addVisionImages: () => Promise<VisionImage[]>;
  importVisionImages: (paths: string[]) => Promise<VisionImage[]>;
  removeVisionImage: (file: string) => Promise<void>;
  getPathForFile: (file: File) => string;
  setFullscreen: (value?: boolean) => Promise<boolean>;
  isFullscreen: () => Promise<boolean>;
  onFullscreenChange: (callback: (value: boolean) => void) => () => void;
}

declare global {
  interface Window {
    desktop: DesktopApi;
  }
}
