/**
 * @fileoverview Manages audio playback for the application using the Web Audio API.
 * This includes sound definitions, an AudioContext manager, and playback functions.
 */

/**
 * An enum of available sound names for notifications.
 * Using `as const` creates a readonly object with literal types.
 */
export const SOUNDS = {
  BEEP: 'Beep',
  CHIME: 'Chime',
  BELL: 'Bell',
  DIGITAL: 'Digital',
} as const;

/**
 * A type representing one of the available sound names.
 */
export type SoundName = typeof SOUNDS[keyof typeof SOUNDS];

/**
 * Retrieves the user-selected sound from localStorage, defaulting to 'Beep'.
 * @returns {SoundName} The selected sound name.
 */
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

// --- AudioContext Management ---

/**
 * A singleton instance of the AudioContext.
 * Using a module-level variable ensures we only create one instance.
 * @type {AudioContext | null}
 */
let audioContext: AudioContext | null = null;

/**
 * Gets or creates the singleton AudioContext instance.
 * Handles browser differences (e.g., `webkitAudioContext` for Safari).
 * @returns {AudioContext | null} The AudioContext instance, or null if not supported.
 */
const getAudioContext = (): AudioContext | null => {
  // Return null if in a non-browser environment
  if (typeof window === 'undefined') return null;

  // Return the existing context if it's already created
  if (audioContext) return audioContext;

  try {
    // Standard AudioContext or prefixed version for Safari
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    audioContext = new AudioContext();
    return audioContext;
  } catch (e) {
    console.error("Web Audio API is not supported in this browser.", e);
    return null;
  }
};

// --- Sound Playback ---

/**
 * A helper function to create and play a single audio tone.
 * @param {AudioContext} ctx - The AudioContext to use.
 * @param {object} options - The parameters for the tone.
 * @param {OscillatorType} options.type - The waveform type (e.g., 'sine', 'square').
 * @param {number} options.freq - The frequency of the tone in Hz.
 * @param {number} options.gainValue - The volume of the tone (0 to 1).
 * @param {number} options.startTime - The absolute time to start the tone (from `ctx.currentTime`).
 * @param {number} options.duration - The duration of the tone in seconds.
 */
const createTone = (
  ctx: AudioContext,
  {
    type,
    freq,
    gainValue,
    startTime,
    duration,
  }: {
    type: OscillatorType;
    freq: number;
    gainValue: number;
    startTime: number;
    duration: number;
  },
) => {
  // Create an oscillator to generate the sound wave
  const osc = ctx.createOscillator();
  // Create a gain node to control the volume
  const gainNode = ctx.createGain();

  // Connect the oscillator to the gain node, and the gain node to the speakers
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Configure the tone's properties
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gainNode.gain.setValueAtTime(gainValue, startTime);
  
  // Fade the sound out smoothly to prevent clicking
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  // Schedule the tone to start and stop
  osc.start(startTime);
  osc.stop(startTime + duration);
};

/**
 * Plays the specified sound effect. This is an async function that handles
 * unlocking the AudioContext on user interaction.
 * @param {SoundName} [soundName=getSelectedSound()] - The name of the sound to play.
 */
export const playSound = async (soundName: SoundName = getSelectedSound()) => {
  const ctx = getAudioContext();
  if (!ctx) {
    console.error("AudioContext not available, cannot play sound.");
    return;
  }

  // Await the resume() promise to ensure the context is running before playing audio.
  // This is crucial for complying with browser autoplay policies.
  if (ctx.state !== 'running') {
    try {
      await ctx.resume();
    } catch (err) {
      console.error("Failed to resume AudioContext:", err);
      // Do not proceed if the context cannot be resumed.
      return;
    }
  }

  const now = ctx.currentTime;

  try {
    switch (soundName) {
      case SOUNDS.CHIME:
        // A pleasant two-tone chime.
        createTone(ctx, { type: 'sine', freq: 523.25, gainValue: 0.3, startTime: now, duration: 0.5 });
        createTone(ctx, { type: 'sine', freq: 659.25, gainValue: 0.3, startTime: now + 0.2, duration: 0.5 });
        break;

      case SOUNDS.BELL:
        // A more complex bell-like sound using multiple sine waves (partials).
        const fundamental = 440; // A4
        createTone(ctx, { type: 'sine', freq: fundamental, gainValue: 0.3, startTime: now, duration: 1.5 });
        createTone(ctx, { type: 'sine', freq: fundamental * 2.02, gainValue: 0.2, startTime: now, duration: 1.2 });
        createTone(ctx, { type: 'sine', freq: fundamental * 3.01, gainValue: 0.15, startTime: now, duration: 1.0 });
        break;

      case SOUNDS.DIGITAL:
        // A classic digital alarm sound.
        createTone(ctx, { type: 'square', freq: 600, gainValue: 0.2, startTime: now, duration: 0.1 });
        createTone(ctx, { type: 'square', freq: 800, gainValue: 0.2, startTime: now + 0.15, duration: 0.1 });
        break;

      case SOUNDS.BEEP:
      default:
        // A simple, clean beep sound.
        createTone(ctx, { type: 'sine', freq: 523.25, gainValue: 0.4, startTime: now, duration: 0.5 });
        break;
    }
  } catch (error) {
    console.error(`Could not play sound "${soundName}":`, error);
  }
};
