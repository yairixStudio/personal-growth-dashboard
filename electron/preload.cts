/**
 * The only bridge between the renderer and Node. Everything exposed here is a
 * promise-returning function over IPC — no Electron or Node objects cross over.
 */
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

interface VisionImage {
  id: string;
  file: string;
  name: string;
}

const desktop = {
  loadState: (): Promise<unknown> => ipcRenderer.invoke('state:load'),
  saveState: (state: unknown): Promise<void> => ipcRenderer.invoke('state:save', state),

  addVisionImages: (): Promise<VisionImage[]> => ipcRenderer.invoke('vision:add'),
  removeVisionImage: (file: string): Promise<void> => ipcRenderer.invoke('vision:remove', file),

  setFullscreen: (value?: boolean): Promise<boolean> => ipcRenderer.invoke('window:set-fullscreen', value),
  isFullscreen: (): Promise<boolean> => ipcRenderer.invoke('window:is-fullscreen'),

  /** Returns an unsubscribe function; the raw IpcRendererEvent never crosses over. */
  onFullscreenChange: (callback: (value: boolean) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, value: boolean) => callback(value);
    ipcRenderer.on('window:fullscreen-changed', listener);
    return () => {
      ipcRenderer.removeListener('window:fullscreen-changed', listener);
    };
  },
};

contextBridge.exposeInMainWorld('desktop', desktop);

export type DesktopApi = typeof desktop;
