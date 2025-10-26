export const SOUNDS = {
  BEEP: 'Beep',
  CHIME: 'Chime',
  BELL: 'Bell',
  DIGITAL: 'Digital',
} as const;

export type SoundName = typeof SOUNDS[keyof typeof SOUNDS];

export const getSelectedSound = (): SoundName => {
  try {
    const savedSound = window.localStorage.getItem('notification_sound');
    if (savedSound && Object.values(SOUNDS).includes(savedSound as SoundName)) {
      return savedSound as SoundName;
    }
  } catch (e) {
    console.error("Could not access localStorage for sound settings.", e);
  }
  return SOUNDS.BEEP;
};

// --- NEW AUDIO CONTEXT HANDLING ---

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window !== 'undefined') {
    if (!audioContext) {
      try {
        // Use `webkitAudioContext` for Safari compatibility
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContext = new AudioContext();
      } catch (e) {
        console.error("Web Audio API is not supported in this browser.", e);
        return null;
      }
    }
    return audioContext;
  }
  return null;
};

/**
 * Unlocks the audio context. This function MUST be called from within a user 
 * gesture handler (e.g., a click or tap event) to work on most mobile browsers.
 */
export const unlockAudioContext = () => {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(err => console.error("Failed to resume AudioContext:", err));
  }
};


export const playSound = (soundName: SoundName = getSelectedSound()) => {
  const ctx = getAudioContext();
  
  if (!ctx) {
    console.error("AudioContext not available.");
    return;
  }
  
  if (ctx.state !== 'running') {
    console.warn('AudioContext is not running. Sound may not play. Ensure `unlockAudioContext` is called from a user gesture.');
    ctx.resume().catch(err => console.error("Failed to resume AudioContext during playback:", err));
  }

  try {
    switch (soundName) {
      case SOUNDS.CHIME: {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        gain1.gain.setValueAtTime(0.3, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.5);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2); // E5
        gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.7);
        osc2.start(ctx.currentTime + 0.2);
        osc2.stop(ctx.currentTime + 0.7);
        break;
      }
      case SOUNDS.BELL: {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 1.0);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.0);
        break;
      }
      case SOUNDS.DIGITAL: {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(600, ctx.currentTime);
        gain1.gain.setValueAtTime(0.2, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.1);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(800, ctx.currentTime + 0.15);
        gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.15);
        osc2.stop(ctx.currentTime + 0.25);
        break;
      }
      case SOUNDS.BEEP:
      default: {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 note
        gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        break;
      }
    }
  } catch (error) {
    console.error("Could not play sound:", error);
  }
};
