/**
 * Native Web Speech & Audio Chime Utility
 * Synthesizes voice announcements and chime tones with zero external dependencies.
 */

export function playChimeTone() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.2); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, now); // A4
    osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.2); // E5

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.65);
    osc2.stop(now + 0.65);
  } catch (err) {
    console.debug('Audio chime skipped:', err);
  }
}

export function announceToken(tokenNumber, counterName = 'Counter 1') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  playChimeTone();

  setTimeout(() => {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `Token number ${tokenNumber}, please proceed to ${counterName}`
      );
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.debug('Speech synthesis error:', err);
    }
  }, 350);
}
