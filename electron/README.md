# RV2Class - Electron Desktop App

This is the Electron desktop version of RV2Class that runs alongside the web version without modifying it.

## 🎯 Key Advantages Over Web Version

1. **System Audio Capture**: Capture audio from ANY window or screen share (not just browser tabs)
2. **Better Performance**: Native desktop performance
3. **No Browser Limitations**: Full access to system APIs
4. **Professional Deployment**: Installable desktop application

## 📋 Prerequisites

1. Your Next.js webapp must be built first
2. Node.js 18+ installed
3. Windows for building Windows executables

## 🚀 Quick Start

### Development Mode

1. **Start your Next.js dev server** (in the main project directory):
```bash
npm run dev
```

2. **In a new terminal, start Electron** (from the electron directory):
```bash
cd electron
npm install
npm start
```

The Electron app will load your Next.js app from `http://localhost:3000`.

### Production Build

1. **Build your Next.js app** (from main directory):
```bash
npm run build
npm run export  # If you need static export
```

Note: You may need to add this to your main `package.json`:
```json
"scripts": {
  "export": "next export"
}
```

And update `next.config.js`:
```javascript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  }
}
```

2. **Build Electron app for Windows**:
```bash
cd electron
npm run build
```

The installer will be in `electron/dist/`.

### Build for Linux/Ubuntu

```bash
cd electron
npm run build:linux
```

Creates:
- `RV2Class-X.X.X.AppImage` - Universal Linux app
- `rv2class_X.X.X_amd64.deb` - Ubuntu/Debian installer

See `LINUX_BUILD.md` for detailed Linux instructions.

### Build for Both Platforms

```bash
cd electron
npm run build:all
```

## 🖥️ System Audio Capture

### How It Works

The Electron version uses `desktopCapturer` API which can capture:
- ✅ System audio from any window
- ✅ System audio from screen shares
- ✅ High-quality video at any resolution

### Implementation

In your components (like `CustomControlBar.tsx`), detect if running in Electron:

```typescript
import { ElectronScreenShare } from '../../electron/electron-screen-share';

// In your screen share handler
async function startScreenShare() {
  if (window.electronAPI?.isElectron) {
    // Use Electron's enhanced screen sharing with audio
    const stream = await ElectronScreenShare.showPicker(true); // true = include audio
    
    if (stream) {
      // Your LiveKit screen share logic
      await room.localParticipant.publishTrack(stream.getVideoTracks()[0]);
      
      // Publish audio track if available (SYSTEM AUDIO!)
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        await room.localParticipant.publishTrack(audioTrack);
      }
    }
  } else {
    // Fall back to browser screen share (web version)
    // Your existing getDisplayMedia() code
  }
}
```

## 📦 Build Configuration

The `electron/package.json` includes:
- **electron**: Desktop framework
- **electron-builder**: Package for Windows/Mac/Linux
- **electron-is-dev**: Detect dev vs production

Build targets configured in `package.json`:
- Windows NSIS installer
- Portable executable
- Auto-updater ready

## 🔧 File Structure

```
electron/
├── main.js              # Main Electron process
├── preload.js           # Secure IPC bridge
├── electron-screen-share.ts  # Helper for screen sharing
├── package.json         # Electron dependencies
└── README.md           # This file
```

## 🎨 Customization

### Window Settings

Edit `electron/main.js`:
```javascript
width: 1400,      // Default window width
height: 900,      // Default window height
minWidth: 1024,   // Minimum width
minHeight: 768,   // Minimum height
```

### App Icon

Replace icons in `public/` directory:
- `icon-512.svg` or create `icon-512.png`
- `icon-192.png` for smaller sizes

### App Name & ID

Edit `electron/package.json`:
```json
"build": {
  "appId": "com.yourcompany.rv2class",
  "productName": "Your App Name"
}
```

## 🐛 Troubleshooting

### Audio Not Capturing

1. Make sure `includeAudio: true` is set
2. Check Windows sound settings (some apps block audio capture)
3. Try selecting "Entire Screen" instead of specific window

### Build Fails

1. Ensure Next.js is built first: `npm run build`
2. Check that `out/` directory exists
3. Verify all paths in `electron/package.json` build config

### Dev Mode: Blank Window

1. Ensure Next.js dev server is running on `http://localhost:3000`
2. Check console for CORS or loading errors
3. Try opening DevTools: View → Toggle Developer Tools

## 📝 Integration Example

To integrate with your existing `CustomControlBar.tsx`:

```typescript
// Add this import at the top
import { ElectronScreenShare } from '../../electron/electron-screen-share';

// In your screen share button handler:
const handleScreenShare = async () => {
  try {
    let stream: MediaStream | null = null;
    
    if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
      // Electron path - with system audio!
      stream = await ElectronScreenShare.showPicker(true);
    } else {
      // Browser path - tab audio only
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
    }
    
    if (stream) {
      // Your LiveKit publishing logic here
      await room.localParticipant.publishTrack(stream.getVideoTracks()[0]);
      
      // Check for audio track (system audio in Electron!)
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        await room.localParticipant.publishTrack(audioTracks[0]);
      }
    }
  } catch (error) {
    console.error('Screen share failed:', error);
  }
};
```

## 🚢 Distribution

### Windows Installer

After running `npm run build`, you'll get:
- `RV2Class Setup X.X.X.exe` - Installer
- Unpacked app in `win-unpacked/` for testing

### Auto-Updates

To enable auto-updates, configure in `package.json`:
```json
"publish": {
  "provider": "github",
  "owner": "your-username",
  "repo": "rv2class"
}
```

## 🔐 Security Notes

- Context isolation is ENABLED
- Node integration is DISABLED
- Only specific APIs exposed via preload script
- Web security is ENABLED

## 📞 Support

The Electron version maintains 100% compatibility with your webapp:
- Same LiveKit integration
- Same Firebase backend
- Same UI/UX
- Just with enhanced desktop capabilities!

---

**Remember**: The warning about "window can have audio" is actually a FEATURE in Electron - it means audio WILL be captured! 🎉
