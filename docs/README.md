# Documentation

## ⚠️ IMPORTANT: Read All Documentation Before Working

**All developers and AI agents MUST read all documentation files in this folder before making any changes to the codebase.**

This documentation provides essential context about:
- Project architecture and design patterns
- Current implementation status
- Conversion patterns from ActionScript to TypeScript
- UI component structure and usage
- Development setup and build process
- Known issues and missing features

## 📚 Required Reading Order

Before starting any work, read these documents in order:

### 1. Start Here
- **[README.md](../README.md)** - Main project overview, quick start, features (in project root)
- **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Complete documentation index

### 2. Architecture & Design
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture, component overview, data flow
- **[CONVERSION_GUIDE.md](./CONVERSION_GUIDE.md)** - Conversion patterns from ActionScript to TypeScript

### 3. Current Status
- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Overall project status and progress (most up-to-date)
- **[CURRENT_STATUS.md](./CURRENT_STATUS.md)** - Detailed conversion status and completed features
- **[MISSING_FEATURES.md](./MISSING_FEATURES.md)** - Known missing features and TODO items

### 4. Development Setup
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development setup, build instructions, architecture overview
- **[UI_SETUP.md](./UI_SETUP.md)** - React UI framework setup guide
- **[ELECTRON_SETUP.md](./ELECTRON_SETUP.md)** - Electron integration guide
- **[ELECTRON_FIXES.md](./ELECTRON_FIXES.md)** - Known Electron issues and fixes
- **[CANVAS_WINDOWS_SETUP.md](./CANVAS_WINDOWS_SETUP.md)** - Canvas module setup for Windows

### 5. UI Components
- **[UI_COMPONENTS.md](./UI_COMPONENTS.md)** - React component documentation
- **[UI_PROGRESS.md](./UI_PROGRESS.md)** - UI implementation progress

### 6. History
- **[CHANGELOG.md](./CHANGELOG.md)** - Changelog of features and changes

## 🎯 Quick Reference

### For New Developers/Agents
1. **Start**: Read [README.md](../README.md) and [DOCUMENTATION.md](./DOCUMENTATION.md)
2. **Understand**: Read [ARCHITECTURE.md](./ARCHITECTURE.md) and [CONVERSION_GUIDE.md](./CONVERSION_GUIDE.md)
3. **Check Status**: Read [PROJECT_STATUS.md](./PROJECT_STATUS.md) and [CURRENT_STATUS.md](./CURRENT_STATUS.md)
4. **Setup**: Follow [DEVELOPMENT.md](./DEVELOPMENT.md) for setup instructions
5. **Work**: Reference [UI_COMPONENTS.md](./UI_COMPONENTS.md) when working on UI

### For Understanding the Codebase
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Conversion Patterns**: [CONVERSION_GUIDE.md](./CONVERSION_GUIDE.md)
- **ActionScript Reference**: See [../actionscript-blueprint/README.md](../actionscript-blueprint/README.md)

### For Development
- **Setup**: [DEVELOPMENT.md](./DEVELOPMENT.md)
- **UI Development**: [UI_SETUP.md](./UI_SETUP.md), [UI_COMPONENTS.md](./UI_COMPONENTS.md)
- **Electron**: [ELECTRON_SETUP.md](./ELECTRON_SETUP.md), [ELECTRON_FIXES.md](./ELECTRON_FIXES.md)
- **Windows Canvas**: [CANVAS_WINDOWS_SETUP.md](./CANVAS_WINDOWS_SETUP.md)

## 📋 Documentation Files

| File | Purpose | Priority |
|------|---------|----------|
| README.md (root) | Main project documentation | ⭐⭐⭐ |
| DOCUMENTATION.md | Documentation index | ⭐⭐⭐ |
| ARCHITECTURE.md | System architecture | ⭐⭐⭐ |
| PROJECT_STATUS.md | Current project status | ⭐⭐⭐ |
| CURRENT_STATUS.md | Detailed status | ⭐⭐⭐ |
| CONVERSION_GUIDE.md | ActionScript → TypeScript patterns | ⭐⭐ |
| DEVELOPMENT.md | Development setup | ⭐⭐⭐ |
| UI_SETUP.md | UI framework setup | ⭐⭐ |
| UI_COMPONENTS.md | Component documentation | ⭐⭐ |
| ELECTRON_SETUP.md | Electron integration | ⭐⭐ |
| ELECTRON_FIXES.md | Known issues | ⭐ |
| CANVAS_WINDOWS_SETUP.md | Canvas setup | ⭐ |
| MISSING_FEATURES.md | TODO items | ⭐⭐ |
| UI_PROGRESS.md | UI progress tracking | ⭐ |
| CHANGELOG.md | Change history | ⭐ |

## 🔍 Key Information

### Project Status
- **Overall Progress**: ~95% Complete
- **Backend**: 100% ✅
- **UI**: 99.8% ✅
- **Remaining**: Animation support, testing, optimization

### Technology Stack
- **Backend**: TypeScript, Node.js
- **UI**: React 18, TypeScript
- **Desktop**: Electron 27
- **Build**: Vite, TypeScript Compiler
- **Image**: Sharp, Canvas
- **Compression**: lzma-native
- **XML**: xml2js

### Important Notes
- **ActionScript Blueprint**: All original ActionScript code is in `../actionscript-blueprint/` - use as reference
- **TypeScript Strict Mode**: Enabled - all code must be properly typed
- **Build Commands**: See [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Settings**: Stored in OS-specific directories (`~/.objectbuilder/settings/`)

## 🚨 Before Making Changes

1. ✅ Read all documentation files listed above
2. ✅ Understand the architecture (see [ARCHITECTURE.md](./ARCHITECTURE.md))
3. ✅ Check current status (see [PROJECT_STATUS.md](./PROJECT_STATUS.md))
4. ✅ Review conversion patterns if converting ActionScript (see [CONVERSION_GUIDE.md](./CONVERSION_GUIDE.md))
5. ✅ Check for existing implementations before creating new ones
6. ✅ Reference ActionScript blueprint if needed (see `../actionscript-blueprint/`)

## 📝 Updating Documentation

When making significant changes:
- Update [PROJECT_STATUS.md](./PROJECT_STATUS.md) for major milestones
- Update [CURRENT_STATUS.md](./CURRENT_STATUS.md) for detailed progress
- Update [CHANGELOG.md](./CHANGELOG.md) for new features
- Update component docs when components change
- Update this README if documentation structure changes

---

**Remember**: This project is a TypeScript conversion of an Adobe AIR/Flash application. Always reference the ActionScript blueprint in `../actionscript-blueprint/` when implementing features to ensure correctness and feature parity.

