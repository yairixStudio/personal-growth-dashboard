import { contextBridge } from 'electron';
import Store from 'electron-store';

const store = new Store();

// חשיפת ה-API ל-renderer process
contextBridge.exposeInMainWorld('electronStore', {
  get: (key: string) => store.get(key),
  set: (key: string, value: any) => store.set(key, value)
}); 