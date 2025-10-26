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


export const playSound = (soundName: SoundName = getSelectedSound()) => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioContext) return;

    switch (soundName) {
      case SOUNDS.CHIME: {
        const osc1 = audioContext.createOscillator();
        const gain1 = audioContext.createGain();
        osc1.connect(gain1);
        gain1.connect(audioContext.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        gain1.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
        osc1.start(audioContext.currentTime);
        osc1.stop(audioContext.currentTime + 0.5);

        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.2); // E5
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.7);
        osc2.start(audioContext.currentTime + 0.2);
        osc2.stop(audioContext.currentTime + 0.7);
        break;
      }
      case SOUNDS.BELL: {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(987.77, audioContext.currentTime); // B5
        gain.gain.setValueAtTime(0.4, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 1.0);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 1.0);
        break;
      }
      case SOUNDS.DIGITAL: {
        const osc1 = audioContext.createOscillator();
        const gain1 = audioContext.createGain();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(600, audioContext.currentTime);
        gain1.gain.setValueAtTime(0.2, audioContext.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.1);
        osc1.connect(gain1);
        gain1.connect(audioContext.destination);
        osc1.start();
        osc1.stop(audioContext.currentTime + 0.1);

        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(800, audioContext.currentTime + 0.15);
        gain2.gain.setValueAtTime(0.2, audioContext.currentTime + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.25);
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.start(audioContext.currentTime + 0.15);
        osc2.stop(audioContext.currentTime + 0.25);
        break;
      }
      case SOUNDS.BEEP:
      default: {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5 note
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        break;
      }
    }
  } catch (error) {
    console.error("Could not play sound:", error);
  }
};
