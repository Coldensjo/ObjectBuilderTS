# UI Framework Setup Guide

## Overview

The UI has been set up using React 18 with TypeScript and Vite as the build tool. The structure follows the original MXML layout with modern React components.

## Project Structure

```
ui/
├── index.html              # Main HTML entry point
├── src/
│   ├── main.tsx           # React entry point
│   ├── App.tsx            # Main app component
│   ├── contexts/          # React contexts
│   │   └── WorkerContext.tsx  # Worker communication context
│   ├── services/          # Services
│   │   └── WorkerService.ts   # Backend communication service
│   └── components/        # React components
│       ├── MainWindow.tsx
│       ├── Toolbar.tsx
│       ├── PreviewPanel.tsx
│       ├── ThingsPanel.tsx
│       ├── SpritesPanel.tsx
│       ├── ThingEditor.tsx
│       └── SplashScreen.tsx
└── tsconfig.json          # TypeScript config for UI
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install:
- React 18
- React DOM
- Vite (build tool)
- TypeScript types
- Electron (for desktop app)

### 2. Development Mode

```bash
# Start UI development server
npm run dev:ui

# In another terminal, start backend
npm run dev
```

The UI will be available at `http://localhost:3000`

### 3. Build

```bash
# Build both backend and UI
npm run build

# Build only backend
npm run build:backend

# Build only UI
npm run build:ui
```

## Component Structure

### MainWindow
The main application window containing:
- Toolbar (top)
- Preview Panel (left, collapsible)
- Things Panel (left, collapsible)
- Thing Editor (center)
- Sprites Panel (right, collapsible)

### Worker Communication

The `WorkerService` handles communication between UI and backend:

```typescript
const worker = useWorker();
await worker.sendCommand(new LoadFilesCommand(...));
```

## Completed Features

1. ✅ **Electron Integration**
   - Electron main process set up
   - IPC communication configured
   - File dialogs implemented

2. ✅ **Components Connected to Backend**
   - Command sending in components
   - Command response handling
   - UI state updates based on responses

3. ✅ **Component Implementation**
   - Thing list rendering
   - Sprite list rendering
   - Thing editor form
   - File dialog integration

4. ✅ **State Management**
   - Custom hooks for state management
   - React Context for global state
   - Loading states handled

## Next Steps

1. **Complete Component Implementation**
   - Preview canvas rendering
   - Sprite preview thumbnails
   - Enhanced ThingEditor with all properties

2. **UI Enhancements**
   - Progress indicators
   - Error handling UI
   - Toast notifications
   - Loading spinners

3. **Additional Features**
   - Window state management
   - Menu integration
   - Keyboard shortcuts
   - Drag and drop support

## Communication Architecture

```
UI Component → WorkerService → Electron IPC / WebSocket → Backend Worker
                ↓
            Command Response → Update UI State
```

## Development Notes

- UI uses React 18 with hooks
- TypeScript strict mode enabled
- CSS modules or styled-components can be added
- Vite provides fast HMR (Hot Module Replacement)
- Components are functional with hooks

