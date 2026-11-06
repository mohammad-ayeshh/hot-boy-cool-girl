// The duet music (design doc 15.4, 15.4b), composed in code with Web Audio.
// Three layers over a 4-chord loop:
//   base   = warm drone + soft pad (always on), plus the chapter's texture (drips, wind, whispers)
//   fire   = Hot Boy: drums + marimba-like plucks (louder while he moves)
//   water  = Cool Girl: glassy chimes + flowing arpeggios with echo (louder while she moves)
// Both moving = the full song. Teamwork literally sounds better (P1).
// Each chapter has its own tune (9.3): key, chords, speed, drums and texture change; the duet stays.
// The home screen, lobby and map always play Chapter 1's tune.
import { audioContext } from './device';
import type { Elem } from '../game/level';

export type MusicMode = 'title' | 'lobby' | 'map' | 'level';

/** One chapter's music. Notes are MIDI numbers; one chord per bar. */
interface Tune {
  chords: number[][];
  roots: number[];
  /** A pentatonic scale from about A3 up (the first 5 notes are one octave): melodies and gem notes. */
  scale: number[];
  bpm: number;
  /** Hot Boy's drums: hand drums, soft toms, clockwork ticks, sparse, a heavy ancient drum, almost nothing, or a steam engine's chuff. */
  drums: 'hand' | 'soft' | 'clock' | 'sparse' | 'heavy' | 'whisper' | 'chuff';
  /** 16th steps with a pluck, how likely each one plays, and an octave shift */
  plucks: number[];
  pluckChance: number;
  pluckOctave?: number;
  /** plucks follow a fixed machine-like pattern (indexes into `scale`) instead of random notes */
  ostinato?: number[];
  /** plucks use the chord's notes instead of the scale (for chords outside the scale) */
  chordPlucks?: boolean;
  /** Cool Girl's arpeggio: a chime every 2 or 4 steps, and how likely each one plays */
  arpEvery: 2 | 4;
  arpChance: number;
  bellLen: number;
  /** echo feedback (0..0.7) */
  echo: number;
  pad: 'warm' | 'flute';
  texture?: 'drips' | 'wind' | 'breath' | 'hiss';
  /** overall loudness in levels */
  level: number;
}

const TUNES: Record<number, Tune> = {
  // 1 The Temple Gate: A minor, Am – F – C – G, warm marimba and hand drums (the home theme)
  1: { chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], roots: [45, 41, 48, 43], scale: [57, 60, 62, 64, 67, 69, 72, 74, 76],
    bpm: 92, drums: 'hand', plucks: [0, 3, 6, 8, 11, 14], pluckChance: 0.8, arpEvery: 2, arpChance: 1, bellLen: 0.9, echo: 0.35, pad: 'warm', level: 1 },
  // 2 The Flooded Halls: D minor, Dm – B♭ – F – C, slow, long echoes and falling drips
  2: { chords: [[57, 62, 65], [58, 62, 65], [57, 60, 65], [55, 60, 64]], roots: [50, 46, 41, 48], scale: [57, 60, 62, 65, 67, 69, 72, 74, 77],
    bpm: 74, drums: 'soft', plucks: [0, 8], pluckChance: 0.6, arpEvery: 4, arpChance: 1, bellLen: 1.6, echo: 0.55, pad: 'warm', texture: 'drips', level: 1 },
  // 3 The Deep Machine: C minor, Cm – Cm – A♭ – G, fast: ticking clockwork and a repeating pluck pattern
  3: { chords: [[55, 60, 63], [55, 60, 63], [56, 60, 63], [55, 59, 62]], roots: [48, 48, 44, 43], scale: [55, 58, 60, 63, 65, 67, 70, 72, 75],
    bpm: 112, drums: 'clock', plucks: [0, 2, 4, 6, 8, 10, 12, 14], pluckChance: 1, ostinato: [2, 4, 3, 2, 1, 3, 2, 0], arpEvery: 2, arpChance: 0.8,
    bellLen: 0.6, echo: 0.2, pad: 'warm', level: 0.95 },
  // 4 The Summit: D major, D – A – Bm – G, wide and hopeful: airy flute pads and wind
  4: { chords: [[57, 62, 66], [57, 61, 64], [59, 62, 66], [55, 59, 62]], roots: [50, 45, 47, 43], scale: [57, 59, 62, 64, 66, 69, 71, 74, 76],
    bpm: 84, drums: 'soft', plucks: [0, 6, 12], pluckChance: 0.7, arpEvery: 2, arpChance: 1, bellLen: 1.1, echo: 0.45, pad: 'flute', texture: 'wind', level: 1 },
  // 5 The Hall of Eyes: E minor drifting to C minor and B (strange, shifting chords), slow floating chimes
  5: { chords: [[55, 59, 64], [55, 60, 63], [55, 59, 64], [54, 59, 63]], roots: [52, 48, 52, 47], scale: [57, 59, 62, 64, 67, 69, 71, 74, 76],
    bpm: 68, drums: 'sparse', plucks: [0, 10], pluckChance: 0.5, chordPlucks: true, arpEvery: 4, arpChance: 1, bellLen: 2, echo: 0.55, pad: 'warm', level: 1 },
  // 6 The Sealed Vault: E Phrygian, Em – F – Em – Dm, low and heavy: an ancient drum and deep plucks
  6: { chords: [[52, 55, 59], [53, 57, 60], [52, 55, 59], [50, 53, 57]], roots: [52, 53, 52, 50], scale: [57, 59, 62, 64, 65, 69, 71, 74, 76],
    bpm: 78, drums: 'heavy', plucks: [0, 7], pluckChance: 0.6, pluckOctave: -12, arpEvery: 4, arpChance: 1, bellLen: 1.3, echo: 0.4, pad: 'warm', level: 1 },
  // 7 The Whispering Vault: F♯ minor, very quiet: breathy whispers, a soft pulse and rare chimes
  7: { chords: [[54, 57, 61], [54, 57, 62], [54, 59, 62], [54, 57, 61]], roots: [54, 50, 47, 54], scale: [57, 59, 61, 64, 66, 69, 71, 73, 76],
    bpm: 64, drums: 'whisper', plucks: [4, 12], pluckChance: 0.4, arpEvery: 4, arpChance: 0.55, bellLen: 2.2, echo: 0.6, pad: 'warm', texture: 'breath', level: 0.8 },
  // 8 The Steam Halls: G minor, Gm – E♭ – B♭ – F, a steady steam-engine chuff, low plucks and a hiss now and then
  8: { chords: [[55, 58, 62], [55, 58, 63], [53, 58, 62], [53, 57, 60]], roots: [43, 39, 46, 41], scale: [58, 60, 62, 65, 67, 70, 72, 74, 77],
    bpm: 96, drums: 'chuff', plucks: [0, 4, 8, 12], pluckChance: 0.6, pluckOctave: -12, arpEvery: 4, arpChance: 0.8, bellLen: 1, echo: 0.35, pad: 'warm',
    texture: 'hiss', level: 0.95 },
  // 9 The Heart of the Temple: the home theme (A minor, Am – F – C – G) comes back, slower and bigger, with airy pads
  9: { chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], roots: [45, 41, 48, 43], scale: [57, 60, 62, 64, 67, 69, 72, 74, 76],
    bpm: 72, drums: 'hand', plucks: [0, 6, 8, 14], pluckChance: 0.75, arpEvery: 2, arpChance: 1, bellLen: 1.5, echo: 0.5, pad: 'flute', level: 1.05 },
};
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
  private echo: { input: GainNode; delay: DelayNode; fb: GainNode } | null = null;
  private noise: AudioBuffer | null = null;
  private chapter = 1;
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
    this.echo = { input, delay, fb };
    // 2 s of white noise for wind and whispers
    this.noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.retune();
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
    this.retune();
    this.applyMix();
  }

  /** The chapter whose tune plays in levels (9.3). Homemade levels and test rooms use Chapter 1's. */
  setChapter(chapter: number): void {
    const ch = TUNES[chapter] ? chapter : 1;
    if (ch === this.chapter) return;
    this.chapter = ch;
    this.retune();
    this.applyMix();
  }

  /** A gem's note: the playing tune's scale, climbing with the combo (15.4: gems are in the music's key). */
  gemNote(combo: number): number {
    const sc = this.tune.scale, j = combo + 3;
    return hz(sc[j % 5] + 12 * Math.floor(j / 5));
  }

  private get tune(): Tune {
    return this.mode === 'level' ? TUNES[this.chapter] : TUNES[1];
  }

  /** Speed and echo for the current mode and tune. */
  private retune(): void {
    this.bpm = this.mode === 'level' ? this.tune.bpm : this.mode === 'map' ? 80 : 76;
    if (!this.ac || !this.echo) return;
    const t = this.ac.currentTime;
    this.echo.delay.delayTime.setTargetAtTime((60 / this.bpm) * 0.75, t, 0.1);
    this.echo.fb.gain.setTargetAtTime(this.tune.echo, t, 0.1);
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
      const k = this.tune.level;
      base *= k;
      fire = (0.12 + 0.8 * this.moveFire) * k;
      water = (0.12 + 0.8 * this.moveWater) * k;
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
    const tune = this.tune;
    const bar = Math.floor(s / 16);
    const i = s % 16;
    const chord = tune.chords[bar % tune.chords.length];
    const root = tune.roots[bar % tune.roots.length];
    const calm = this.mode !== 'level';
    const barLen = (60 / this.bpm) * 4;

    // --- base: drone + pad, changes with each bar, plus the chapter's texture
    if (i === 0) {
      this.drone(t, hz(root - 12), barLen, L.base.gain);
      for (const n of chord) this.pad(t, hz(n), barLen, tune.pad, L.base.gain);
    }
    if (tune.texture === 'drips' && rnd(bar * 17 + i) > 0.93) this.drip(t, L.base.gain);
    if (tune.texture === 'wind' && i === 0 && bar % 2 === 0) this.whoosh(t, barLen * 2, 500, 0.6, 0.05, L.base.gain);
    if (tune.texture === 'breath' && i % 8 === 0 && rnd(bar * 3 + i) > 0.55) this.whoosh(t, barLen * 0.6, 2400, 2.5, 0.035, L.base.gain);
    if (tune.texture === 'hiss' && i === 6 && bar % 2 === 1) this.whoosh(t, barLen * 0.4, 3600, 1.2, 0.025, L.base.gain);

    // --- fire: drums + plucks
    this.drums(calm ? 'calm' : tune.drums, bar, i, t, L.fire.gain);
    const pluckSteps = calm ? [0, 6, 12] : tune.plucks;
    if (pluckSteps.includes(i) && rnd(bar * 31 + i) < (calm ? 0.65 : tune.pluckChance)) {
      const k = pluckSteps.indexOf(i);
      const n = tune.ostinato && !calm ? tune.scale[tune.ostinato[(k + (bar % 2) * 4) % tune.ostinato.length]]
        : tune.chordPlucks ? chord[Math.floor(rnd(bar * 13 + i * 3) * 3)] + 12
        : tune.scale[Math.floor(rnd(bar * 13 + i * 3) * 6)];
      this.pluck(t, hz(n + (calm ? 0 : tune.pluckOctave ?? 0)), 0.35, 0.09, L.fire.gain);
    }

    // --- water: arpeggio chimes with echo
    const every = calm ? 4 : tune.arpEvery;
    if (i % every === 0 && (calm || rnd(bar * 41 + i) < tune.arpChance)) {
      const k = Math.floor(i / every);
      const up = [0, 1, 2, 1, 2, 0, 1, 2][k % 8];
      const n = chord[up] + 12 + (k % 4 === 3 ? 12 : 0);
      const len = calm ? 1.4 : tune.bellLen, vol = calm ? 0.05 : 0.04;
      this.bell(t, hz(n), len, vol, this.echo!.input);
      this.bell(t, hz(n), len, vol, L.water.gain);
    }
    if (i === 0 && rnd(bar * 5) > 0.4) this.bell(t, hz(tune.scale[5 + Math.floor(rnd(bar) * 4)] + 12), 2, 0.035, L.water.gain);
  }

  /** Hot Boy's drum part for one 16th step. */
  private drums(kind: Tune['drums'] | 'calm', bar: number, i: number, t: number, dest: AudioNode): void {
    switch (kind) {
      case 'calm':
        if (i === 0 || i === 10) this.drum(t, i === 0 ? 1 : 0.6, true, dest);
        if (i === 8) this.drum(t, 0.4, false, dest);
        break;
      case 'hand':
        if ([0, 6, 10, 14].includes(i)) this.drum(t, i === 0 ? 1 : 0.6, true, dest);
        if (i % 4 === 2) this.drum(t, 0.4, false, dest);
        if (i === 15 && rnd(bar * 7) > 0.5) this.drum(t, 0.3, false, dest);
        break;
      case 'soft':
        if (i === 0) this.drum(t, 0.7, true, dest);
        if (i === 10) this.drum(t, 0.4, true, dest);
        break;
      case 'clock':
        if (i === 0 || i === 8) this.drum(t, 0.8, true, dest);
        if (i % 2 === 0) this.click(t, i % 4 === 0 ? 1900 : 1400, 0.5, dest); // tick, tock
        break;
      case 'sparse':
        if (i === 0 && bar % 2 === 0) this.drum(t, 0.6, true, dest);
        if (i === 12) this.drum(t, 0.3, false, dest);
        break;
      case 'heavy':
        if (i === 0) this.drum(t, 1, true, dest, true);
        if (i === 3) this.drum(t, 0.6, true, dest, true);
        if (i === 8) this.drum(t, 0.8, true, dest, true);
        if (i === 12) this.drum(t, 0.35, false, dest);
        break;
      case 'whisper':
        if (i === 0 && bar % 2 === 0) this.drum(t, 0.4, true, dest);
        break;
      case 'chuff':
        // a steam engine: a soft thump on the beat and a short breathy "chuff" on every quarter
        if (i === 0 || i === 8) this.drum(t, i === 0 ? 0.8 : 0.5, true, dest);
        if (i % 4 === 0) this.whoosh(t, 0.12, i % 8 === 0 ? 1500 : 1900, 0.9, i % 8 === 0 ? 0.05 : 0.035, dest);
        break;
    }
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

  /** Soft pad: warm (triangle), or flute (sine with a slow breath in and a gentle vibrato). */
  private pad(t: number, f: number, dur: number, kind: Tune['pad'], dest: AudioNode): void {
    const ac = this.ac!;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = kind === 'flute' ? 'sine' : 'triangle';
    o.frequency.value = f;
    o.detune.value = (Math.random() - 0.5) * 8;
    if (kind === 'flute') {
      const lfo = ac.createOscillator();
      const depth = ac.createGain();
      lfo.frequency.value = 4.5 + Math.random();
      depth.gain.value = 9; // cents
      lfo.connect(depth).connect(o.detune);
      lfo.start(t);
      lfo.stop(t + dur + 0.7);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(kind === 'flute' ? 0.028 : 0.022, t + (kind === 'flute' ? 1.4 : 0.8));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.6);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.7);
  }

  /** Hand drum: low (tom) or high (conga slap); `deep`: a big, slow ancient drum (Chapter 6). */
  private drum(t: number, vel: number, low: boolean, dest: AudioNode, deep = false): void {
    const ac = this.ac!;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(deep ? 110 : low ? 150 : 330, t);
    o.frequency.exponentialRampToValueAtTime(deep ? 42 : low ? 62 : 210, t + (deep ? 0.3 : low ? 0.18 : 0.08));
    this.env(g, t, 0.004, (deep ? 0.36 : low ? 0.3 : 0.14) * vel, deep ? 0.55 : low ? 0.32 : 0.14);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + (deep ? 0.6 : 0.4));
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

  /** Clockwork tick: a tiny, bright click. */
  private click(t: number, f: number, vel: number, dest: AudioNode): void {
    const ac = this.ac!;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'square';
    o.frequency.value = f;
    this.env(g, t, 0.001, 0.025 * vel, 0.035);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + 0.05);
  }

  /** A water drop: a short high note that falls, with an echo. */
  private drip(t: number, dest: AudioNode): void {
    const ac = this.ac!;
    const o = ac.createOscillator();
    const g = ac.createGain();
    const f = 1100 + Math.random() * 700;
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.5, t + 0.07);
    this.env(g, t, 0.002, 0.03, 0.12);
    o.connect(g);
    g.connect(dest);
    g.connect(this.echo!.input);
    o.start(t);
    o.stop(t + 0.15);
  }

  /** Filtered noise that swells and fades: wind (low, wide) or a whisper (high, narrow). */
  private whoosh(t: number, dur: number, freq: number, q: number, vol: number, dest: AudioNode): void {
    const ac = this.ac!;
    if (!this.noise) return;
    const src = ac.createBufferSource();
    const bp = ac.createBiquadFilter();
    const g = ac.createGain();
    src.buffer = this.noise;
    src.loop = true;
    bp.type = 'bandpass';
    bp.Q.value = q;
    bp.frequency.setValueAtTime(freq * 0.8, t);
    bp.frequency.linearRampToValueAtTime(freq * 1.25, t + dur * 0.5);
    bp.frequency.linearRampToValueAtTime(freq, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(dest);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.05);
  }

  stop(): void {
    clearInterval(this.timer);
  }
}

export const music = new Music();
