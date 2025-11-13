# ObjectBuilder - TypeScript Version

> **Status**: ~93% Complete | Backend: 100% ✅ | UI: 93% ✅

A complete TypeScript conversion of the Adobe AIR/Flash-based ObjectBuilder application for OpenTibia object editing.

**Built with**: TypeScript, React, Electron, Node.js

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- TypeScript 5.0+

### Installation

```bash
npm install
```

### Build

```bash
npm run build
```

### Run

```bash
# Start Electron application (desktop app with UI) ⭐ USE THIS TO RUN THE APP
npm run start:electron

# Start backend only (keeps running, for testing)
npm start

# Start CLI interface (interactive)
npm run cli

# Development mode (watch backend)
npm run dev

# Development mode (Electron with hot reload)
npm run dev:electron
```

**Note:** To run the desktop application, use `npm run start:electron`. The `npm start` command runs the backend only (useful for testing).

## 📁 Project Structure

```
ironcore-object-builder/
├── actionscript-blueprint/ # ⚠️ ORIGINAL ACTIONSCRIPT CODE (Reference Only)
│   └── README.md          # See this folder's README for details
├── src/                    # Backend TypeScript code
│   ├── main.ts            # Application entry point
│   ├── cli.ts             # CLI interface
│   ├── ob/                # Object Builder specific
│   │   ├── commands/      # Command pattern (39 commands)
│   │   ├── workers/       # Background processing
│   │   ├── settings/      # Settings management
│   │   └── utils/         # Utilities
│   └── otlib/             # Open Tibia library
│       ├── core/          # Core classes
│       ├── things/        # Thing type system
│       ├── sprites/       # Sprite system
│       ├── storages/      # Storage implementations
│       └── loaders/       # File loaders
├── electron/              # Electron main process
│   ├── main.ts           # Main process
│   └── preload.ts        # Preload script
├── ui/                    # React UI
│   └── src/
│       ├── components/    # React components
│       ├── contexts/     # React contexts
│       ├── services/     # Services
│       └── hooks/        # Custom hooks
└── dist/                  # Build output
```

### ⚠️ ActionScript Blueprint

The `actionscript-blueprint/` folder contains the original ActionScript source code from the Adobe AIR version. **This folder serves as a reference blueprint** for the TypeScript conversion and should be used when:

- Implementing new features or fixing bugs
- Understanding the original architecture
- Ensuring feature parity

**See [`actionscript-blueprint/README.md`](./actionscript-blueprint/README.md) for more details.**

## 🎯 Features

### ✅ Completed

- **Complete Backend System**
  - File operations (create, load, merge, compile, unload)
  - Thing operations (new, update, import, export, replace, duplicate, remove, find, optimize, convert)
  - Sprite operations (new, add, import, export, replace, remove, find, optimize)
  - Image encoding (PNG, JPEG, BMP, GIF)
  - File saving with progress tracking

- **Storage & Data Management**
  - Version storage (XML-based)
  - Sprite dimension storage
  - Thing type storage (with metadata readers/writers for all client versions)
  - Sprite storage (with compression support)
  - Settings persistence

- **File Format Support**
  - `.dat` files (metadata) - All client versions (1-6)
  - `.spr` files (sprites) - All client versions
  - `.obd` files (Object Builder Data) - With LZMA compression
  - `.otfi` files (Object Builder File Info) - JSON/OTML format

- **Utilities**
  - Client merger
  - Sprite optimizer
  - Frame durations optimizer
  - Frame groups converter
  - Sprite finder

### 🚧 In Progress

- **UI Enhancements** - Enhanced sprite rendering, animation support
- **Additional Dialogs** - Find, Import/Export dialogs
- **Testing** - Comprehensive test suite

### ✅ Completed

- **Backend System** - 100% complete
- **UI Framework** - React 18 with Electron
- **Core Components** - Main window, panels, editor, dialogs
- **Electron Integration** - Menu, file dialogs, window management

## 💻 CLI Interface

The CLI provides an interactive interface for testing backend functionality:

```bash
npm run cli
```

### Available Commands

- `status` - Show application status
- `create <dat> <spr>` - Create new project files
- `load <dat> <spr>` - Load existing project files
- `compile` - Compile current project
- `unload` - Unload current project
- `getthing <id> <cat>` - Get thing by ID and category
- `listthings <cat>` - List things in category (item/outfit/effect/missile)
- `help` - Show help message
- `exit` - Exit the CLI

### Example Usage

```bash
OB> status
OB> load C:\path\to\Tibia.dat C:\path\to\Tibia.spr
OB> listthings item
OB> getthing 100 item
OB> compile
OB> exit
```

## 🏗️ Architecture

### Command Pattern

The application uses a command pattern for worker communication:

```
UI/CLI → WorkerCommand → WorkerCommunicator → ObjectBuilderWorker → Storage/Operations
```

### Worker System

- **ObjectBuilderWorker**: Main background processing class
- **WorkerCommunicator**: Handles command routing and communication
- **WorkerCommand**: Base class for all commands

### Storage System

- **ThingTypeStorage**: Manages thing types (items, outfits, effects, missiles)
- **SpriteStorage**: Manages sprite data
- **VersionStorage**: Manages client version information
- **SpriteDimensionStorage**: Manages sprite dimension configurations

### File Format Support

#### Metadata Files (.dat)
- Supports client versions 1-6
- Version-specific metadata readers/writers
- Extended attributes support
- Transparency support
- Improved animations support
- Frame groups support

#### Sprite Files (.spr)
- All client versions supported
- Compression support
- Sprite indexing and management

#### OBD Files (.obd)
- LZMA compression
- Version 1-3 support
- Complete thing data serialization

## ⚙️ Configuration

### Settings

Settings are stored in OS-specific directories:
- **Windows**: `C:\Users\<username>\.objectbuilder\settings\`
- **Linux/Mac**: `~/.objectbuilder/settings/`

Settings file: `ObjectBuilderSettings.otcfg` (JSON format)

### Default Settings

- Objects list amount: 100
- Sprites list amount: 100
- Language: en_US
- Default frame durations: 100ms for all categories

## 🔧 Development

### Building

```bash
# Compile TypeScript
npm run build

# Watch mode
npm run dev
```

### Code Structure

- **TypeScript strict mode** enabled
- **EventEmitter** for event handling
- **Node.js fs** for file operations
- **sharp/canvas** for image processing
- **xml2js** for XML parsing
- **lzma-native** for compression

### Adding New Features

1. Create command class in `src/ob/commands/`
2. Register callback in `ObjectBuilderWorker.register()`
3. Implement callback method in `ObjectBuilderWorker`
4. Add CLI command if needed in `src/cli.ts`

## 📚 API Documentation

### ObjectBuilderWorker

Main worker class that handles all background processing.

**Key Methods:**
- `createNewFilesCallback()` - Create new project files
- `loadFilesCallback()` - Load existing files
- `compileAsCallback()` - Compile project
- `newThingCallback()` - Create new thing
- `updateThingCallback()` - Update existing thing
- `importThingsCallback()` - Import things
- `exportThingCallback()` - Export thing
- `optimizeSpritesCommand()` - Optimize sprites

### Storage Classes

**ThingTypeStorage**
- `load(filePath)` - Load from .dat file
- `compile(filePath)` - Compile to .dat file
- `getThingType(id, category)` - Get thing by ID
- `addThing(thing)` - Add new thing
- `replaceThing(thing)` - Replace existing thing

**SpriteStorage**
- `load(filePath)` - Load from .spr file
- `compile(filePath)` - Compile to .spr file
- `getSprite(id)` - Get sprite by ID
- `addSprite(pixels)` - Add new sprite
- `replaceSprite(id, pixels)` - Replace sprite

## 🧪 Testing

### Manual Testing

Use the CLI interface to test functionality:

```bash
npm run cli
```

### Automated Testing

(To be implemented)

## 🐛 Troubleshooting

### Common Issues

**Settings not loading:**
- Check that `~/.objectbuilder/settings/` directory exists
- Verify file permissions

**File operations failing:**
- Check file paths are correct
- Verify file permissions
- Ensure files are not locked by another process

**Worker not responding:**
- Check console for error messages
- Verify all dependencies are installed
- Check that TypeScript compiled successfully

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Credits

Original ActionScript/AIR version by https://github.com/Mignari.
TypeScript conversion by ChatGPT and Siz.

## 🔗 Links

- [Original Repository](https://github.com/ottools/ObjectBuilder)
- **[📚 Documentation](./docs/README.md)** - **⚠️ READ ALL DOCS BEFORE WORKING** - Complete documentation guide
- [Documentation Index](./docs/DOCUMENTATION.md) - All documentation files
- [Development Guide](./docs/DEVELOPMENT.md) - Development setup
- [Architecture](./docs/ARCHITECTURE.md) - System architecture
- [Current Status](./docs/CURRENT_STATUS.md) - Detailed status
- [Project Status](./docs/PROJECT_STATUS.md) - Overall progress

## 🚧 Roadmap

- [x] Backend conversion (100% complete)
- [x] React UI framework integration
- [x] Electron desktop app
- [x] Core UI components
- [x] Dialog system
- [ ] Enhanced sprite rendering
- [ ] Animation support
- [ ] Comprehensive test suite
- [ ] Performance optimization
- [ ] Additional utility dialogs