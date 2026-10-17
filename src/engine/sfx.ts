// Code-made sound effects (design doc 15.2, 15.3). Every sound varies slightly each time.
// Hot Boy = crackly, warm, punchy. Cool Girl = soft, glassy, airy.
import { audioContext } from './device';
import type { Elem, Liquid } from '../game/level';

let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let enabled = true;
let volume = 0.7;

export function configure(on: boolean, vol: number): void {
  enabled = on;
  volume = vol;
  if (master) master.gain.value = vol;
}

function ctx(): AudioContext | null {
  const ac = audioContext();
  if (!enabled || !ac || ac.state !== 'running') return null;
  if (!master) {
    master = ac.createGain();
    master.gain.value = volume;
    // Gentle limiter so stacked sounds never clip on phone speakers.
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -10;
    comp.ratio.value = 6;
    master.connect(comp).connect(ac.destination);
  }
  if (!noise) {
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return ac;
}

const vary = (v: number, amt = 0.08) => v * (1 - amt + Math.random() * amt * 2);

/** Panned output node: sounds come from where they happen (15.6). pan -1..1; gain < 1 for the partner's sounds. */
function out(ac: AudioContext, pan: number, gain: number): AudioNode {
  const p = ac.createStereoPanner();
  p.pan.value = Math.max(-1, Math.min(1, pan));
  if (gain === 1) {
    p.connect(master!);
    return p;
  }
  const g = ac.createGain();
  g.gain.value = gain;
  p.connect(g).connect(master!);
  return p;
}

function tone(ac: AudioContext, dest: AudioNode, type: OscillatorType, f0: number, f1: number, dur: number, vol: number, delay = 0, attack = 0.005): void {
  const t = ac.currentTime + delay;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function hiss(ac: AudioContext, dest: AudioNode, filter: BiquadFilterType, f0: number, f1: number, q: number, dur: number, vol: number, delay = 0, attack = 0.005): void {
  const t = ac.currentTime + delay;
  const src = ac.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = vary(1, 0.2);
  const f = ac.createBiquadFilter();
  f.type = filter;
  f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), t + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(dest);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.02);
}

export function jump(e: Elem, pan: number, gain = 1): void {
  const ac = ctx();
  if (!ac) return;
  const o = out(ac, pan, gain);
  if (e === 'fire') {
    hiss(ac, o, 'bandpass', vary(900), vary(2600), 1.2, 0.16, 0.35); // whoosh
    tone(ac, o, 'sawtooth', vary(140), vary(260), 0.09, 0.07); // punch
    for (let i = 0; i < 3; i++) hiss(ac, o, 'highpass', 4000, 6000, 1, 0.02, 0.12, 0.02 + Math.random() * 0.08); // sparks
  } else {
    tone(ac, o, 'sine', vary(520), vary(980), 0.14, 0.16); // airy swish up
    hiss(ac, o, 'bandpass', vary(1800), vary(3200), 2, 0.12, 0.12);
  }
}

export function land(e: Elem, strength: number, pan: number, gain = 1): void {
  const ac = ctx();
  if (!ac) return;
  const o = out(ac, pan, gain);
  const v = Math.min(1, 0.3 + strength);
  if (e === 'fire') {
    tone(ac, o, 'triangle', vary(150), 55, 0.14, 0.32 * v); // heavy thump
    hiss(ac, o, 'highpass', 3000, 5000, 1, 0.12 * v + 0.04, 0.12 * v, 0.01); // sizzle
  } else {
    tone(ac, o, 'sine', vary(330), vary(220), 0.12, 0.14 * v); // soft ripple
    hiss(ac, o, 'lowpass', 1400, 400, 1, 0.1, 0.1 * v);
  }
}

export function step(e: Elem, pan: number, gain = 1): void {
  const ac = ctx();
  if (!ac) return;
  const o = out(ac, pan, gain);
  if (e === 'fire') hiss(ac, o, 'bandpass', vary(2500, 0.3), 1800, 3, 0.035, 0.07); // crackly tap
  else hiss(ac, o, 'lowpass', vary(900, 0.3), 300, 1, 0.05, 0.06); // wet pat
}

export function turn(e: Elem, pan: number, gain = 1): void {
  const ac = ctx();
  if (!ac) return;
  hiss(ac, out(ac, pan, gain), 'bandpass', vary(e === 'fire' ? 1500 : 2200), 900, 2, 0.06, 0.06);
}

export function nudge(pan: number, gain = 1): void {
  const ac = ctx();
  if (!ac) return;
  tone(ac, out(ac, pan, gain), 'sine', vary(700), vary(900), 0.05, 0.05);
}

export function splash(kind: Liquid, pan: number, gain = 1): void {
  const ac = ctx();
  if (!ac) return;
  const o = out(ac, pan, gain);
  if (kind === 'water') {
    hiss(ac, o, 'bandpass', vary(1600), 600, 1.5, 0.18, 0.18);
    tone(ac, o, 'sine', vary(800), 400, 0.08, 0.06, 0.03);
  } else {
    hiss(ac, o, 'lowpass', vary(700), 200, 1, 0.22, 0.22); // heavy gloop
    tone(ac, o, 'sine', vary(180), 90, 0.12, 0.1, 0.02);
  }
}

export function death(e: Elem, cause: Liquid, pan: number, gain = 1): void {
  const ac = ctx();
  if (!ac) return;
  const o = out(ac, pan, gain);
  if (cause === 'poison') {
    hiss(ac, o, 'bandpass', 1200, 300, 4, 0.4, 0.3);
    tone(ac, o, 'square', 300, 70, 0.35, 0.08);
  } else if (e === 'fire') {
    hiss(ac, o, 'highpass', 5000, 2500, 0.7, 0.55, 0.4, 0, 0.01); // steam hiss
    tone(ac, o, 'sawtooth', 220, 60, 0.18, 0.08, 0.35); // angry "pfft"
    hiss(ac, o, 'lowpass', 900, 200, 1, 0.12, 0.25, 0.35);
  } else {
    for (let i = 0; i < 5; i++) tone(ac, o, 'sine', vary(300 + i * 90), vary(700 + i * 120), 0.06, 0.12, i * 0.05); // boiling bubbles
    tone(ac, o, 'sine', 520, 180, 0.5, 0.08, 0.28, 0.08); // evaporating sigh
  }
}

// Gem notes are in the music's key (15.4): a minor pentatonic on A.
const SCALE = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99, 880];

export function gem(e: Elem, combo: number, pan: number, gain = 1): void {
  const ac = ctx();
  if (!ac) return;
  const o = out(ac, pan, gain);
  const f = SCALE[Math.min(combo, SCALE.length - 1) + 3] ?? 880;
  if (e === 'fire') {
    tone(ac, o, 'triangle', f, f, 0.22, 0.2); // warm
    tone(ac, o, 'sine', f * 2, f * 2, 0.12, 0.06);
  } else {
    tone(ac, o, 'sine', f * 2, f * 2, 0.3, 0.16); // glassy
    tone(ac, o, 'sine', f * 3, f * 3, 0.2, 0.05, 0.01);
  }
}

export function respawn(e: Elem, pan: number, gain = 1): void {
  const ac = ctx();
  if (!ac) return;
  tone(ac, out(ac, pan, gain), e === 'fire' ? 'triangle' : 'sine', 300, 600, 0.18, 0.08);
}

export function victory(e: Elem, pan: number, gain = 1): void {
  const ac = ctx();
  if (!ac) return;
  const o = out(ac, pan, gain);
  if (e === 'fire') {
    // little firework pops
    for (let i = 0; i < 4; i++) {
      hiss(ac, o, 'bandpass', vary(2500), 800, 1.5, 0.12, 0.2, 0.15 + i * 0.13);
      tone(ac, o, 'triangle', vary(392 * (1 + i * 0.25)), 200, 0.12, 0.08, 0.15 + i * 0.13);
    }
  } else {
    tone(ac, o, 'sine', 1318.5, 1318.5, 0.5, 0.12, 0.1); // glassy chime
    tone(ac, o, 'sine', 1975.5, 1975.5, 0.4, 0.06, 0.12);
    hiss(ac, o, 'highpass', 6000, 6000, 1, 0.02, 0.15, 0.45); // sunglasses click
  }
}

export function chime(notes: number[], gap = 0.09, vol = 0.12): void {
  const ac = ctx();
  if (!ac) return;
  const o = out(ac, 0, 1);
  notes.forEach((f, i) => tone(ac, o, 'sine', f, f, 0.35, vol, i * gap));
}

// ---- mechanisms (15.5): brass clicks, stone rumbles ----

export function button(down: boolean, pan: number): void {
  const ac = ctx();
  if (!ac) return;
  const o = out(ac, pan, 1);
  tone(ac, o, 'square', down ? 1200 : 900, down ? 700 : 600, 0.03, 0.06); // click
  if (down) hiss(ac, o, 'lowpass', 300, 120, 1, 0.25, 0.16, 0.02); // stone rumble
}

export function lever(pan: number): void {
  const ac = ctx();
  if (!ac) return;
  const o = out(ac, pan, 1);
  tone(ac, o, 'triangle', 220, 110, 0.12, 0.18); // clunk
  tone(ac, o, 'square', 1500, 900, 0.025, 0.05, 0.08);
}

export function grind(start: boolean, pan: number): void {
  const ac = ctx();
  if (!ac) return;
  const o = out(ac, pan, 1);
  hiss(ac, o, 'bandpass', start ? 180 : 260, start ? 260 : 140, 3, start ? 0.35 : 0.2, 0.14);
  tone(ac, o, 'sawtooth', start ? 55 : 70, start ? 70 : 50, 0.25, 0.04);
}

export function gate(opening: boolean, pan: number): void {
  const ac = ctx();
  if (!ac) return;
  const o = out(ac, pan, 1);
  hiss(ac, o, 'bandpass', opening ? 400 : 600, opening ? 900 : 300, 2, 0.4, 0.12);
  tone(ac, o, 'triangle', opening ? 90 : 120, opening ? 130 : 70, 0.4, 0.06);
}
