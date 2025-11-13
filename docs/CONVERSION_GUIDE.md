# TypeScript Conversion Guide

This document outlines the conversion of the Object Builder application from ActionScript/MXML to TypeScript.

## Overview

The original application was built using Adobe AIR/Flash with ActionScript (.as) and MXML (.mxml) files. This conversion transforms it into a modern TypeScript application.

## Conversion Status

### Completed Core Classes

- ✅ `otlib/core/Version.ts` - Version management
- ✅ `otlib/core/SpriteDimension.ts` - Sprite dimension handling
- ✅ `otlib/core/IVersionStorage.ts` - Version storage interface
- ✅ `otlib/utils/ChangeResult.ts` - Result wrapper class
- ✅ `otlib/things/ThingCategory.ts` - Thing category constants
- ✅ `otlib/things/FrameGroupType.ts` - Frame group type constants
- ✅ `otlib/animation/FrameDuration.ts` - Frame duration handling
- ✅ `otlib/animation/FrameGroup.ts` - Frame group class
- ✅ `otlib/animation/AnimationMode.ts` - Animation mode constants
- ✅ `otlib/geom/Size.ts` - Size utility class
- ✅ `otlib/utils/SpriteExtent.ts` - Sprite extent constants
- ✅ `otlib/utils/ClientInfo.ts` - Client information class
- ✅ `ob/core/IObjectBuilder.ts` - Main application interface
- ✅ `ob/utils/ObUtils.ts` - Utility functions

### Key Conversion Patterns

#### 1. Package to Module Conversion
**ActionScript:**
```actionscript
package otlib.core {
    public class Version { }
}
```

**TypeScript:**
```typescript
export class Version { }
```

#### 2. Type Conversions
- `uint` → `number`
- `int` → `number`
- `Boolean` → `boolean`
- `String` → `string`
- `Vector.<T>` → `T[]` or `Array<T>`
- `Array` → `any[]` or specific type array

#### 3. Flash/AIR API Replacements
- `flash.filesystem.File` → Node.js `fs` module or `path` module
- `flash.utils.ByteArray` → `Buffer` (Node.js) or `Uint8Array` (browser)
- `flash.display.BitmapData` → Canvas API or image processing libraries
- `flash.events.EventDispatcher` → `EventEmitter` (Node.js) or custom event system
- `mx.resources.ResourceManager` → Custom i18n solution or library

#### 4. MXML to Web Framework
MXML files need to be converted to:
- React components
- Vue components
- Angular components
- Or vanilla TypeScript with DOM manipulation

#### 5. Static Classes
**ActionScript:**
```actionscript
public final class ThingCategory {
    public function ThingCategory() {
        throw new AbstractClassError(ThingCategory);
    }
    public static const ITEM:String = "item";
}
```

**TypeScript:**
```typescript
export class ThingCategory {
    private constructor() {
        throw new Error("ThingCategory is a static class");
    }
    public static readonly ITEM: string = "item";
}
```

#### 6. Interfaces
**ActionScript:**
```actionscript
public interface IObjectBuilder {
    function get locked():Boolean;
}
```

**TypeScript:**
```typescript
export interface IObjectBuilder {
    readonly locked: boolean;
}
```

## Remaining Work

### High Priority
1. **Core Data Models** (100+ files)
   - `otlib/things/ThingType.ts`
   - `otlib/things/ThingData.ts`
   - `otlib/sprites/SpriteData.ts`
   - `otlib/sprites/SpriteStorage.ts`
   - `otlib/things/ThingTypeStorage.ts`

2. **Storage and Loaders** (20+ files)
   - `otlib/storages/*.ts`
   - `otlib/loaders/*.ts`
   - `otlib/core/VersionStorage.ts`
   - `otlib/core/SpriteDimensionStorage.ts`

3. **Command Pattern** (50+ files)
   - `ob/commands/**/*.ts`
   - Command base classes
   - All command implementations

4. **Worker/Background Processing**
   - `ObjectBuilderWorker.ts` - Main worker class
   - Worker communication system
   - Background processing logic

5. **Settings and Configuration**
   - `ob/settings/ObjectBuilderSettings.ts`
   - `otlib/settings/*.ts`

### Medium Priority
6. **UI Components** (50+ files)
   - Convert all MXML files to chosen web framework
   - Replace Flex components with web equivalents
   - Implement custom components

7. **Utilities** (30+ files)
   - Color utilities
   - File utilities
   - String utilities
   - Image processing utilities

8. **Events** (10+ files)
   - Custom event classes
   - Event dispatcher implementations

### Low Priority
9. **Resources and Localization**
   - Resource bundle system
   - String localization
   - Asset management

10. **Hotkeys and Menu System**
    - Hotkey management
    - Menu system
    - Tooltip bindings

## Build System

The project uses:
- **TypeScript** 5.0+ for compilation
- **Node.js** for runtime (replacing Adobe AIR)
- **npm** for package management

### Build Commands
```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run dev          # Watch mode compilation
npm start            # Run the application
```

## Dependencies Needed

### Core Dependencies
- `typescript` - TypeScript compiler
- `@types/node` - Node.js type definitions

### Potential Dependencies (to be added as needed)
- Image processing: `sharp`, `jimp`, or `canvas`
- File handling: `fs-extra`
- XML parsing: `xml2js` (already added)
- Event system: Built-in `events` (Node.js)
- UI Framework: To be determined (React/Vue/Angular/vanilla)

## File Structure

```
src/
├── ob/              # Object Builder specific code
│   ├── commands/     # Command pattern implementations
│   ├── components/   # UI components (to be converted from MXML)
│   ├── core/         # Core interfaces
│   ├── hotkeys/      # Hotkey management
│   ├── menu/         # Menu system
│   ├── settings/     # Settings management
│   └── utils/        # Utility functions
├── otlib/            # Core library
│   ├── animation/    # Animation classes
│   ├── assets/       # Asset management
│   ├── components/   # UI components
│   ├── core/         # Core classes
│   ├── events/       # Event classes
│   ├── geom/         # Geometry utilities
│   ├── loaders/      # File loaders
│   ├── obd/          # OBD format handling
│   ├── otml/         # OTML parsing
│   ├── resources/    # Resource management
│   ├── settings/     # Settings
│   ├── sprites/      # Sprite handling
│   ├── storages/     # Storage implementations
│   ├── things/       # Thing type handling
│   └── utils/        # Utility functions
└── index.ts          # Main entry point (to be created)
```

## Notes

1. **Flash/AIR Specific APIs**: All Flash/AIR specific APIs need to be replaced with web/Node.js equivalents
2. **MXML Components**: All MXML files need to be converted to a web framework
3. **Binary File Handling**: Sprite and DAT file handling needs Node.js Buffer APIs
4. **UI Framework**: A decision needs to be made on which UI framework to use (React, Vue, Angular, or vanilla)
5. **Worker Threads**: The worker system needs to be converted to Node.js Worker Threads or Web Workers
6. **File System**: Replace `flash.filesystem.File` with Node.js `fs` and `path` modules

## Next Steps

1. Continue converting core data models
2. Implement storage and loader classes
3. Convert command pattern classes
4. Set up worker/background processing
5. Choose and implement UI framework
6. Convert MXML components
7. Implement file I/O with Node.js
8. Set up build and deployment pipeline

