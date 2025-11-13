# Canvas Module Setup for Windows

The `canvas` module requires GTK+ and Cairo libraries to build on Windows. Follow these steps to fix the build error.

## Option 1: Install GTK+ Runtime (Recommended)

### Step 1: Download GTK+ Runtime
1. Download GTK+ 3.x runtime from: https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer/releases
2. Or use MSYS2 (recommended for development)

### Step 2: Install GTK+ via MSYS2 (Best for Development)
1. Download and install MSYS2 from: https://www.msys2.org/
2. Open MSYS2 terminal and run:
   ```bash
   pacman -S mingw-w64-x86_64-gtk3
   pacman -S mingw-w64-x86_64-cairo
   pacman -S mingw-w64-x86_64-pkg-config
   ```

3. Add MSYS2 to your PATH:
   - Add `C:\msys64\mingw64\bin` to your system PATH
   - Add `C:\msys64\usr\bin` to your system PATH

### Step 3: Set Environment Variables
Set these environment variables before running `npm run rebuild`:

```powershell
$env:GTK_BASEPATH = "C:\msys64\mingw64"
$env:PKG_CONFIG_PATH = "C:\msys64\mingw64\lib\pkgconfig"
$env:PATH = "C:\msys64\mingw64\bin;$env:PATH"
```

Or set them permanently:
```powershell
[System.Environment]::SetEnvironmentVariable("GTK_BASEPATH", "C:\msys64\mingw64", "User")
[System.Environment]::SetEnvironmentVariable("PKG_CONFIG_PATH", "C:\msys64\mingw64\lib\pkgconfig", "User")
```

### Step 4: Rebuild Canvas
```powershell
npm run rebuild
```

## Option 2: Use Alternative Canvas Implementation

If you prefer not to install GTK+, you can use `@napi-rs/canvas` which doesn't require native dependencies:

```bash
npm uninstall canvas
npm install @napi-rs/canvas
```

Then update `src/otlib/utils/BitmapData.ts` to use `@napi-rs/canvas` instead.

## Option 3: Make Canvas Optional

The code has been updated to handle canvas gracefully if it fails to load. The application will work but image processing features may be limited.


