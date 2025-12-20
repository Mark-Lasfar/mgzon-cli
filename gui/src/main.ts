import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { spawn } from 'child_process';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'), // We'll add this later
    titleBarStyle: 'default',
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, '../src/renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
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

// IPC handlers for CLI operations
ipcMain.handle('run-cli-command', async (event, command: string, args: string[] = []) => {
  return new Promise((resolve, reject) => {
    const cliPath = getCliExecutablePath();
    const child = spawn(cliPath, [command, ...args], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        code,
        stdout,
        stderr
      });
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile']
  });
  return result.filePaths[0];
});

function getCliExecutablePath(): string {
  const platform = process.platform;
  const arch = process.arch;
  let executableName = '';

  if (platform === 'win32') {
    executableName = 'mgzon-win.exe';
  } else if (platform === 'darwin') {
    executableName = 'mgzon-macos';
  } else {
    executableName = 'mgzon-linux';
  }

  // Try to find the CLI in the same directory as the GUI
  const guiDir = path.dirname(process.execPath);
  const cliPath = path.join(guiDir, executableName);

  if (fs.existsSync(cliPath)) {
    return cliPath;
  }

  // Fallback: try to find in PATH
  return 'mz'; // Assume it's installed globally
}