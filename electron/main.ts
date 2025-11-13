/*
*  Electron Main Process
*  Handles window creation and IPC communication with backend
*/

import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import type { ObjectBuilderApp } from '../src/main';
import { WorkerCommand } from '../src/workers/WorkerCommand';

let mainWindow: BrowserWindow | null = null;
let backendApp: ObjectBuilderApp | null = null;

interface WindowState {
  maximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

const WINDOW_STATE_FILE = path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState(): WindowState {
  const defaultState: WindowState = {
    maximized: false,
    x: 0,
    y: 0,
    width: 1024,
    height: 768,
  };

    try {
      if (fs.existsSync(WINDOW_STATE_FILE)) {
        const data = fs.readFileSync(WINDOW_STATE_FILE, 'utf-8');
        const state = JSON.parse(data);
        return { ...defaultState, ...state };
      }
    } catch (error: any) {
      sendLogCommand(6, `Failed to load window state: ${error.message}`, error.stack, 'Window:loadState');
      console.error('Failed to load window state:', error);
    }

  return defaultState;
}

function saveWindowState(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  try {
    const bounds = mainWindow.getBounds();
    const state: WindowState = {
      maximized: mainWindow.isMaximized(),
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };

    fs.writeFileSync(WINDOW_STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error: any) {
    sendLogCommand(6, `Failed to save window state: ${error.message}`, error.stack, 'Window:saveState');
    console.error('Failed to save window state:', error);
  }
}

function createWindow(): void {
  const windowState = loadWindowState();

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#494949',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Disable WebGL to prevent GPU issues if not needed
      // enableWebGL: false, // Uncomment if GPU issues persist
      // Disable background throttling for better performance
      backgroundThrottling: false,
    },
    show: false, // Don't show until ready
  });

  // Restore maximized state
  if (windowState.maximized) {
    mainWindow.maximize();
  }

  // Load the UI
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // __dirname is dist/electron, so ../ui gets us to dist/ui
    const uiPath = path.join(__dirname, '../../ui/index.html');
    console.log('Loading UI from:', uiPath);
    console.log('__dirname is:', __dirname);
    console.log('UI path exists:', fs.existsSync(uiPath));
    
    if (!fs.existsSync(uiPath)) {
      console.error('UI file not found at:', uiPath);
      console.error('Please run: npm run build');
      return;
    }
    
    mainWindow.loadFile(uiPath).catch((error: Error) => {
      sendLogCommand(8, `Failed to load UI file: ${error.message}`, error.stack, 'Window:loadFile');
      console.error('Failed to load UI file:', error);
    });
  }

  // Show window when ready (simplified since hardware acceleration is disabled)
  // With hardware acceleration disabled, GPU process won't crash, so we can use simpler timing
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      console.log('Window shown');
    }
  });

  // Fallback: show after page loads if ready-to-show didn't fire
  mainWindow.webContents.once('did-finish-load', () => {
    console.log('Page finished loading');
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
        mainWindow.show();
        console.log('Window shown (fallback)');
      }
    }, 50);
  });
  
  // Immediate show attempt (for development)
  // This ensures window appears even if events don't fire
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
      console.log('Window shown (timeout fallback)');
    }
  }, 100);

  // Save window state on move/resize
  mainWindow.on('moved', saveWindowState);
  mainWindow.on('resized', saveWindowState);
  mainWindow.on('maximize', saveWindowState);
  mainWindow.on('unmaximize', saveWindowState);

  mainWindow.on('closed', () => {
    // Save state before clearing reference
    if (mainWindow && !mainWindow.isDestroyed()) {
      saveWindowState();
    }
    mainWindow = null;
  });
}

// Helper function to send log commands to renderer
function sendLogCommand(level: number, message: string, stack?: string, source?: string): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const serializedCommand = {
      type: 'LogCommand',
      level,
      message,
      stack,
      source,
      timestamp: Date.now()
    };
    mainWindow.webContents.send('worker:command', serializedCommand);
  }
}

// Serialize command data for IPC transmission
// Converts ByteArray/Buffer objects to ArrayBuffer for proper serialization
function serializeCommand(command: WorkerCommand): any {
  const commandName = command.constructor.name;
  const serialized: any = {
    type: commandName,
  };

  // Handle different command types
  if (commandName === 'SetThingListCommand') {
    const cmd = command as any;
    serialized.data = {
      selectedIds: cmd.selectedIds || [],
      list: (cmd.things || []).map((item: any) => serializeThingListItem(item)),
    };
  } else if (commandName === 'SetSpriteListCommand') {
    const cmd = command as any;
    serialized.data = {
      selectedIds: cmd.selectedIds || [],
      list: (cmd.sprites || []).map((sprite: any) => serializeSpriteData(sprite)),
    };
  } else if (commandName === 'SetThingDataCommand') {
    const cmd = command as any;
    serialized.data = serializeThingData(cmd.data || cmd.thingData);
  } else if (commandName === 'SetVersionsCommand') {
    const cmd = command as any;
    serialized.data = {
      versions: (cmd.versions || []).map((version: any) => ({
        value: version.value,
        valueStr: version.valueStr,
        datSignature: version.datSignature,
        sprSignature: version.sprSignature,
        otbVersion: version.otbVersion,
      })),
    };
  } else if (commandName === 'LogCommand') {
    // Handle LogCommand specially - it should be sent directly without data wrapper
    const cmd = command as any;
    serialized.level = cmd.level;
    serialized.message = cmd.message;
    serialized.stack = cmd.stack;
    serialized.source = cmd.source;
    serialized.timestamp = cmd.timestamp || Date.now();
    // Don't wrap in data for LogCommand
    return serialized;
  } else if (commandName === 'ProgressCommand') {
    // Handle ProgressCommand - forward directly without processing
    const cmd = command as any;
    serialized.id = cmd.id;
    serialized.value = cmd.value;
    serialized.total = cmd.total;
    serialized.label = cmd.label || '';
    // Don't wrap in data for ProgressCommand
    return serialized;
  } else if (commandName === 'SetClientInfoCommand') {
    // Handle SetClientInfoCommand
    const cmd = command as any;
    serialized.data = serializeObject(cmd.info || cmd.clientInfo || {});
  } else {
    // For other commands, serialize all properties
    serialized.data = serializeObject(command);
  }

  return serialized;
}

// Serialize ThingListItem
function serializeThingListItem(item: any): any {
  const serialized: any = {
    id: item.thing?.id || item.id || 0,
  };

  if (item.thing) {
    serialized.thing = {
      id: item.thing.id,
      category: item.thing.category,
    };
  }

  if (item.frameGroup) {
    serialized.frameGroup = item.frameGroup;
  }

  // Convert pixels (ByteArray/Buffer) to ArrayBuffer
  if (item.pixels) {
    serialized.pixels = convertToArrayBuffer(item.pixels);
  }

  return serialized;
}

// Serialize SpriteData
function serializeSpriteData(sprite: any): any {
  const serialized: any = {
    id: sprite.id || 0,
  };

  // Convert pixels (Buffer) to ArrayBuffer
  if (sprite.pixels) {
    serialized.pixels = convertToArrayBuffer(sprite.pixels);
  }

  return serialized;
}

// Serialize ThingData
function serializeThingData(thingData: any): any {
  if (!thingData) return null;

  const serialized: any = {
    id: thingData.id,
    category: thingData.category,
  };

  if (thingData.thing) {
    serialized.thing = thingData.thing;
  }

  // Serialize sprites Map
  if (thingData.sprites) {
    if (thingData.sprites instanceof Map) {
      const spritesMap: any = {};
      thingData.sprites.forEach((sprites: any[], groupType: number) => {
        spritesMap[groupType] = sprites.map((sprite: any) => ({
          id: sprite.id,
          pixels: convertToArrayBuffer(sprite.pixels),
        }));
      });
      serialized.sprites = spritesMap;
    } else {
      serialized.sprites = thingData.sprites;
    }
  }

  return serialized;
}

// Convert ByteArray or Buffer to ArrayBuffer for IPC
function convertToArrayBuffer(data: any): ArrayBuffer | null {
  if (!data) return null;

  try {
    // If it's already an ArrayBuffer (not SharedArrayBuffer)
    if (data instanceof ArrayBuffer) {
      return data;
    }

    // Helper to create a new ArrayBuffer from any buffer-like object
    const createArrayBuffer = (buffer: Buffer | Uint8Array | ArrayBuffer): ArrayBuffer => {
      let uint8Array: Uint8Array;
      if (Buffer.isBuffer(buffer)) {
        uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      } else if (buffer instanceof Uint8Array) {
        uint8Array = buffer;
      } else if (buffer instanceof ArrayBuffer) {
        uint8Array = new Uint8Array(buffer);
      } else {
        throw new Error('Unsupported buffer type');
      }
      
      // Create a new ArrayBuffer by copying
      const newBuffer = new ArrayBuffer(uint8Array.length);
      new Uint8Array(newBuffer).set(uint8Array);
      return newBuffer;
    };

    // If it's a Buffer
    if (Buffer.isBuffer(data)) {
      return createArrayBuffer(data);
    }

    // If it's a ByteArray with toBuffer method
    if (data.toBuffer && typeof data.toBuffer === 'function') {
      const buffer = data.toBuffer();
      if (Buffer.isBuffer(buffer)) {
        return createArrayBuffer(buffer);
      }
    }

    // If it's a Uint8Array or similar
    if (data instanceof Uint8Array || (data.buffer && data.buffer instanceof ArrayBuffer)) {
      return createArrayBuffer(data);
    }

    // Try to convert to Buffer first
    if (typeof data === 'object' && data.length !== undefined) {
      const buffer = Buffer.from(data);
      return createArrayBuffer(buffer);
    }

    return null;
  } catch (error) {
    console.error('Error converting to ArrayBuffer:', error);
    return null;
  }
}

// Serialize any object, converting ByteArray/Buffer to ArrayBuffer
function serializeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => serializeObject(item));
  }

  // Handle objects
  if (typeof obj === 'object') {
    // Check if it's a Buffer or ByteArray
    if (Buffer.isBuffer(obj) || (obj.toBuffer && typeof obj.toBuffer === 'function')) {
      return convertToArrayBuffer(obj);
    }

    // Handle Map
    if (obj instanceof Map) {
      const result: any = {};
      obj.forEach((value, key) => {
        result[key] = serializeObject(value);
      });
      return result;
    }

    // Handle regular objects
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = serializeObject(obj[key]);
      }
    }
    return result;
  }

  // Primitive types
  return obj;
}

// IPC Handlers - Set up BEFORE backend initialization so they're always available
function setupIpcHandlers(): void {
  // Send command to backend
  ipcMain.handle('worker:sendCommand', async (event, commandData: any) => {
    console.log('[IPC] Received command:', commandData.type, commandData);
    
    // LogCommand should NOT be sent to backend - it's only sent FROM backend TO UI
    // If we receive a LogCommand here, it's likely a loop - ignore it
    if (commandData.type === 'LogCommand') {
      console.warn('[IPC] Ignoring LogCommand - should not be sent from UI to backend');
      return { success: true }; // Silently ignore to prevent loops
    }
    
    if (!backendApp || !(backendApp as any).communicator) {
      const errorMsg = 'Backend not initialized. Please check console for errors.';
      sendLogCommand(8, errorMsg, undefined, 'IPC:worker:sendCommand');
      console.error('[IPC] Backend not initialized');
      return { success: false, error: errorMsg };
    }

    try {
      // Create a command object from the data
      // The WorkerCommunicator will handle routing based on command type
      const CommandClass = getCommandClass(commandData.type);
      if (!CommandClass) {
        const errorMsg = `Unknown command type: ${commandData.type}`;
        // Don't send LogCommand for unknown commands to prevent loops
        // Just log to console instead
        console.error('[IPC] Unknown command type:', commandData.type);
        return { success: false, error: errorMsg };
      }

      // Create command instance from data
      // Handle special cases for commands that need PathHelper objects
      let command;
      if (commandData.type === 'ImportSpritesFromFileCommand' || commandData.type === 'ImportThingsFromFilesCommand') {
        // Convert plain objects to PathHelper instances
        // __dirname is dist/electron/electron, so go up two levels to dist, then to otlib
        const PathHelper = require(path.join(__dirname, '../../otlib/loaders/PathHelper')).PathHelper;
        const pathHelpers = (commandData.list || []).map((item: any) => {
          if (item instanceof PathHelper) {
            return item;
          }
          return new PathHelper(item.nativePath || item.path, item.id || 0);
        });
        command = new CommandClass(pathHelpers);
      } else if (commandData.type === 'LoadFilesCommand') {
        // LoadFilesCommand needs: datFile, sprFile, version, extended, transparency, improvedAnimations, frameGroups
        console.log('[IPC] Creating LoadFilesCommand with:', {
          datFile: commandData.datFile,
          sprFile: commandData.sprFile,
          version: commandData.version,
          extended: commandData.extended,
          transparency: commandData.transparency,
          improvedAnimations: commandData.improvedAnimations,
          frameGroups: commandData.frameGroups,
        });
        
        // Version object needs to be properly constructed
        // Version can be null for auto-detect
        const Version = require(path.join(__dirname, '../../otlib/core/Version')).Version;
        let versionObj = commandData.version;
        
        // If version is provided and is a plain object, convert it to Version instance
        if (versionObj && typeof versionObj === 'object' && !(versionObj instanceof Version)) {
          versionObj = new Version();
          versionObj.value = commandData.version.value;
          versionObj.valueStr = commandData.version.valueStr;
          versionObj.datSignature = commandData.version.datSignature;
          versionObj.sprSignature = commandData.version.sprSignature;
          versionObj.otbVersion = commandData.version.otbVersion;
        }
        // If version is null/undefined, pass null (backend will auto-detect)
        
        command = new CommandClass(
          commandData.datFile,
          commandData.sprFile,
          versionObj || null, // Allow null for auto-detect
          commandData.extended,
          commandData.transparency,
          commandData.improvedAnimations,
          commandData.frameGroups
        );
      } else if (commandData.type === 'GetVersionsListCommand') {
        // GetVersionsListCommand takes no parameters
        command = new CommandClass();
      } else {
        // For other commands, use the original approach
        const args = Object.values(commandData).filter((_, i) => i !== 0);
        console.log('[IPC] Creating command with args:', args);
        command = new CommandClass(...args);
      }
      
      console.log('[IPC] Command created, handling...');
      (backendApp as any).communicator.handleCommand(command);
      console.log('[IPC] Command handled, returning success');
      
      return { success: true };
    } catch (error: any) {
      const errorMsg = `Error handling command ${commandData.type}: ${error.message}`;
      const stack = error.stack || new Error().stack;
      sendLogCommand(8, errorMsg, stack, 'IPC:worker:sendCommand');
      console.error('[IPC] Error handling command:', error);
      return { success: false, error: error.message };
    }
  });

  // Helper to get command class by type name
  function getCommandClass(typeName: string): any {
    // Dynamic import of command classes
    // This is a simplified version - in production, use a command registry
    try {
      // Use path relative to dist directory
      // __dirname is dist/electron/electron, so go up two levels to dist, then to ob/commands
      const commandsPath = path.join(__dirname, '../../ob/commands');
      const commandMap: { [key: string]: string } = {
        'LoadFilesCommand': 'files/LoadFilesCommand',
        'CreateNewFilesCommand': 'files/CreateNewFilesCommand',
        'CompileCommand': 'files/CompileCommand',
        'GetThingListCommand': 'things/GetThingListCommand',
        'GetThingCommand': 'things/GetThingCommand',
        'UpdateThingCommand': 'things/UpdateThingCommand',
        'FindThingCommand': 'things/FindThingCommand',
        'GetSpriteListCommand': 'sprites/GetSpriteListCommand',
        'ImportThingsFromFilesCommand': 'things/ImportThingsFromFilesCommand',
        'ImportSpritesFromFileCommand': 'sprites/ImportSpritesFromFileCommand',
        'ExportThingCommand': 'things/ExportThingCommand',
        'ExportSpritesCommand': 'sprites/ExportSpritesCommand',
        'MergeFilesCommand': 'files/MergeFilesCommand',
        'GetVersionsListCommand': 'GetVersionsListCommand',
        'UnloadFilesCommand': 'files/UnloadFilesCommand',
        'SetSpriteDimensionCommand': 'SetSpriteDimensionCommand',
        'LoadVersionsCommand': 'LoadVersionsCommand',
      };

      const commandPath = commandMap[typeName];
      if (commandPath) {
        const fullPath = path.join(commandsPath, `${commandPath}.js`);
        const commandModule = require(fullPath);
        return commandModule[typeName] || commandModule.default;
      }
      return null;
    } catch (error) {
      console.error(`Failed to load command class ${typeName}:`, error);
      return null;
    }
  }

  // File dialog handlers
  ipcMain.handle('dialog:open', async (event, options: any) => {
    if (!mainWindow) {
      sendLogCommand(6, 'File dialog called but mainWindow is null', undefined, 'IPC:dialog:open');
      return { canceled: true };
    }
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: options.title || 'Open File',
        defaultPath: options.defaultPath,
        filters: options.filters || [
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: options.properties || ['openFile'],
      });
      return result;
    } catch (error: any) {
      sendLogCommand(8, `Error in file dialog: ${error.message}`, error.stack, 'IPC:dialog:open');
      return { canceled: true, error: error.message };
    }
  });

  ipcMain.handle('dialog:save', async (event, options: any) => {
    if (!mainWindow) {
      sendLogCommand(6, 'Save dialog called but mainWindow is null', undefined, 'IPC:dialog:save');
      return { canceled: true };
    }
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        title: options.title || 'Save File',
        defaultPath: options.defaultPath,
        filters: options.filters || [
          { name: 'All Files', extensions: ['*'] }
        ],
      });
      return result;
    } catch (error: any) {
      sendLogCommand(8, `Error in save dialog: ${error.message}`, error.stack, 'IPC:dialog:save');
      return { canceled: true, error: error.message };
    }
  });

  ipcMain.handle('dialog:openDirectory', async (event, options: any) => {
    if (!mainWindow) {
      sendLogCommand(6, 'Directory dialog called but mainWindow is null', undefined, 'IPC:dialog:openDirectory');
      return { canceled: true };
    }
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: options.title || 'Select Directory',
        defaultPath: options.defaultPath,
        properties: ['openDirectory'],
      });
      return result;
    } catch (error: any) {
      sendLogCommand(8, `Error in directory dialog: ${error.message}`, error.stack, 'IPC:dialog:openDirectory');
      return { canceled: true, error: error.message };
    }
  });

  // Get sprite dimensions list
  ipcMain.handle('getSpriteDimensions', async (event) => {
    try {
      if (!backendApp) {
        return { success: false, error: 'Backend not initialized' };
      }

      const SpriteDimensionStorage = require(path.join(__dirname, '../../otlib/core/SpriteDimensionStorage')).SpriteDimensionStorage;
      const storage = SpriteDimensionStorage.getInstance();
      
      if (!storage.loaded) {
        // Try to load from default location
        const spritesPath = path.join(__dirname, '../../firstRun/sprites.xml');
        if (fs.existsSync(spritesPath)) {
          storage.load(spritesPath);
        }
      }

      const dimensions = storage.getList();
      const serialized = dimensions.map((dim: any) => ({
        value: dim.value,
        size: dim.size,
        dataSize: dim.dataSize,
      }));

      return { success: true, dimensions: serialized };
    } catch (error: any) {
      const errorMsg = `Error getting sprite dimensions: ${error.message || 'Unknown error'}`;
      sendLogCommand(8, errorMsg, error.stack, 'IPC:getSpriteDimensions');
      console.error('Error getting sprite dimensions:', error);
      return { success: false, error: error.message || 'Failed to get sprite dimensions' };
    }
  });

  // Load OBD file for viewing (ObjectViewer)
  ipcMain.handle('loadOBDFile', async (event, filePath: string) => {
    try {
      if (!backendApp || !(backendApp as any).settings) {
        return { success: false, error: 'Backend not initialized' };
      }

      const ThingData = require(path.join(__dirname, '../../otlib/things/ThingData')).ThingData;
      const settings = (backendApp as any).settings;
      
      const thingData = await ThingData.createFromFile(filePath, settings);
      
      if (!thingData) {
        return { success: false, error: 'Failed to load OBD file' };
      }

      // Serialize ThingData for IPC
      // Convert to plain object that can be sent via IPC
      const serialized = {
        thing: thingData.thing ? {
          id: thingData.thing.id,
          category: thingData.thing.category,
          frameGroups: thingData.thing.frameGroups ? Object.fromEntries(
            Object.entries(thingData.thing.frameGroups).map(([key, value]: [string, any]) => [
              key,
              value ? {
                type: value.type,
                width: value.width,
                height: value.height,
                layers: value.layers,
                patternX: value.patternX,
                patternY: value.patternY,
                patternZ: value.patternZ,
                frames: value.frames,
                spriteIndex: value.spriteIndex,
              } : null
            ])
          ) : {},
        } : null,
        sprites: thingData.sprites ? serializeObject(thingData.sprites) : null,
        obdVersion: thingData.obdVersion,
        clientVersion: thingData.clientVersion,
      };

      return { success: true, data: serialized };
    } catch (error: any) {
      const errorMsg = `Error loading OBD file: ${error.message || 'Unknown error'}`;
      sendLogCommand(8, errorMsg, error.stack, 'IPC:loadOBDFile');
      console.error('Error loading OBD file:', error);
      return { success: false, error: error.message || 'Failed to load OBD file' };
    }
  });
}

async function initializeBackend(): Promise<void> {
  try {
    // Import and initialize backend
    // Use require for CommonJS modules in Electron
    // __dirname is dist/electron/electron, so we need to go up two levels to dist/main.js
    // The backend main.js is compiled to dist/main.js (from src/main.ts with rootDir: "./src")
    const mainPath = path.join(__dirname, '../../main.js');
    console.log('Looking for backend at:', mainPath);
    console.log('__dirname is:', __dirname);
    console.log('Path exists:', fs.existsSync(mainPath));
    
    if (!fs.existsSync(mainPath)) {
      throw new Error(`Backend main.js not found at: ${mainPath}\n\nPlease run: npm run build:backend`);
    }
    
    const mainModule = require(mainPath);
    const ObjectBuilderApp = mainModule.ObjectBuilderApp || mainModule.default;
    if (ObjectBuilderApp) {
      backendApp = new ObjectBuilderApp();
      console.log('Backend initialized');
      
      // ObjectBuilderApp initializes asynchronously, so we need to wait for the communicator
      // Set up a function to check for communicator and set up listener
      let listenerSetup = false;
      const setupCommandListener = () => {
        if (listenerSetup) {
          return true; // Already set up
        }
        
        if (backendApp && (backendApp as any).communicator) {
          const communicator = (backendApp as any).communicator;
          console.log('[Electron] Setting up command listener on communicator');
          console.log('[Electron] Communicator instance:', communicator.constructor.name);
          console.log('[Electron] Current listener count:', communicator.listenerCount('command'));
          
          communicator.on('command', (command: WorkerCommand) => {
            const commandName = command.constructor.name;
            console.log(`[Electron] Command listener triggered: ${commandName}`);
            
            if (!mainWindow) {
              console.warn(`[Electron] Cannot forward ${commandName} - mainWindow is null`);
              return;
            }
            
            if (mainWindow.isDestroyed()) {
              console.warn(`[Electron] Cannot forward ${commandName} - mainWindow is destroyed`);
              return;
            }
            
            // LogCommand should NOT be processed by IPC handler - it's just forwarded to renderer
            // This prevents infinite loops where LogCommand errors create more LogCommands
            if (commandName === 'LogCommand') {
              // Forward LogCommand directly to renderer without processing
              const cmd = command as any;
              const serializedCommand = {
                type: 'LogCommand',
                level: cmd.level,
                message: cmd.message,
                stack: cmd.stack,
                source: cmd.source,
                timestamp: cmd.timestamp || Date.now(),
              };
              mainWindow.webContents.send('worker:command', serializedCommand);
              return;
            }
            
            // Serialize command data for IPC (convert ByteArray/Buffer to ArrayBuffer)
            const serializedCommand = serializeCommand(command);
            
            // Don't log ProgressCommand spam - it's sent very frequently during loading
            if (commandName !== 'ProgressCommand') {
              console.log(`[Electron] Forwarding ${commandName} to renderer`);
            }
            
            // Send command to renderer process
            mainWindow.webContents.send('worker:command', serializedCommand);
          });
          console.log('[Electron] Command listener set up successfully');
          listenerSetup = true;
          return true;
        }
        return false;
      };
      
      // Try to set up immediately
      if (!setupCommandListener()) {
        // If communicator not ready, poll for it (ObjectBuilderApp initializes asynchronously)
        console.log('[Electron] Communicator not ready yet, polling...');
        const pollInterval = setInterval(() => {
          if (setupCommandListener()) {
            clearInterval(pollInterval);
          }
        }, 100);
        
        // Stop polling after 5 seconds
        setTimeout(() => {
          clearInterval(pollInterval);
          if (!(backendApp && (backendApp as any).communicator)) {
            console.error('[Electron] Failed to set up command listener - communicator never became available');
          }
        }, 5000);
      }
    }
  } catch (error: any) {
    const errorMsg = `Failed to initialize backend: ${error.message}`;
    sendLogCommand(8, errorMsg, error.stack, 'Backend:initialize');
    console.error('Failed to initialize backend:', error);
    
    // If canvas module is missing, provide helpful error message
    if (error.message && error.message.includes('canvas.node')) {
      const canvasError = 'The canvas module needs to be rebuilt for Electron. Please run: npm run rebuild';
      sendLogCommand(8, canvasError, undefined, 'Backend:initialize');
      console.error('\n=== CANVAS MODULE ERROR ===');
      console.error('The canvas module needs to be rebuilt for Electron.');
      console.error('Please run: npm run rebuild');
      console.error('Or: npm install canvas --build-from-source');
      console.error('===========================\n');
    }
    // Continue even if backend fails - UI can still work for some features
  }
}

// Fix GPU process crashes on Windows
// This prevents the blinking/flickering on startup
if (process.platform === 'win32') {
  // Disable GPU sandbox to prevent crashes
  app.commandLine.appendSwitch('disable-gpu-sandbox');
  // Disable hardware acceleration entirely to prevent GPU process crashes
  // This uses software rendering instead, which is more stable on Windows
  app.disableHardwareAcceleration();
}

// Suppress GPU process error messages in console
app.commandLine.appendSwitch('disable-gpu-process-crash-limit');
// Additional flag to prevent GPU issues
app.commandLine.appendSwitch('disable-gpu');

app.whenReady().then(async () => {
  // Set up IPC handlers FIRST, before backend initialization
  // This ensures handlers are always available even if backend fails
  setupIpcHandlers();
  
  // Create window and menu FIRST so UI appears immediately
  // Backend initialization can happen in the background
  createWindow();
  createMenu();
  
  // Then initialize backend asynchronously (don't await - let it happen in background)
  // This prevents blocking the UI from appearing
  initializeBackend().catch((error) => {
    console.error('Backend initialization error:', error);
    // Window is already created, so user can see the error if needed
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'file-new');
            }
          },
        },
        {
          label: 'Open Project',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'file-open');
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Compile',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'file-compile');
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Import...',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'file-import');
            }
          },
        },
        {
          label: 'Export...',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'file-export');
            }
          },
        },
        {
          label: 'Merge Files...',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'file-merge');
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'file-preferences');
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', label: 'Undo' },
        { role: 'redo', label: 'Redo' },
        { type: 'separator' },
        { role: 'cut', label: 'Cut' },
        { role: 'copy', label: 'Copy' },
        { role: 'paste', label: 'Paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Preview Panel',
          accelerator: 'F2',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'view-preview');
            }
          },
        },
        {
          label: 'Toggle Objects Panel',
          accelerator: 'F3',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'view-objects');
            }
          },
        },
        {
          label: 'Toggle Sprites Panel',
          accelerator: 'F4',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'view-sprites');
            }
          },
        },
        {
          label: 'Toggle File Info Panel',
          accelerator: 'F5',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'view-file-info');
            }
          },
        },
        { type: 'separator' },
        { role: 'reload', label: 'Reload' },
        { role: 'forceReload', label: 'Force Reload' },
        { role: 'toggleDevTools', label: 'Toggle Developer Tools' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Actual Size' },
        { role: 'zoomIn', label: 'Zoom In' },
        { role: 'zoomOut', label: 'Zoom Out' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toggle Full Screen' },
      ],
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'tools-find');
            }
          },
        },
        {
          label: 'Object Viewer',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'tools-object-viewer');
            }
          },
        },
      ],
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Log Window',
          accelerator: 'CmdOrCtrl+L',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'window-log');
            }
          },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'help-about');
            }
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (backendApp) {
      backendApp.shutdown();
    }
    saveWindowState();
    app.quit();
  }
});

app.on('before-quit', () => {
  saveWindowState();
  if (backendApp) {
    backendApp.shutdown();
  }
});

