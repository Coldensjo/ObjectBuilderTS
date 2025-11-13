# UI Components Documentation

## Overview

This document describes the React UI components implemented for the Object Builder application.

## Core Components

### MainWindow
The main application window container that orchestrates all panels and components.

**Location:** `ui/src/components/MainWindow.tsx`

**Features:**
- Toolbar at the top
- Preview panel (left, collapsible)
- Things panel (left, collapsible)
- Thing editor (center)
- Sprites panel (right, collapsible)

### Toolbar
Top toolbar with file operations and category selection.

**Location:** `ui/src/components/Toolbar.tsx`

**Features:**
- New project button
- Open project button (with file dialog)
- Save project button
- Compile button
- Category buttons (Items, Outfits, Effects, Missiles)

### ThingEditor
Form component for editing thing properties.

**Location:** `ui/src/components/ThingEditor.tsx`

**Features:**
- Basic properties (ID, Category)
- Ground properties (isGround, groundSpeed)
- Item properties (stackable, pickupable)
- Light properties (hasLight, lightLevel, lightColor)
- Save functionality

### ThingList
List component displaying things by category.

**Location:** `ui/src/components/ThingList.tsx`

**Features:**
- Displays thing list from backend
- Selection handling
- Loading states
- Empty state handling

### SpriteList
List component displaying sprites for selected thing.

**Location:** `ui/src/components/SpriteList.tsx`

**Features:**
- Displays sprite list
- Selection handling
- Placeholder for sprite preview

### PreviewCanvas
Canvas component for rendering thing previews.

**Location:** `ui/src/components/PreviewCanvas.tsx`

**Features:**
- HTML5 Canvas rendering
- Sprite pixel rendering
- Background color support
- Placeholder when no data

## UI Utilities

### ProgressIndicator
Modal overlay showing loading progress.

**Location:** `ui/src/components/ProgressIndicator.tsx`

**Usage:**
```typescript
const { showProgress, hideProgress, updateProgress } = useProgress();
showProgress('Loading file...', 0);
updateProgress(50, 'Processing...');
hideProgress();
```

### Toast
Notification component for user feedback.

**Location:** `ui/src/components/Toast.tsx`

**Usage:**
```typescript
const { showSuccess, showError, showWarning, showInfo } = useToast();
showSuccess('File saved successfully');
showError('Failed to load file');
```

## Contexts

### WorkerContext
Provides worker service for backend communication.

**Location:** `ui/src/contexts/WorkerContext.tsx`

### AppStateContext
Manages global application state.

**Location:** `ui/src/contexts/AppStateContext.tsx`

**State:**
- Client info
- Current category
- Selected thing IDs
- Selected sprite IDs
- Loading state
- Error state

### ProgressContext
Manages progress indicator state.

**Location:** `ui/src/contexts/ProgressContext.tsx`

## Services

### WorkerService
Handles communication with backend worker.

**Location:** `ui/src/services/WorkerService.ts`

**Methods:**
- `connect()` - Connect to backend
- `sendCommand(command)` - Send command to backend
- `onCommand(callback)` - Listen for commands from backend
- `disconnect()` - Disconnect from backend

### FileDialogService
Handles file dialogs using Electron API.

**Location:** `ui/src/services/FileDialogService.ts`

**Methods:**
- `showOpenDialog(options)` - Show open file dialog
- `showSaveDialog(options)` - Show save file dialog
- `showOpenDirectoryDialog(options)` - Show directory selection dialog
- `openDatSprFiles(defaultPath?)` - Convenience method for DAT/SPR files
- `openOBDFile(defaultPath?)` - Convenience method for OBD files
- `openImageFiles(defaultPath?)` - Convenience method for image files

### CommandFactory
Creates command objects for backend communication.

**Location:** `ui/src/services/CommandFactory.ts`

**Methods:**
- `createLoadFilesCommand(...)` - Create load files command
- `createCreateNewFilesCommand(...)` - Create new files command
- `createCompileCommand()` - Create compile command
- `createGetThingListCommand(...)` - Create get thing list command
- `createGetThingCommand(...)` - Create get thing command
- `createUpdateThingCommand(...)` - Create update thing command

## Hooks

### useAppState
Custom hook for managing application state.

**Location:** `ui/src/hooks/useAppState.ts`

**Returns:**
- State object with client info, category, selections, etc.
- Setters for updating state

### useToast
Custom hook for showing toast notifications.

**Location:** `ui/src/hooks/useToast.ts`

**Returns:**
- `showToast(message, type, duration?)`
- `showSuccess(message, duration?)`
- `showError(message, duration?)`
- `showWarning(message, duration?)`
- `showInfo(message, duration?)`
- `ToastContainer` component

## Styling

All components use CSS variables for theming:

```css
--bg-primary: Background color
--bg-secondary: Secondary background
--bg-tertiary: Tertiary background
--text-primary: Primary text color
--text-secondary: Secondary text color
--border-color: Border color
--accent-color: Accent color
--accent-hover: Accent hover color
```

## Recent Improvements

1. ✅ **SpriteList** - Auto-loads sprites when a thing is selected
2. ✅ **PreviewPanel** - Frame group selector (DEFAULT/WALKING) for outfits
3. ✅ **ExportDialog** - Connected to app state for selected IDs
4. ✅ **PreviewCanvas** - Multi-sprite composition with improved data format handling
5. ✅ **FindDialog** - Navigate to thing when result is clicked
6. ✅ **PreferencesDialog** - Save settings to backend via SettingsCommand
7. ✅ **Toolbar** - Category changes automatically trigger thing list reload

## Next Steps

1. ⏳ Animation support in preview canvas (partially implemented)
2. ⏳ Load versions list in LoadFilesDialog
3. ⏳ Drag and drop support
4. ⏳ Keyboard shortcuts
5. ⏳ Additional utility dialogs

