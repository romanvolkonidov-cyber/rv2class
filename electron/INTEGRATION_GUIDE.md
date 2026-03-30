# Electron Integration Guide

## ⚠️ Current Status

Your Electron apps are built and ready:
- ✅ Windows: `RV2Class Setup 1.0.0.exe` (loads from https://rv2class.vercel.app) 
- ✅ Ubuntu: `rv2class-electron_1.0.0_amd64.deb` (loads from https://online.rv2class.com)

**However**, they currently don't use Electron's system audio capture!  
They're just wrappers loading your website.

## 🎯 What You Need to Do

To get **REAL system audio** from window sharing, you need to modify your webapp to detect and use Electron APIs.

## Option 1: Simple Detection (Quick Test)

Add this to your `CustomControlBar.tsx` at the top of the `toggleScreenShare` function (around line 400):

```typescript
const toggleScreenShare = async () => {
  if (!localParticipant || !room) return;

  // ADD THIS CHECK
  if (typeof window !== 'undefined' && (window as any).electronAPI?.isElectron) {
    console.log('🎉 Running in Electron! System audio capture available!');
    alert('You are running in Electron Desktop App with system audio support!');
  } else {
    console.log('🌐 Running in browser - limited audio capture');
  }

  // ... rest of your function
}
```

This will show an alert when running in Electron, so you know it's detected.

## Option 2: Full Integration (Get System Audio)

### Step 1: Add Electron Type Declarations

At the top of `components/CustomControlBar.tsx`, after the imports:

```typescript
// Electron API types
declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      getScreenSources: () => Promise<Array<{
        id: string;
        name: string;
        thumbnail: string;
        appIcon: string | null;
      }>>;
      getScreenStream: (sourceId: string, includeAudio: boolean) => Promise<any>;
    };
  }
}
```

### Step 2: Modify Your Screen Share Function

Replace the screen share logic in `toggleScreenShare()` (the `else` block around line 415):

```typescript
} else {
  try {
    let stream: MediaStream;
    
    // Detect Electron
    const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;
    
    if (isElectron) {
      // ELECTRON PATH - with system audio!
      console.log('🖥️ Electron: Getting screen sources with system audio support...');
      
      const sources = await window.electronAPI!.getScreenSources();
      
      // Auto-select first screen (or show picker UI)
      const screenSource = sources.find(s => 
        s.name.includes('Entire Screen') || 
        s.name.includes('Screen 1')
      ) || sources[0];
      
      if (!screenSource) {
        throw new Error('No screen sources available');
      }
      
      console.log(`✅ Selected: ${screenSource.name}`);
      
      // Get constraints from Electron (includes system audio!)
      const constraints = await window.electronAPI!.getScreenStream(screenSource.id, true);
      
      // Get stream with system audio
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('✅ Electron screen share with SYSTEM AUDIO obtained!');
    } else {
      // BROWSER PATH - limited audio
      console.log('🖥️ Browser: Using getDisplayMedia (limited audio)...');
      
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 3840, max: 3840 },
          height: { ideal: 2160, max: 2160 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: true, // Only captures tab audio in browsers
      } as any);
      
      console.log('✅ Browser screen share (tab audio only)');
    }
    
    // Rest of your publishing logic stays the same
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];
    
    // ... continue with your existing code ...
```

### Step 3: Rebuild the Apps

After making the changes:

```bash
# Rebuild Windows
cd electron
npm run build

# Rebuild Linux
npm run build:linux
```

## 🧪 Testing

1. **In Browser**: Open `https://online.rv2class.com`
   - Screen share will use normal browser API
   - Console shows: "🌐 Running in browser"
   - Only tab audio captured

2. **In Electron App**: Run the installed app
   - Screen share will use Electron API
   - Console shows: "🖥️ Electron: Getting screen sources..."
   - SYSTEM AUDIO captured from ANY window!

## 📝 What the Electron App Does Differently

| Feature | Browser | Electron Desktop App |
|---------|---------|---------------------|
| Window audio capture | ❌ No | ✅ YES! |
| Screen audio capture | ❌ No | ✅ YES! |
| Tab audio capture | ✅ Yes | ✅ Yes |
| System audio source | N/A | `desktopCapturer` API |

## 🎯 The Key Difference

**Browser `getDisplayMedia()`:**
```javascript
// This can only get tab audio, NOT window audio
const stream = await navigator.mediaDevices.getDisplayMedia({
  audio: true  // ← Only works for Chrome tabs
});
```

**Electron `desktopCapturer + getUserMedia()`:**
```javascript
// This gets REAL system audio from windows!
const constraints = {
  audio: {
    mandatory: {
      chromeMediaSource: 'desktop',  // ← The magic!
      chromeMediaSourceId: sourceId   // ← Captures system audio
    }
  }
};
const stream = await navigator.mediaDevices.getUserMedia(constraints);
```

## ❓ FAQ

**Q: Why don't you just integrate it for me?**  
A: I wanted to avoid modifying your working webapp without your approval. The Electron apps are ready - they just need the detection code in your webapp.

**Q: Will this break my website for browser users?**  
A: No! The code detects whether it's running in Electron or browser and uses the appropriate API for each.

**Q: Do I need to rebuild the Electron apps?**  
A: Only after you update the webapp code. The current builds will work, but won't use the enhanced audio capture yet.

**Q: Can I test without rebuilding?**  
A: Yes! Just open the Electron app in dev mode:
```bash
cd electron
npm start
```
Make sure your Next.js is running on `localhost:3000` first.

---

**Ready to integrate? Let me know and I'll help you add the code!** 🚀
