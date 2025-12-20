import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  runCliCommand: (command: string, args: string[] = []) =>
    ipcRenderer.invoke('run-cli-command', command, args),

  selectDirectory: () => ipcRenderer.invoke('select-directory'),

  selectFile: () => ipcRenderer.invoke('select-file'),

  onCliOutput: (callback: (event: any, data: any) => void) =>
    ipcRenderer.on('cli-output', callback),

  removeCliOutputListener: () =>
    ipcRenderer.removeAllListeners('cli-output')
});