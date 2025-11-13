# Missing Features from ActionScript ObjectBuilder

This document lists all features from the original ActionScript/Adobe AIR version that are not yet implemented in the TypeScript/React/Electron version.

## Status Legend
- ❌ **Not Implemented** - Feature doesn't exist
- 🟡 **Partially Implemented** - Basic version exists but missing advanced features
- ✅ **Implemented** - Feature is complete

---

## 🎨 Windows & Dialogs

### Core Windows
- ❌ **Animation Editor** (`AnimationEditor`) - Advanced animation frame editing tool
- ❌ **Object Viewer** (`ObjectViewer`) - Standalone window to view .obd files
- ❌ **Slicer** (`Slicer`) - Tool to slice sprite sheets into individual sprites
- ❌ **Asset Store** (`AssetStore`) - Browse and import assets from online store
- ❌ **Look Generator** (`LookGenerator`) - Generate character looks/outfits
- ❌ **Client Versions Window** (`ClientVersionsWindow`) - Manage client version definitions
- ❌ **Import Thing Window** (`ImportThingWindow`) - Advanced import dialog with preview
- ❌ **Files Info Panel** (`FilesInfoPanel`) - Display file information and statistics

### Optimizer Windows
- ❌ **Sprites Optimizer Window** (`SpritesOptimizerWindow`) - Optimize sprite storage
- ❌ **Frame Durations Optimizer Window** (`FrameDurationsOptimizerWindow`) - Optimize animation frame durations
- ❌ **Frame Groups Converter Window** (`FrameGroupsConverterWindow`) - Convert between frame group formats

### Advanced Dialogs
- 🟡 **Export Window** (`ExportWindow`) - More advanced export options (partially implemented)
- 🟡 **Preferences Window** - Missing hotkey editor section
- ✅ **About Dialog** - Implemented
- ✅ **Find Dialog** - Implemented
- ✅ **Load Files Dialog** - Implemented (with versions list)
- ✅ **New Project Dialog** - Implemented
- ✅ **Compile Options Dialog** - Implemented
- ✅ **Import/Export Dialogs** - Basic implementation done

---

## ⌨️ Hotkey System

- ❌ **Hotkey Manager** - Global keyboard shortcut system
- ❌ **Hotkey Registration** - Register actions with default shortcuts
- ❌ **Hotkey Editor** - UI to customize keyboard shortcuts
- ❌ **Hotkey Persistence** - Save/load hotkey configurations
- ❌ **Hotkey Tooltips** - Show shortcuts in tooltips
- ❌ **Hotkey Actions** - All action definitions (FILE_NEW, FILE_OPEN, etc.)

**Missing Hotkey Actions:**
- File operations (New, Open, Save, Compile, etc.)
- Edit operations (Undo, Redo, Cut, Copy, Paste)
- View operations (Toggle panels, Zoom, etc.)
- Thing operations (New, Duplicate, Remove, etc.)
- Sprite operations (New, Import, Export, etc.)
- Tools (Find, Animation Editor, Object Viewer, etc.)

---

## 🎯 Advanced Features

### Preview & Rendering
- 🟡 **Preview Canvas** - Basic implementation, missing:
  - ❌ Animation playback controls
  - ❌ Frame-by-frame navigation
  - ❌ Zoom controls
  - ❌ Background color picker
  - ❌ Grid overlay
  - ❌ Sprite offset visualization
- ❌ **Preview Navigator** (`PreviewNavigator`) - Advanced preview controls
- ❌ **Multi-sprite composition** - Better handling of complex sprites
- ❌ **Animation preview** - Play animations in preview

### Thing Editor
- 🟡 **ThingEditor** - Basic properties implemented, missing:
  - ❌ Advanced property groups (all categories)
  - ❌ Property validation
  - ❌ Property tooltips/help
  - ❌ Color pickers for light properties
  - ❌ Numeric steppers with proper limits
  - ❌ Frame group editor
  - ❌ Animation frame editor
  - ❌ Sprite dimension selector
  - ❌ Real-time preview updates
- ❌ **ThingTypeEditor** (`ThingTypeEditor`) - Advanced thing editing component

### Sprite Management
- ❌ **Sprite dimension management** - Set sprite dimensions
- ❌ **Sprite dimension storage** - Load/save sprite dimensions
- ❌ **Sprite extent configuration** - Configure default sprite sizes
- ❌ **Sprite list advanced features**:
  - ❌ Drag and drop reordering
  - ❌ Multi-select operations
  - ❌ Context menu
  - ❌ Sprite properties editor

### Thing List
- 🟡 **ThingList** - Basic list, missing:
  - ❌ Virtual scrolling for large lists
  - ❌ Advanced filtering
  - ❌ Sorting options
  - ❌ Group by category
  - ❌ Search within list
  - ❌ Context menu
  - ❌ Multi-select

---

## 🔧 Tools & Utilities

### File Operations
- ❌ **Unload Project** - Confirmation dialog before unloading
- ❌ **Compile As** - Save project with different name/location
- ❌ **Auto-save thing changes** - Automatically save on compile
- ❌ **Recent files list** - Show recently opened projects
- ❌ **File change detection** - Warn if files changed externally

### Import/Export
- ❌ **Batch import** - Import multiple files at once
- ❌ **Import from clipboard** - Paste sprites/images
- ❌ **Export formats** - More export format options
- ❌ **Export templates** - Save export configurations
- ❌ **Sprite sheet export** - Export as sprite sheets

### Optimization
- ❌ **Sprite optimization** - Remove duplicate sprites
- ❌ **Frame duration optimization** - Auto-optimize animation timings
- ❌ **Frame group conversion** - Convert between formats
- ❌ **Thing optimization** - Remove unused things

---

## 🎨 UI Components & Controls

### Custom Controls
- ❌ **HSI Color Picker** (`HSIColorPicker`) - Hue/Saturation/Intensity color picker
- ❌ **Eight Bit Color Picker** (`EightBitColorPicker`) - 8-bit color palette picker
- ❌ **Direction Button** (`DirectionButton`) - Direction selector
- ❌ **Amount Numeric Stepper** (`AmountNumericStepper`) - Numeric input with stepper
- ❌ **Pattern Slider** (`PatternSlider`) - Custom slider with pattern
- ❌ **File Text Input** (`FileTextInput`) - File path input with browse button
- ❌ **Play Button** (`PlayButton`) - Animation play/pause control
- ❌ **Checker Board** (`CheckerBoard`) - Checkerboard background pattern
- ❌ **Ruler** (`Ruler`) - Measurement ruler component
- ❌ **Surface Cells** (`SurfaceCells`) - Grid surface component

### Advanced Components
- ❌ **Thing List Renderer** - Custom renderer for thing list items
- ❌ **Sprite List Renderer** - Custom renderer for sprite list items
- ❌ **Bitmap List Renderer** - Renderer for bitmap lists
- ❌ **Signature Item Renderer** - Renderer for version signatures

### Skins & Styling
- ❌ **Custom component skins** - All MXML skin files
- ❌ **Theme support** - Light/dark themes
- ❌ **Custom scrollbars** - Styled scrollbars
- ❌ **Custom buttons** - Styled button components

---

## 📊 Data & State Management

### Settings
- 🟡 **Settings Management** - Basic settings, missing:
  - ❌ Hotkey configuration
  - ❌ Window state (size, position, panel visibility)
  - ❌ Recent files list
  - ❌ Export templates
  - ❌ UI preferences (theme, font size, etc.)
  - ❌ Advanced file operation settings

### State Persistence
- ❌ **Window state persistence** - Save window size/position (partially done)
- ❌ **Panel visibility state** - Remember panel states
- ❌ **Category selection** - Remember last selected category
- ❌ **Thing selection** - Remember selected things
- ❌ **View preferences** - Zoom level, grid visibility, etc.

---

## 🔍 Search & Navigation

- 🟡 **Find Dialog** - Basic search, missing:
  - ❌ Advanced search filters
  - ❌ Search history
  - ❌ Search within specific categories
  - ❌ Property-based search
  - ❌ Search result highlighting
  - ❌ Batch operations on results

---

## 🎬 Animation Features

- ❌ **Animation Editor** - Full animation editing tool
- ❌ **Frame duration editor** - Edit individual frame durations
- ❌ **Frame group editor** - Edit frame groups
- ❌ **Animation preview** - Play animations in editor
- ❌ **Animation export** - Export animations
- ❌ **Animation import** - Import animation data

---

## 📦 Asset Management

- ❌ **Asset Store** - Browse and download assets
- ❌ **Asset import** - Import from asset store
- ❌ **Asset library** - Local asset library
- ❌ **Asset preview** - Preview assets before import
- ❌ **Asset metadata** - Store asset information

---

## 🖼️ Image & Sprite Tools

- ❌ **Slicer** - Slice sprite sheets
- ❌ **Sprite sheet generator** - Create sprite sheets
- ❌ **Image format conversion** - Convert between formats
- ❌ **Image optimization** - Optimize image files
- ❌ **Transparency tools** - Advanced transparency handling
- ❌ **Color replacement** - Replace colors in sprites

---

## 🔔 User Experience

### Notifications & Feedback
- 🟡 **Progress Indicators** - Basic progress, missing:
  - ❌ Detailed progress messages
  - ❌ Cancellable operations
  - ❌ Progress for multiple operations
- 🟡 **Error Handling** - Basic errors, missing:
  - ❌ Error window with details
  - ❌ Error recovery options
  - ❌ Error logging
- ✅ **Toast Notifications** - Implemented

### Accessibility
- ❌ **Keyboard navigation** - Full keyboard support
- ❌ **Screen reader support** - ARIA labels
- ❌ **High contrast mode** - Accessibility themes
- ❌ **Font scaling** - Adjustable font sizes

### Internationalization
- 🟡 **Localization** - Basic strings, missing:
  - ❌ Complete string translations
  - ❌ RTL language support
  - ❌ Date/time formatting
  - ❌ Number formatting

---

## 🚀 Performance & Optimization

- ❌ **Virtual scrolling** - For large lists
- ❌ **Lazy loading** - Load data on demand
- ❌ **Image caching** - Cache rendered images
- ❌ **Debounced updates** - Debounce rapid changes
- ❌ **Background processing** - Better worker utilization
- ❌ **Memory management** - Optimize memory usage

---

## 🧪 Testing & Quality

- ❌ **Unit tests** - Test coverage
- ❌ **Integration tests** - End-to-end tests
- ❌ **Performance tests** - Benchmark operations
- ❌ **Error boundary** - React error boundaries
- ❌ **Logging system** - Comprehensive logging

---

## 📝 Documentation

- 🟡 **User documentation** - Basic docs, missing:
  - ❌ Complete user guide
  - ❌ Tutorial videos
  - ❌ API documentation
  - ❌ Developer guide
  - ❌ Migration guide from ActionScript version

---

## 🔐 Security & Updates

- ❌ **Auto-updater** - Application update system
- ❌ **Update notifications** - Notify about updates
- ❌ **Security scanning** - Scan imported files
- ❌ **File validation** - Validate file formats
- ❌ **Backup system** - Auto-backup projects

---

## 📈 Statistics & Analytics

- ❌ **File statistics** - Show file information
- ❌ **Thing statistics** - Count things by category
- ❌ **Sprite statistics** - Sprite count and sizes
- ❌ **Project statistics** - Overall project stats
- ❌ **Usage analytics** - Track feature usage (optional)

---

## 🎯 Priority Features to Implement

### High Priority
1. **Hotkey System** - Essential for power users
2. **Animation Editor** - Core feature for animation work
3. **Object Viewer** - Useful standalone tool
4. **Sprites Optimizer** - Performance improvement tool
5. **Unload Project Confirmation** - Prevent data loss
6. **Compile As** - Essential file operation
7. **Auto-save thing changes** - Prevent data loss

### Medium Priority
8. **Slicer** - Useful sprite tool
9. **Look Generator** - Character creation tool
10. **Frame Durations Optimizer** - Animation optimization
11. **Frame Groups Converter** - Format conversion
12. **Asset Store** - Asset management
13. **Advanced Preview** - Better preview features
14. **ThingTypeEditor** - Advanced editing

### Low Priority
15. **Custom Controls** - UI polish
16. **Themes** - Visual customization
17. **Virtual Scrolling** - Performance for large lists
18. **Advanced Search** - Enhanced search features
19. **Statistics Panels** - Information display

---

## 📊 Implementation Progress

**Overall Completion: ~75%**

- **Backend**: 100% ✅
- **Core UI**: 90% ✅
- **Dialogs**: 60% 🟡
- **Tools**: 20% ❌
- **Hotkeys**: 0% ❌
- **Advanced Features**: 30% 🟡

---

*Last Updated: Current Session*
*Total Missing Features: ~100+ individual features/components*

