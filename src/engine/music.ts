// The duet music (design doc 15.4, 15.4b), composed in code with Web Audio.
// Three layers over a 4-chord loop in A minor:
//   base   = warm drone + soft pad (always on)
//   fire   = Hot Boy: hand drums + marimba-like plucks (louder while he moves)
//   water  = Cool Girl: glassy chimes + flowing arpeggios with echo (louder while she moves)
// Both moving = the full song. Teamwork literally sounds better (P1).
import { audioContext } from './device';
import type { Elem } from '../game/level';

export type MusicMode = 'title' | 'lobby' | 'map' | 'level';

// Am – F – C – G, one chord per bar. Notes as MIDI numbers.
const CHORDS = [
  [57, 60, 64], // A C E
  [53, 57, 60], // F A C
  [48, 52, 55], // C E G
  [55, 59, 62], // G B D
];
const ROOTS = [45, 41, 48, 43];
const PENTA = [57, 60, 62, 64, 67, 69, 72, 74, 76]; // A minor pentatonic, for melodies
const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// Small deterministic random so each bar's melody is varied but the loop stays coherent.
function rnd(seed: number): number {
  let h = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

interface Layer { gain: GainNode; target: number }

class Music {
  private ac: AudioContext | null = null;
  private master: GainNode | null = null;
  private duckGain: GainNode | null = null;
  private layers: Record<'base' | 'fire' | 'water', Layer> | null = null;
  private echo: { input: GainNode } | null = null;
  private timer = 0;
  private step = 0; // 16th notes since start
  private nextTime = 0;
  private bpm = 92;
  private mode: MusicMode = 'title';
  private enabled = true;
  private volume = 0.5;
  private moveFire = 0;
  private moveWater = 0;
  private me: Elem | null = null;
  private partner = false;

  /** Call after the first tap (audio unlock). Safe to call again. */
  start(): void {
    const ac = audioContext();
    if (!ac || this.ac) return;
    this.ac = ac;
    this.master = ac.createGain();
    this.master.gain.value = this.enabled ? this.volume : 0;
    this.duckGain = ac.createGain();
    this.duckGain.connect(this.master).connect(ac.destination);
    const mk = (): Layer => {
      const gain = ac.createGain();
      gain.gain.value = 0;
      gain.connect(this.duckGain!);
      return { gain, target: 0 };
    };
    this.layers = { base: mk(), fire: mk(), water: mk() };
    // echo for the chimes
    const input = ac.createGain();
    const delay = ac.createDelay(1);
    delay.delayTime.value = (60 / this.bpm) * 0.75;
    const fb = ac.createGain();
    fb.gain.value = 0.35;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3000;
    input.connect(delay).connect(lp).connect(fb).connect(delay);
    lp.connect(this.layers.water.gain);
    this.echo = { input };
    this.nextTime = ac.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 40);
    this.applyMix(true);
  }

  configure(enabled: boolean, volume: number): void {
    this.enabled = enabled;
    this.volume = volume;
    if (this.master && this.ac) this.master.gain.setTargetAtTime(enabled ? volume : 0, this.ac.currentTime, 0.2);
  }

  setMode(mode: MusicMode): void {
    if (mode === this.mode) return;
    this.mode = mode;
    this.bpm = mode === 'level' ? 92 : mode === 'map' ? 80 : 76;
    this.applyMix();
  }

  /** Lobby: your own layer plays alone until your partner arrives (15.4b). */
  setPresence(me: Elem | null, partnerHere: boolean): void {
    this.me = me;
    this.partner = partnerHere;
    this.applyMix();
  }

  /** In a level: 0..1 how much each character is moving. */
  setMovement(fire: number, water: number): void {
    // smooth, so a quick stop doesn't cut the music
    this.moveFire += (fire - this.moveFire) * (fire > this.moveFire ? 0.5 : 0.08);
    this.moveWater += (water - this.moveWater) * (water > this.moveWater ? 0.5 : 0.08);
    if (this.mode === 'level') this.applyMix();
  }

  /** Quiet down for a moment (a death). */
  duck(): void {
    if (!this.ac || !this.duckGain) return;
    const t = this.ac.currentTime;
    this.duckGain.gain.cancelScheduledValues(t);
    this.duckGain.gain.setTargetAtTime(0.25, t, 0.05);
    this.duckGain.gain.setTargetAtTime(1, t + 1.1, 0.4);
  }

  /** Swell on level complete. */
  swell(): void {
    if (!this.ac || !this.duckGain) return;
    const t = this.ac.currentTime;
    this.duckGain.gain.cancelScheduledValues(t);
    this.duckGain.gain.setTargetAtTime(1.5, t, 0.1);
    this.duckGain.gain.setTargetAtTime(1, t + 1.2, 0.5);
  }

  /** Results jingle: bigger with more stars (15.4b). */
  jingle(stars: number): void {
    const ac = this.ac;
    if (!ac || !this.duckGain || !this.enabled) return;
    const t = ac.currentTime + 0.05;
    const notes = [57, 60, 64, 69, 72, 76, 81].slice(0, 3 + stars);
    notes.forEach((n, i) => {
      this.bell(t + i * 0.11, hz(n + 12), 0.9, 0.12, this.duckGain!);
      this.pluck(t + i * 0.11, hz(n), 0.4, 0.1, this.duckGain!);
    });
  }

  private applyMix(instant = false): void {
    if (!this.layers || !this.ac) return;
    let base = 0.8, fire = 0.45, water = 0.45;
    if (this.mode === 'lobby') {
      fire = this.me === 'fire' || this.partner ? 0.6 : 0;
      water = this.me === 'water' || this.partner ? 0.6 : 0;
      if (!this.me) fire = water = 0.4;
    } else if (this.mode === 'map') {
      base = 0.6;
      fire = water = 0.3;
    } else if (this.mode === 'level') {
      fire = 0.12 + 0.8 * this.moveFire;
      water = 0.12 + 0.8 * this.moveWater;
    }
    const t = this.ac.currentTime;
    const set = (l: Layer, v: number) => {
      if (Math.abs(l.target - v) < 0.01 && !instant) return;
      l.target = v;
      l.gain.gain.setTargetAtTime(v, t, instant ? 0.01 : 0.6);
    };
    set(this.layers.base, base);
    set(this.layers.fire, fire);
    set(this.layers.water, water);
  }

  // ------------------------------------------------------------ the composer

  private schedule(): void {
    const ac = this.ac;
    if (!ac || !this.layers) return;
    if (this.nextTime < ac.currentTime - 0.5) this.nextTime = ac.currentTime + 0.05; // tab was asleep
    while (this.nextTime < ac.currentTime + 0.15) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += 60 / this.bpm / 4;
      this.step++;
    }
  }

  private playStep(s: number, t: number): void {
    const L = this.layers!;
    const bar = Math.floor(s / 16);
    const i = s % 16;
    const chord = CHORDS[bar % 4];
    const root = ROOTS[bar % 4];
    const calm = this.mode !== 'level';

    // --- base: drone + pad, changes with each bar
    if (i === 0) {
      this.drone(t, hz(root - 12), (60 / this.bpm) * 4, L.base.gain);
      for (const n of chord) this.pad(t, hz(n), (60 / this.bpm) * 4, L.base.gain);
    }

    // --- fire: hand drums + plucks
    const drumPattern = calm ? [0, 10] : [0, 6, 10, 14];
    if (drumPattern.includes(i)) this.drum(t, i === 0 ? 1 : 0.6, true, L.fire.gain);
    if (!calm ? i % 4 === 2 : i === 8) this.drum(t, 0.4, false, L.fire.gain);
    if (!calm && i === 15 && rnd(bar * 7) > 0.5) this.drum(t, 0.3, false, L.fire.gain);
    const pluckSteps = calm ? [0, 6, 12] : [0, 3, 6, 8, 11, 14];
    if (pluckSteps.includes(i) && rnd(bar * 31 + i) > (calm ? 0.35 : 0.2)) {
      const n = PENTA[Math.floor(rnd(bar * 13 + i * 3) * 6)];
      this.pluck(t, hz(n), 0.35, 0.09, L.fire.gain);
    }

    // --- water: arpeggio chimes with echo
    const arp = calm ? i % 4 === 0 : i % 2 === 0;
    if (arp) {
      const k = Math.floor(i / (calm ? 4 : 2));
      const up = [0, 1, 2, 1, 2, 0, 1, 2][k % 8];
      const n = chord[up] + 12 + (k % 4 === 3 ? 12 : 0);
      this.bell(t, hz(n), calm ? 1.4 : 0.9, calm ? 0.05 : 0.04, this.echo!.input);
      this.bell(t, hz(n), calm ? 1.4 : 0.9, calm ? 0.05 : 0.04, L.water.gain);
    }
    if (i === 0 && rnd(bar * 5) > 0.4) this.bell(t, hz(PENTA[5 + Math.floor(rnd(bar) * 4)] + 12), 2, 0.035, L.water.gain);
  }

  // ------------------------------------------------------------ instruments

  private env(g: GainNode, t: number, attack: number, peak: number, dur: number): void {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  private drone(t: number, f: number, dur: number, dest: AudioNode): void {
    const ac = this.ac!;
    const o = ac.createOscillator();
    const o2 = ac.createOscillator();
    const lp = ac.createBiquadFilter();
    const g = ac.createGain();
    o.type = 'sawtooth';
    o2.type = 'triangle';
    o.frequency.value = f;
    o2.frequency.value = f * 1.5 * 1.003;
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(220, t);
    lp.frequency.linearRampToValueAtTime(420, t + dur / 2);
    lp.frequency.linearRampToValueAtTime(220, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.4);
    g.gain.setValueAtTime(0.07, t + dur - 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.2);
    o.connect(lp);
    o2.connect(lp);
    lp.connect(g).connect(dest);
    o.start(t);
    o2.start(t);
    o.stop(t + dur + 0.3);
    o2.stop(t + dur + 0.3);
  }

  private pad(t: number, f: number, dur: number, dest: AudioNode): void {
    const ac = this.ac!;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle';
    o.frequency.value = f;
    o.detune.value = (Math.random() - 0.5) * 8;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.022, t + 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.6);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.7);
  }

  /** Hand drum: low (tom) or high (conga slap). */
  private drum(t: number, vel: number, low: boolean, dest: AudioNode): void {
    const ac = this.ac!;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(low ? 150 : 330, t);
    o.frequency.exponentialRampToValueAtTime(low ? 62 : 210, t + (low ? 0.18 : 0.08));
    this.env(g, t, 0.004, (low ? 0.3 : 0.14) * vel, low ? 0.32 : 0.14);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + 0.4);
  }

  /** Marimba-like pluck: triangle + a quick octave partial. */
  private pluck(t: number, f: number, dur: number, vol: number, dest: AudioNode): void {
    const ac = this.ac!;
    for (const [mult, v] of [[1, vol], [4, vol * 0.25]] as const) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = mult === 1 ? 'triangle' : 'sine';
      o.frequency.value = f * mult;
      this.env(g, t, 0.003, v, mult === 1 ? dur : dur * 0.3);
      o.connect(g).connect(dest);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
  }

  /** Glassy chime: sine + an inharmonic bell partial. */
  private bell(t: number, f: number, dur: number, vol: number, dest: AudioNode): void {
    const ac = this.ac!;
    for (const [mult, v] of [[1, vol], [2.76, vol * 0.35], [5.4, vol * 0.12]] as const) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.value = f * mult;
      this.env(g, t, 0.004, v, dur / (mult > 1 ? 2 : 1));
      o.connect(g).connect(dest);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
  }

  stop(): void {
    clearInterval(this.timer);
  }
}

export const music = new Music();
