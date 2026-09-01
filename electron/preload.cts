/**
 * The only bridge between the renderer and Node. Everything exposed here is a
 * promise-returning function over IPC — no Electron or Node objects cross over.
 */
import { contextBridge, ipcRenderer } from 'electron';

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
};

contextBridge.exposeInMainWorld('desktop', desktop);

export type DesktopApi = typeof desktop;
