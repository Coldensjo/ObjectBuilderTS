# Changelog

## [Unreleased] - Latest Session

### Added
- Import/Export/Merge dialogs integrated into MainWindow with full backend connectivity
- Menu items for Import (Ctrl+I), Export (Ctrl+E), and Merge Files operations
- CommandFactory methods: `createImportThingsFromFilesCommand`, `createImportSpritesFromFilesCommand`, `createExportThingCommand`, `createExportSpritesCommand`, `createMergeFilesCommand`
- Sprite preview thumbnails in ThingList and SpriteList
  - Reusable SpriteThumbnail component
  - 32x32 sprite thumbnails scaled 2x (64x64 display)
  - Pixel-perfect rendering with crisp edges
  - Placeholder for items without sprites
- Enhanced ThingEditor with comprehensive property editing
  - Movement properties (unpassable, unmoveable, blockMissile, blockPathfind)
  - Container properties
  - Writable properties with max text length
  - Offset and elevation properties
  - Minimap properties
  - Market properties (for items)
- Find/Search dialog window
- Documentation consolidation (PROJECT_STATUS.md, DEVELOPMENT.md, DOCUMENTATION.md, SUMMARY.md)
- Tools menu in Electron menu bar
- Find command integration

### Changed
- Updated progress tracking to 90% complete
- Consolidated documentation files
- Removed outdated documentation files (PROGRESS_SUMMARY.md, README_TYPESCRIPT.md)

## Previous Sessions

### Added
- React UI framework with TypeScript
- Electron desktop app integration
- Window state management (position, size, maximized)
- Menu bar with keyboard shortcuts
- File dialogs (open, save, directory selection)
- Progress indicators for long operations
- Toast notifications for user feedback
- Reusable Dialog component system
- About dialog window
- Preferences dialog window
- Preview canvas for sprite rendering
- Thing list and editor components
- Sprite list component
- State management with React Context
- Command factory for UI-backend communication

### Changed
- Migrated from Adobe AIR/Flash to Electron + React
- Replaced ActionScript with TypeScript
- Replaced MXML with React components
- Updated build system to use Vite
- Modernized UI with React 18

### Fixed
- Command routing in Electron IPC
- Window state persistence
- Progress indicator integration
- Error handling in file operations

## Backend Conversion

### Completed
- All 39 command classes
- Complete worker system with all callbacks
- All storage classes (ThingTypeStorage, SpriteStorage, VersionStorage, SpriteDimensionStorage)
- All loader classes (ThingDataLoader, SpriteDataLoader, StorageQueueLoader)
- Settings management system
- File I/O operations
- Image processing utilities
- Binary data handling

### Technology Stack
- TypeScript 5.0+
- Node.js 18+
- React 18
- Electron 27
- Vite 5
- Sharp (image processing)
- Canvas (image rendering)
- lzma-native (compression)
- xml2js (XML parsing)

