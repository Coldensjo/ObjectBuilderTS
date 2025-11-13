# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  (UI Framework - React/Vue/Angular - To be implemented)  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Command Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ File Commands│  │Thing Commands│  │Sprite Commands│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Worker Communication Layer                  │
│              (WorkerCommunicator)                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Background Processing Layer                │
│            (ObjectBuilderWorker)                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  File Operations  │  Thing Operations  │ Sprites│  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
┌─────────────┐ ┌──────────┐ ┌──────────┐
│ThingStorage │ │SpriteStor│ │VersionStor│
└─────────────┘ └──────────┘ └──────────┘
```

## Component Overview

### 1. Application Layer

**main.ts**
- Application initialization
- Settings loading
- Worker creation
- Lifecycle management

**cli.ts**
- Interactive command-line interface
- Command parsing and execution
- User interaction

### 2. Command Layer

**Command Pattern Implementation**
- Base: `WorkerCommand`
- File Commands: `LoadFilesCommand`, `CreateNewFilesCommand`, `CompileCommand`, etc.
- Thing Commands: `NewThingCommand`, `UpdateThingCommand`, `ImportThingsCommand`, etc.
- Sprite Commands: `NewSpriteCommand`, `ImportSpritesCommand`, `ExportSpritesCommand`, etc.

### 3. Worker Communication Layer

**WorkerCommunicator**
- Command routing
- Event handling
- Async callback support
- Command registration

### 4. Background Processing Layer

**ObjectBuilderWorker**
- Main processing logic
- File operations
- Thing operations
- Sprite operations
- Optimization operations

**Key Callbacks:**
- File: `createNewFilesCallback`, `loadFilesCallback`, `compileAsCallback`
- Thing: `newThingCallback`, `updateThingCallback`, `importThingsCallback`
- Sprite: `newSpriteCallback`, `addSpritesCallback`, `importSpritesFromFilesCallback`

### 5. Storage Layer

**ThingTypeStorage**
- Manages thing types (items, outfits, effects, missiles)
- Loads from `.dat` files
- Compiles to `.dat` files
- Version-specific metadata handling

**SpriteStorage**
- Manages sprite data
- Loads from `.spr` files
- Compiles to `.spr` files
- Sprite indexing and compression

**VersionStorage**
- Client version information
- XML-based storage
- Version detection

**SpriteDimensionStorage**
- Sprite dimension configurations
- XML-based storage

## Data Flow

### Loading Files

```
1. UI/CLI sends LoadFilesCommand
   ↓
2. WorkerCommunicator routes to ObjectBuilderWorker
   ↓
3. ObjectBuilderWorker.loadFilesCallback()
   ↓
4. ThingTypeStorage.load(datFile)
   ↓
5. SpriteStorage.load(sprFile)
   ↓
6. Events emitted for progress/completion
   ↓
7. Commands sent back to UI (SetClientInfoCommand, SetThingListCommand)
```

### Creating New Thing

```
1. UI/CLI sends NewThingCommand
   ↓
2. WorkerCommunicator routes to ObjectBuilderWorker
   ↓
3. ObjectBuilderWorker.newThingCallback()
   ↓
4. ThingType.create() - Creates new ThingType
   ↓
5. ThingTypeStorage.addThing(thing)
   ↓
6. SetThingDataCommand sent to UI
```

### Compiling Project

```
1. UI/CLI sends CompileCommand
   ↓
2. ObjectBuilderWorker.compileCallback()
   ↓
3. ThingTypeStorage.compile(datFile)
   ↓
4. SpriteStorage.compile(sprFile)
   ↓
5. OTFI file saved (if needed)
   ↓
6. SetClientInfoCommand sent to UI
```

## Event System

### EventEmitter Pattern

All major classes extend `EventEmitter`:

- `ObjectBuilderWorker` - Emits progress and completion events
- `ThingTypeStorage` - Emits storage events
- `SpriteStorage` - Emits storage events
- `ClientMerger` - Emits merge progress
- `SpritesOptimizer` - Emits optimization progress

### Event Types

- `ProgressEvent` - Progress updates
- `StorageEvent` - Storage operations
- `complete` - Operation completion
- `error` - Error events

## File Format Handling

### Metadata Files (.dat)

**Version Detection:**
- Reads file signature
- Determines client version
- Selects appropriate metadata reader/writer

**Metadata Readers:**
- `MetadataReader1` - Client version 1
- `MetadataReader2` - Client version 2
- `MetadataReader3-6` - Client versions 3-6

**Metadata Writers:**
- `MetadataWriter1-6` - Corresponding writers

### Sprite Files (.spr)

**Sprite Reading:**
- Reads sprite count
- Reads sprite data with compression
- Indexes sprites by ID

**Sprite Writing:**
- Writes sprite count
- Writes sprite data with compression
- Maintains sprite indices

### OBD Files (.obd)

**Encoding:**
- Serializes ThingData
- Compresses with LZMA
- Writes version header

**Decoding:**
- Reads version header
- Decompresses with LZMA
- Deserializes ThingData

## Settings Management

### Settings Flow

```
1. Application startup
   ↓
2. SettingsManager.getInstance()
   ↓
3. SettingsManager.loadSettings(ObjectBuilderSettings)
   ↓
4. JSON file read from ~/.objectbuilder/settings/
   ↓
5. ObjectBuilderSettings.unserialize(data)
   ↓
6. SettingsCommand sent to worker
```

### Settings Storage

- **Format**: JSON (OTML support can be added)
- **Location**: OS-specific app data directory
- **File**: `ObjectBuilderSettings.otcfg`

## Image Processing

### BitmapData Abstraction

- Uses `canvas` library for Node.js
- Provides Flash BitmapData-like API
- Supports pixel manipulation
- Channel operations

### Image Encoding

- `ImageCodec` class
- Supports PNG, JPEG, BMP, GIF
- JPEG quality control
- Transparent background support

## Error Handling

### Error Propagation

```
Operation → Try/Catch → Error Event → UI Command → User Notification
```

### Error Types

- File I/O errors
- Format errors
- Validation errors
- Storage errors

## Performance Considerations

### Async Operations

- File I/O is async
- Image processing uses async/await
- Progress events for long operations

### Memory Management

- Large files processed in chunks
- Bitmap data disposed after use
- Event listeners cleaned up

## Extension Points

### Adding New Commands

1. Create command class extending `WorkerCommand`
2. Register in `ObjectBuilderWorker.register()`
3. Implement callback method
4. Add CLI command (optional)

### Adding New Storage Types

1. Implement `IStorage` interface
2. Extend `EventEmitter`
3. Register in application initialization

### Adding New File Formats

1. Create reader/writer classes
2. Add format detection
3. Integrate with storage classes

## Security Considerations

### File Operations

- Path validation
- Permission checks
- File existence checks

### Data Validation

- Type checking
- Range validation
- Format validation

## Future Enhancements

### UI Framework Integration

- React/Vue/Angular components
- State management
- Real-time updates
- Drag-and-drop support

### Testing

- Unit tests
- Integration tests
- E2E tests
- Performance tests

### Performance

- Worker threads for heavy operations
- Caching strategies
- Lazy loading
- Memory optimization

