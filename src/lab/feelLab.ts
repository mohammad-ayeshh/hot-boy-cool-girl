// The Feel Lab (design doc 8.1): the metrics room with both characters and an on-phone panel where
// every game-feel effect can be switched on/off and tuned. Single phone, no network: you control
// one character at a time and can swap. Values found here go back into the design doc.
import * as device from '../engine/device';
import * as sfx from '../engine/sfx';
import type { Phys, JumpStats } from '../game/body';
import type { Elem } from '../game/level';
import { labLevel } from '../game/labLevel';
import { load, save, type Key } from '../game/settings';
import { Stage, createApp } from '../play/stage';
import { Panel } from './panel';

const NAMES: Record<Elem, string> = { fire: '🔥 Hot Boy', water: '💧 Cool Girl' };
const $ = <E extends HTMLElement>(id: string) => document.getElementById(id) as E;

export async function startFeelLab(): Promise<void> {
  const settings = load();
  const app = await createApp();
  const stage = new Stage(app, settings, labLevel(), { sandbox: true });
  stage.setLocal({ fire: true, water: true });
  stage.hintZones();

  const ui = $('ui');
  ui.innerHTML = `
    <div class="stats" id="lab-stats"></div>
    <div class="lab-hud">
      <button id="lab-swap" class="hud-btn" title="Swap character (Q)"></button>
      <button id="lab-gear" class="hud-btn" title="Feel Lab settings (Esc)">⚙️ Feel Lab</button>
      <button id="lab-reset" class="hud-btn" title="Back to start (R)">↺</button>
    </div>
    <div class="overlay" id="lab-start">
      <div class="panel">
        <h1><span class="hot">Hot Boy</span> &amp; <span class="cool">Cool Girl</span></h1>
        <h2>Feel Lab</h2>
        <p><b>Left thumb:</b> slide to walk. <b>Right thumb:</b> tap to hop, hold to jump higher.</p>
        <p>Tap <b>⚙️ Feel Lab</b> to switch effects on and off and tune the numbers. Tap <b>🔥/💧</b> to swap characters.</p>
        <button class="primary" id="lab-go">Tap to start</button>
        <p class="small">PC: arrows / A D to walk · Space / W to jump · Q swap · R restart · Esc settings</p>
      </div>
    </div>
    <div class="rotate-msg"><div>📱↻<br/>Turn your phone sideways</div></div>`;
  const statsEl = $('lab-stats');
  const swapBtn = $('lab-swap');

  const panel = new Panel(ui, settings, {
    onChange: (k) => apply(k),
    onBulk: () => apply(null),
  });

  let saveTimer = 0;
  function apply(k: Key | null): void {
    stage.applySettings();
    statsEl.classList.toggle('hidden', !settings.stats);
    if (k === 'showZones') stage.hintZones();
    panel.setReadout(readout(stage.stats, stage.phys));
    clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => save(settings), 300);
  }

  const swap = () => {
    stage.controlled = stage.controlled === 'fire' ? 'water' : 'fire';
    swapBtn.textContent = NAMES[stage.controlled];
    swapBtn.classList.toggle('hot', stage.controlled === 'fire');
    swapBtn.classList.toggle('cool', stage.controlled === 'water');
    stage.controls.reset();
    stage.showMarker();
  };
  stage.controlled = 'water';
  swap();

  swapBtn.addEventListener('click', swap);
  $('lab-reset').addEventListener('click', () => stage.restart());
  $('lab-gear').addEventListener('click', () => panel.toggle());
  $('lab-go').addEventListener('click', () => {
    device.unlock();
    sfx.configure(settings.sound, settings.volume);
    $('lab-start').classList.add('hidden');
    if (device.canFullscreen() && !device.isStandalone() && matchMedia('(pointer: coarse)').matches) device.enterFullscreenLandscape().catch(() => {});
  });
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement) return;
    if (e.code === 'KeyQ' || e.code === 'Tab') { e.preventDefault(); swap(); }
    else if (e.code === 'KeyR') stage.restart();
    else if (e.code === 'Escape' || e.code === 'Backquote') panel.toggle();
  });
  // Tapping the UI must not leave a stuck touch.
  ui.addEventListener('pointerdown', () => stage.controls.reset());
  setInterval(() => { statsEl.textContent = `${Math.round(stage.fps)} fps · ${stage.particleCount} particles`; }, 500);

  apply(null);
  // Dev-only handle for automated checks in the browser console (not in the published build).
  if (import.meta.env.DEV) Object.assign(window, { __lab: { stage, settings, swap, apply } });
}

function readout(s: JumpStats, p: Phys): string {
  const ok = (good: boolean, yes: string, no: string) => `<li class="${good ? 'ok' : 'bad'}">${good ? '✅' : '❌'} ${good ? yes : no}</li>`;
  const f = (v: number) => v.toFixed(2);
  return `
    <div><b>Full jump</b> ${f(s.maxHeight)} tiles high · <b>tap</b> ${f(s.minHeight)} · <b>air time</b> ${f(s.airTime)} s</div>
    <div><b>Longest jump</b> ${f(s.maxGap)} tiles gap (${f(s.maxGapCoyote)} using every helper)</div>
    <ul>
      ${ok(s.maxHeight >= 3.2, '3-tile ledge: reachable', '3-tile ledge: out of reach')}
      ${ok(s.maxHeight + p.ledgeNudge < 4, '4+ tile wall: can\'t be climbed', '4-tile wall can be climbed')}
      ${ok(s.maxGap >= 4.3, `4-tile gap: possible (${f(s.maxGap - 4)} spare)`, '4-tile gap: too tight')}
      ${ok(s.maxGapCoyote < 6, '6-tile gap: impossible', '6-tile gap can be jumped')}
    </ul>
    <p class="small">These are the level rules in the design doc (7.7). A ❌ means the levels would need to change.</p>`;
}
