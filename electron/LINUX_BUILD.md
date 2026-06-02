# Building Electron for Ubuntu/Linux

## 🐧 Linux Build Support

Your Electron app now supports Ubuntu and other Linux distributions!

## 📦 Build Targets

The Linux build creates:
1. **AppImage** - Universal Linux app (works on most distros)
2. **DEB** - Debian/Ubuntu package installer

## 🚀 How to Build

### On Ubuntu/Linux:

```bash
# Build for Linux only
cd electron
npm run build:linux
```

Output will be in `electron/dist/`:
- `RV2Class-X.X.X.AppImage` - Portable AppImage
- `rv2class_X.X.X_amd64.deb` - Ubuntu/Debian installer

### Build for Both Windows and Linux:

```bash
cd electron
npm run build:all
```

This creates installers for both platforms (requires both environments or Docker).

## 💻 Installing on Ubuntu

### Method 1: AppImage (Recommended - Most Universal)

```bash
# Make it executable
chmod +x RV2Class-X.X.X.AppImage

# Run it
./RV2Class-X.X.X.AppImage
```

**No installation needed!** AppImage is portable and works on most Linux distros.

### Method 2: DEB Package (Ubuntu/Debian)

```bash
# Install the package
sudo dpkg -i rv2class_X.X.X_amd64.deb

# If there are dependency issues, fix them
sudo apt-get install -f

# Run from applications menu or terminal
rv2class
```

## 🎯 System Audio on Linux

**Great news!** Electron on Linux also supports system audio capture through:
- PulseAudio
- PipeWire (modern Ubuntu versions)

The same `desktopCapturer` API works on Linux just like Windows!

### Requirements:
```bash
# Make sure PulseAudio or PipeWire is running
pulseaudio --check || pipewire --version
```

## 🔧 Development on Ubuntu

Same as Windows:

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start Electron
cd electron
npm install
npm start
```

## 🏗️ Cross-Platform Building

### Build Linux on Windows (using Docker):

```bash
# Install Docker Desktop for Windows
# Then run:
docker run --rm -ti \
  --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS_TAG|TRAVIS|TRAVIS_REPO_|TRAVIS_BUILD_|TRAVIS_BRANCH|TRAVIS_PULL_REQUEST_|APPVEYOR_|CSC_|GH_|GITHUB_|BT_|AWS_|STRIP|BUILD_') \
  --env ELECTRON_CACHE="/root/.cache/electron" \
  --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
  -v ${PWD}:/project \
  -v ~/.cache/electron:/root/.cache/electron \
  -v ~/.cache/electron-builder:/root/.cache/electron-builder \
  electronuserland/builder:wine \
  /bin/bash -c "cd electron && npm install && npm run build:linux"
```

### Build Windows on Ubuntu:

```bash
# Install Wine
sudo dpkg --add-architecture i386
sudo apt update
sudo apt install wine64 wine32

# Build
cd electron
npm run build
```

## 📋 Build Scripts Reference

```json
"build"         → Windows x64 installer
"build:linux"   → Linux AppImage + DEB
"build:all"     → Both Windows and Linux
"build:dir"     → Unpacked directory (testing)
"start"         → Development mode
```

## 🎨 Linux-Specific Configuration

The `package.json` already includes:

```json
"linux": {
  "target": ["AppImage", "deb"],
  "icon": "../public/icon-512.svg",
  "category": "Education"
}
```

### Supported Targets:
- `AppImage` - Universal
- `deb` - Debian/Ubuntu
- `rpm` - Fedora/RedHat/CentOS
- `snap` - Snaps
- `tar.gz` - Tarball

## 🐛 Troubleshooting Linux

### "Permission denied" when running AppImage
```bash
chmod +x RV2Class-X.X.X.AppImage
```

### "Missing libraries" on older Ubuntu
AppImage should work, but if not:
```bash
sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils libatspi2.0-0 libdrm2 libgbm1 libxcb-dri3-0
```

### Screen sharing not working
Make sure you have pipewire or pulseaudio:
```bash
# For PipeWire (Ubuntu 22.04+)
sudo apt install pipewire pipewire-pulse

# For PulseAudio (older versions)
sudo apt install pulseaudio
```

### Audio capture not working
Check permissions:
```bash
# Add user to audio group
sudo usermod -a -G audio $USER

# Restart session after this
```

## 🎯 Platform Differences

| Feature | Windows | Linux | Status |
|---------|---------|-------|--------|
| Screen Share | ✅ | ✅ | Works |
| System Audio | ✅ | ✅ | Works |
| Window Capture | ✅ | ✅ | Works |
| Auto-update | ✅ | ✅* | *AppImage supports |
| Native Look | ✅ | ✅ | GTK theme |

## 📦 Distribution

### AppImage:
- **Best for**: Most users, universal compatibility
- **Size**: ~150-200MB (includes everything)
- **Installation**: None needed, just run

### DEB:
- **Best for**: Ubuntu/Debian official package
- **Size**: ~150MB
- **Installation**: System package manager

## 🔐 Security

Same security model on Linux:
- Sandboxed renderer process
- Context isolation enabled
- No node integration in renderer
- Secure IPC communication

## 🌐 Testing

Test on different Ubuntu versions:
- Ubuntu 20.04 LTS
- Ubuntu 22.04 LTS (recommended)
- Ubuntu 24.04 LTS

AppImage should work on all of them!

---

**Your app now supports both Windows and Linux with full system audio capture! 🎉**
