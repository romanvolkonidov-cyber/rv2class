# 📦 Finding Your Built Electron App

## After Building: Where Are The Files?

When you run:
```bash
cd electron
npm run build
```

## 📁 Output Location

Everything goes to: **`electron/dist/`**

```
electron/dist/
├── RV2Class Setup 1.0.0.exe    ← INSTALLER (copy to USB)
├── RV2Class 1.0.0.exe           ← PORTABLE (copy to USB)
└── win-unpacked/                ← UNPACKED APP
    ├── RV2Class.exe
    └── resources/
```

## 🎯 What to Copy to USB

### Option 1: Installer (Best for end users)
**Copy:** `RV2Class Setup 1.0.0.exe` (one file, ~150-200MB)

On Windows:
1. Double-click installer
2. Follow setup wizard
3. App installs to `C:\Program Files\RV2Class\`

### Option 2: Portable Executable (No Install)
**Copy:** `RV2Class 1.0.0.exe` (one file, ~150-200MB)

On Windows:
1. Just double-click to run
2. No installation needed
3. Runs from anywhere

### Option 3: Unpacked (Developer/Testing)
**Copy:** Entire `win-unpacked/` folder

On Windows:
1. Open the folder
2. Run `RV2Class.exe`
3. All dependencies included

## 🚀 Quick Build Commands

```bash
# Full build (installer + portable)
npm run build

# Just portable exe
npm run build:portable

# Unpacked directory (for testing)
npm run build:dir
```

## 📋 File Sizes

- Installer: ~150-200MB
- Portable: ~150-200MB
- Unpacked: ~400-500MB (folder with everything)

## ✅ Recommended for USB

**Copy to USB:** `RV2Class 1.0.0.exe` (the portable version)

Why?
- ✅ Single file
- ✅ No installation needed
- ✅ Runs directly from USB
- ✅ Easy to share

## 🔍 Troubleshooting

### "I don't see electron/dist/"

The build didn't complete. Check:
1. Did you run `npm install` in electron/ first?
2. Did the build finish without errors?
3. Is Next.js built first? (need `out/` folder)

### "Build failed"

Common issues:
```bash
# Make sure Next.js is built with static export
cd /home/roman/Documents/rv2class
npm run build

# Then build Electron
cd electron
npm install
npm run build
```

### "Missing out/ folder error"

You need to configure Next.js for static export first.

Add to `next.config.js`:
```javascript
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
}
```

## 📂 Directory Structure After Build

```
rv2class/
├── out/                          ← Next.js static export
├── electron/
│   ├── dist/                     ← YOUR BUILT FILES HERE
│   │   ├── RV2Class Setup 1.0.0.exe
│   │   ├── RV2Class 1.0.0.exe   ← COPY THIS TO USB
│   │   └── win-unpacked/
│   ├── main.js
│   └── package.json
└── ... (rest of project)
```

## 🎯 Quick Answer

**What to copy to USB?**

→ `electron/dist/RV2Class 1.0.0.exe`

**How to use on Windows?**

→ Just double-click and run. No install needed! 🚀
