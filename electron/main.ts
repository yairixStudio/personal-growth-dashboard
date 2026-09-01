import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import Store from 'electron-store';

// הגדרת הסכמה לשמירת נתונים
interface StoreSchema {
  workspaces: Workspaces;
  isDarkMode: boolean;
  currentWorkspace: string;
}

const schema = {
  workspaces: {
    type: 'object',
    default: {
      'Weekday': {
        goals: ['Complete daily tasks', 'Stay focused', 'Exercise'],
        values: ['Productivity', 'Growth', 'Health'],
        affirmations: ['I am productive', 'I achieve my goals', 'I stay focused'],
        quotes: [
          'The only way to do great work is to love what you do. - Steve Jobs',
          'What you think, you become. - Buddha',
          'Success is not final, failure is not fatal. - Winston Churchill'
        ],
        videos: []
      },
      'Weekend': {
        goals: ['Relax and recharge', 'Family time', 'Hobbies'],
        values: ['Balance', 'Connection', 'Joy'],
        affirmations: ['I deserve rest', 'I enjoy my time', 'I am present'],
        quotes: [],
        videos: []
      }
    }
  },
  isDarkMode: {
    type: 'boolean',
    default: false
  },
  currentWorkspace: {
    type: 'string',
    default: 'Weekday'
  }
};

const store = new Store<StoreSchema>({ schema });

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // בפיתוח - טען את השרת המקומי
  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    // בהפצה - טען את הקבצים המקומפלים
    win.loadFile(path.join(__dirname, '../build/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 