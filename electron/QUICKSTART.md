# Electron App - Quick Start Guide

## 🚀 How to Run in Development

### Step 1: Start Next.js (from main project directory)
```bash
npm run dev
```
Wait for it to say "Ready on http://localhost:3000"

### Step 2: Start Electron (from electron directory)
```bash
cd electron
npm install
npm start
```

## 📦 How to Build for Windows & Linux

### Step 1: Configure Next.js for Static Export

Add to your main `next.config.js`:
```javascript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  reactStrictMode: true,
}
```

Add to main `package.json` scripts:
```json
"export": "next export"
```

### Step 2: Build Next.js
```bash
npm run build
```

### Step 3: Build Electron

**For Windows:**
```bash
cd electron
npm run build
```

**For Linux/Ubuntu:**
```bash
cd electron
npm run build:linux
```

**For Both:**
```bash
cd electron
npm run build:all
```

The installers will be in `electron/dist/`:
- Windows: `RV2Class Setup X.X.X.exe`
- Linux: `RV2Class-X.X.X.AppImage` and `rv2class_X.X.X_amd64.deb`

## 🎯 Key Feature: System Audio Capture

### The Problem with Browsers
- Chrome/Firefox can only capture audio from **browser tabs**
- Window sharing has no audio capture

### The Solution with Electron
- Captures audio from **ANY window or screen**
- True system audio capture
- No browser limitations

### How to Use in Your Code

Detect Electron and use enhanced screen sharing:

```typescript
if (window.electronAPI?.isElectron) {
  // Electron: Get stream with SYSTEM AUDIO
  const stream = await ElectronScreenShare.showPicker(true);
} else {
  // Browser: Standard getDisplayMedia
  const stream = await navigator.mediaDevices.getDisplayMedia({...});
}
```

## 📁 What Was Created

```
electron/
├── main.js                    # Electron main process
├── preload.js                 # IPC bridge
├── electron-screen-share.ts   # Screen share helper
├── package.json              # Electron config
├── README.md                 # Full documentation
└── QUICKSTART.md            # This file
```

## ⚠️ Important Notes

1. **Your webapp is NOT modified** - it still works as-is
2. Electron runs alongside your webapp
3. Same Firebase, same LiveKit, same everything
4. Just with desktop superpowers!

## 🔧 Troubleshooting

**"Can't find module 'electron'"**
→ Run `npm install` in the `electron/` directory

**"localhost:3000 not loading"**
→ Make sure Next.js dev server is running first

**"No audio in screen share"**
→ Select "Entire Screen" instead of individual window
→ Check Windows sound mixer permissions
