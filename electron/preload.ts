/*
*  Electron Preload Script
*  Provides secure bridge between renderer and main process
*/

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  sendCommand: (command: any) => ipcRenderer.invoke('worker:sendCommand', command),
  onCommand: (callback: (command: any) => void) => {
    ipcRenderer.on('worker:command', (event, data) => callback(data));
  },
  removeCommandListener: () => {
    ipcRenderer.removeAllListeners('worker:command');
  },
  // File dialog methods
  showOpenDialog: (options: any) => ipcRenderer.invoke('dialog:open', options),
  showSaveDialog: (options: any) => ipcRenderer.invoke('dialog:save', options),
  showOpenDirectoryDialog: (options: any) => ipcRenderer.invoke('dialog:openDirectory', options),
  // Menu actions
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu-action', (event, action) => callback(action));
  },
  removeMenuActionListener: () => {
    ipcRenderer.removeAllListeners('menu-action');
  },
  // Load OBD file for viewing
  loadOBDFile: (filePath: string) => ipcRenderer.invoke('loadOBDFile', filePath),
  // Get sprite dimensions list
  getSpriteDimensions: () => ipcRenderer.invoke('getSpriteDimensions'),
});

