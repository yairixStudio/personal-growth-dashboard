/**
 * The only bridge between the renderer and Node. Everything exposed here is a
 * promise-returning function over IPC — no Electron or Node objects cross over.
 */
import { contextBridge, ipcRenderer, webUtils, type IpcRendererEvent } from 'electron';

interface VisionImage {
  id: string;
  file: string;
  name: string;
}

const desktop = {
  loadState: (): Promise<unknown> => ipcRenderer.invoke('state:load'),
  saveState: (state: unknown): Promise<void> => ipcRenderer.invoke('state:save', state),

  addVisionImages: (): Promise<VisionImage[]> => ipcRenderer.invoke('vision:add'),
  importVisionImages: (paths: string[]): Promise<VisionImage[]> => ipcRenderer.invoke('vision:import', paths),
  removeVisionImage: (file: string): Promise<void> => ipcRenderer.invoke('vision:remove', file),
  sampleVisionImages: (): Promise<VisionImage[]> => ipcRenderer.invoke('vision:samples'),

  chooseBackground: (): Promise<string | null> => ipcRenderer.invoke('background:choose'),
  removeBackground: (file: string): Promise<void> => ipcRenderer.invoke('background:remove', file),

  /** Electron 32+ removed `File.path`; this is the supported replacement, and it
   *  has to be called here because `webUtils` does not cross the bridge. */
  getPathForFile: (file: File): string => {
    try {
      return webUtils.getPathForFile(file);
    } catch {
      return '';
    }
  },

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
