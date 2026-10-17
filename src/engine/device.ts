// Phone-level helpers: audio unlock, haptics, wake lock, fullscreen/orientation.
// Browsers only allow most of these after a user gesture, so call unlock() from a tap handler.

let audio: AudioContext | null = null;
let wakeLock: WakeLockSentinel | null = null;

export function unlock(): void {
  if (!audio) audio = new AudioContext();
  if (audio.state === 'suspended') void audio.resume();
  void keepAwake();
}

export function audioContext(): AudioContext | null {
  return audio;
}

export function haptic(ms = 12): void {
  // Android only (iOS Safari has no vibration API). Browsers refuse it before the first tap.
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  navigator.vibrate?.(ms);
}

/** Short synthesized blip; pitch is randomized slightly so repeats don't sound robotic. */
export function blip(baseHz: number, type: OscillatorType = 'triangle', duration = 0.12, volume = 0.18): void {
  if (!audio || audio.state !== 'running') return;
  const t = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  const hz = baseHz * (0.9 + Math.random() * 0.2);
  osc.frequency.setValueAtTime(hz, t);
  osc.frequency.exponentialRampToValueAtTime(hz * 0.6, t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

async function keepAwake(): Promise<void> {
  if (wakeLock || !('wakeLock' in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; });
  } catch {
    // Not allowed (e.g. low battery mode); the game still works.
  }
}

// The wake lock is dropped whenever the tab is hidden; take it again on return.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && audio) void keepAwake();
});

export const canFullscreen = (): boolean => !!document.fullscreenEnabled;

export async function enterFullscreenLandscape(): Promise<void> {
  if (!document.fullscreenElement) await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
  try {
    // Not in the TS DOM lib everywhere; supported on Android Chrome, not on iOS.
    await (screen.orientation as ScreenOrientation & { lock?(o: string): Promise<void> }).lock?.('landscape');
  } catch {
    // Orientation lock unsupported; the manifest still asks for landscape when installed.
  }
}

export function isStandalone(): boolean {
  return matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}
