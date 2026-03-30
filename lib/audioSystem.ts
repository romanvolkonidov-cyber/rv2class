"use client";

// Simple oscillator-based synthesizer for retro game UI sounds
// Runs entirely natively in the browser without external assets.

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  // Resume context if suspended (browser auto-play policy)
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSound(type: "success" | "error" | "complete" | "purchase" | "levelUp") {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  const now = ctx.currentTime;

  if (type === "success") {
    // A cheerful high "ding-ding"
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(600, now);
    oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  } 
  else if (type === "error") {
    // A short low buzz
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(150, now);
    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.2);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }
  else if (type === "complete") {
    // A triumphant "Ta-Da!" chord arpeggio
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(440, now);      // A4
    oscillator.frequency.setValueAtTime(554.37, now + 0.1); // C#5
    oscillator.frequency.setValueAtTime(659.25, now + 0.2); // E5
    oscillator.frequency.setValueAtTime(880, now + 0.3);    // A5
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
    
    // create a pulsing effect for the final note
    gainNode.gain.setValueAtTime(0.3, now + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    
    oscillator.start(now);
    oscillator.stop(now + 0.8);
  }
  else if (type === "purchase") {
    // A metallic "Cha-ching" ring
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(1000, now);
    oscillator.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
    
    const noiseOsc = ctx.createOscillator();
    noiseOsc.type = "triangle";
    noiseOsc.frequency.setValueAtTime(2000, now);
    const noiseGain = ctx.createGain();
    
    noiseOsc.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.3, now + 0.1);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    oscillator.start(now);
    oscillator.stop(now + 0.2);
    noiseOsc.start(now);
    noiseOsc.stop(now + 0.3);
  }
  else if (type === "levelUp") {
    // Epic fanfare
    oscillator.type = "square";
    
    // C major fanfare: G4 -> C5 -> E5 -> G5
    const notes = [392.00, 523.25, 659.25, 783.99];
    const duration = 0.15;
    
    for (let i = 0; i < notes.length; i++) {
        oscillator.frequency.setValueAtTime(notes[i], now + (i * duration));
    }
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gainNode.gain.setValueAtTime(0.2, now + (3 * duration));
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + (4 * duration) + 0.3);
    
    oscillator.start(now);
    oscillator.stop(now + (4 * duration) + 0.3);
  }
}
