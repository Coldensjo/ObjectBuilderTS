# Development Guide

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- TypeScript 5.0+

### Installation
```bash
npm install
```

### Development

```bash
# Build backend
npm run build:backend

# Build UI
npm run build:ui

# Build everything
npm run build

# Development mode (watch)
npm run dev

# UI development server
npm run dev:ui

# Electron development
npm run dev:electron
```

### Running

```bash
# Start backend
npm start

# Start CLI
npm run cli

# Start Electron app
npm run start:electron
```

## Project Structure

### Backend (`src/`)
- **main.ts** - Application entry point
- **cli.ts** - Command-line interface
- **ob/** - Object Builder specific code
  - **commands/** - Command pattern classes (39 commands)
  - **workers/** - Background processing
  - **settings/** - Settings management
  - **utils/** - Utilities
- **otlib/** - Open Tibia library
  - **core/** - Core classes (Version, Storage)
  - **things/** - Thing type system
  - **sprites/** - Sprite system
  - **storages/** - Storage implementations
  - **loaders/** - File loaders

### Electron (`electron/`)
- **main.ts** - Main process (window management, IPC)
- **preload.ts** - Preload script (secure bridge)

### UI (`ui/src/`)
- **components/** - React components
- **contexts/** - React contexts (Worker, AppState, Progress)
- **services/** - Services (WorkerService, FileDialogService, CommandFactory)
- **hooks/** - Custom hooks (useAppState, useToast)

## Architecture

### Communication Flow
```
UI Component
    ↓
WorkerService
    ↓
Electron IPC
    ↓
Main Process
    ↓
ObjectBuilderApp
    ↓
ObjectBuilderWorker
    ↓
Storage/Operations
```

### Command Pattern
All operations use the command pattern:
1. UI creates command via `CommandFactory`
2. Command sent via `WorkerService`
3. Electron IPC forwards to main process
4. Main process creates command instance
5. Command routed to `ObjectBuilderWorker`
6. Worker executes operation
7. Response sent back via IPC

## Key Features

### File Operations
- Create new project files
- Load existing files (.dat, .spr)
- Merge files
- Compile to .dat/.spr
- Unload project

### Thing Operations
- Create, update, delete things
- Import/export things
- Find things
- Optimize things
- Convert between formats

### Sprite Operations
- Add, remove sprites
- Import/export sprites
- Replace sprites
- Find sprites
- Optimize sprites

## Development Tips

### Adding New Commands
1. Create command class in `src/ob/commands/`
2. Add callback in `ObjectBuilderWorker`
3. Register in `WorkerCommunicator`
4. Add to `CommandFactory` in UI
5. Add to command map in `electron/main.ts`

### Adding New UI Components
1. Create component in `ui/src/components/`
2. Add styles in component CSS file
3. Integrate into parent component
4. Add to state management if needed

### Testing
- Use CLI (`npm run cli`) for backend testing
- Use Electron dev mode for UI testing
- Check console for errors
- Use React DevTools for component inspection

## Build Output

- **Backend**: `dist/` (TypeScript compiled to JavaScript)
- **UI**: `dist/ui/` (Vite build output)
- **Electron**: `dist/electron/` (Electron main process)

## Configuration

### TypeScript
- `tsconfig.json` - Backend TypeScript config
- `ui/tsconfig.json` - UI TypeScript config
- `electron/tsconfig.json` - Electron TypeScript config

### Vite
- `vite.config.ts` - Vite build configuration

### Electron
- `electron/main.ts` - Main process configuration
- Window state saved in `app.getPath('userData')/window-state.json`
- Settings saved in OS-specific application data directory

## Troubleshooting

### Build Errors
- Check TypeScript version compatibility
- Ensure all dependencies are installed
- Clear `dist/` and rebuild

### Runtime Errors
- Check Electron version compatibility
- Verify IPC communication
- Check console for errors

### UI Issues
- Check React DevTools
- Verify component state
- Check CSS variables

## Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [Component Documentation](./UI_COMPONENTS.md)
- [Electron Setup](./ELECTRON_SETUP.md)
- [Current Status](./CURRENT_STATUS.md)
- [Project Status](./PROJECT_STATUS.md)

