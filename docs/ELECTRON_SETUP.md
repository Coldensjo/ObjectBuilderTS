# Electron Integration Setup

## Overview

The application uses Electron to provide a desktop app experience, bridging the React UI with the Node.js backend.

## Architecture

```
Electron Main Process (electron/main.ts)
    ↓
Backend (ObjectBuilderApp)
    ↓
Worker (ObjectBuilderWorker)
    ↓
IPC Communication
    ↓
Electron Renderer (React UI)
```

## Setup

### 1. Build All Components

```bash
# Build backend, UI, and Electron
npm run build
```

### 2. Development Mode

```bash
# Start Electron with hot reload
npm run dev:electron
```

This will:
- Start Vite dev server for UI (port 3000)
- Wait for UI to be ready
- Launch Electron window

### 3. Production Build

```bash
npm run build
npm run start:electron
```

## IPC Communication

### Main Process → Renderer

Commands from backend are sent to renderer via IPC:

```typescript
mainWindow.webContents.send('worker:command', {
  type: 'SetClientInfoCommand',
  data: clientInfo
});
```

### Renderer → Main Process

Commands from UI are sent to main process:

```typescript
const result = await window.electronAPI.sendCommand(command);
```

## Command Routing

Commands are routed through:
1. UI sends command via `WorkerService`
2. Electron IPC forwards to main process
3. Main process creates command instance
4. Command is sent to `WorkerCommunicator`
5. `ObjectBuilderWorker` handles the command
6. Response is sent back via IPC

## File Structure

```
electron/
├── main.ts          # Main process entry point
├── preload.ts       # Preload script (secure bridge)
└── tsconfig.json    # TypeScript config for Electron
```

## Security

- Context isolation enabled
- Node integration disabled in renderer
- Preload script provides secure API bridge
- Only necessary APIs exposed to renderer

## Next Steps

1. **File Dialogs**
   - Implement Electron dialog API
   - File open/save dialogs
   - Directory selection

2. **Window Management**
   - Window state persistence
   - Multi-window support
   - Menu integration

3. **Native Features**
   - System tray
   - Notifications
   - Auto-updater

