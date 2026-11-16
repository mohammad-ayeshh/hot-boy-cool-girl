// Solo test (?solo, or ?solo=6-4 to start on a level): the owner tries every official level alone on one
// phone or PC. Both characters are on this device and you swap between them; the level plays by the real rules
// (a death restarts it, both in their doors wins it). Nothing here counts as real progress, stars or a team code.
import * as device from '../engine/device';
import * as sfx from '../engine/sfx';
import { music } from '../engine/music';
import type { Elem } from '../game/level';
import type { Animal } from '../game/mechanisms';
import { ALL_LEVELS, CHAPTERS, FINALE_ID, findLevel, levelData, type LevelDef } from '../game/levels';
import { starsFor } from '../game/progress';
import { load } from '../game/settings';
import { randomCode } from '../game/teamCode';
import { canPlay, ownsGame } from '../game/unlock';
import { Stage, createApp } from '../play/stage';

const NAMES: Record<Elem, string> = { fire: '🔥 Hot Boy', water: '💧 Cool Girl' };
const ANIMAL_ICON: Record<Animal, string> = { snake: '🐍', monkey: '🐒', jaguar: '🐆', frog: '🐸', bird: '🐦', fish: '🐟', bat: '🦇', turtle: '🐢' };
const CHECKED_KEY = 'hbcg.soloChecked.v1';
/** Opening the solo test once shows its button in Settings on this device from then on. */
const TESTER_KEY = 'hbcg.tester.v1';
const $ = <E extends HTMLElement>(id: string) => document.getElementById(id) as E;

function loadChecked(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(CHECKED_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}
function saveChecked(s: Set<string>): void {
  try { localStorage.setItem(CHECKED_KEY, JSON.stringify([...s])); } catch { /* storage blocked: marks last this visit only */ }
}

export async function startSoloTest(): Promise<void> {
  try { localStorage.setItem(TESTER_KEY, '1'); } catch { /* fine */ } // read by isTester() in online/game.ts
  const settings = load();
  const app = await createApp();
  // the paywall still applies once it's switched on (the levels behind it stay locked here too)
  const open = (l: LevelDef) => l.rows !== null && canPlay(l.id, ownsGame());
  const playable = ALL_LEVELS.filter(open);
  const asked = findLevel(new URLSearchParams(location.search).get('solo') ?? '');
  let level: LevelDef = asked && open(asked) ? asked : playable[0];
  // one random code per password chapter for this visit, so the carvings in levels 1–4 match the vault
  const codes = new Map<number, Animal[]>();
  const codeFor = (l: LevelDef) => {
    if (!l.teamCode) return undefined;
    if (!codes.has(l.teamCode)) codes.set(l.teamCode, randomCode());
    return codes.get(l.teamCode);
  };
  const checked = loadChecked();
  let followEyes = true; // see what the character you control sees (different eyes), or everything
  let restartTimer = 0;
  let won = false;

  const stage = new Stage(app, settings, levelData(level, codeFor(level)), {
    sandbox: false,
    hooks: {
      localDeath: () => {
        if (restartTimer) return;
        music.duck();
        restartTimer = window.setTimeout(() => { restartTimer = 0; stage.restart(); }, 1300);
      },
    },
  });
  stage.setLocal({ fire: true, water: true });

  const ui = $('ui');
  ui.innerHTML = `
    <div class="lab-hud solo-hud">
      <button id="solo-levels" class="hud-btn" title="All levels (L)">☰</button>
      <button id="solo-prev" class="hud-btn" title="Previous level (P)">◀</button>
      <span id="solo-name" class="hud-btn solo-name"></span>
      <button id="solo-next" class="hud-btn" title="Next level (N)">▶</button>
      <button id="solo-swap" class="hud-btn" title="Swap character (Q / Tab)"></button>
      <button id="solo-eyes" class="hud-btn" title="Whose eyes (E)"></button>
      <button id="solo-reset" class="hud-btn" title="Restart (R)">↺</button>
    </div>
    <div class="overlay hidden" id="solo-menu"><div class="panel wide solo-panel" id="solo-menu-body"></div></div>
    <div class="overlay hidden" id="solo-done"><div class="panel" id="solo-done-body"></div></div>
    <div class="overlay" id="solo-start">
      <div class="panel">
        <h1><span class="hot">Hot Boy</span> &amp; <span class="cool">Cool Girl</span></h1>
        <h2>Solo test</h2>
        <p>Play every level alone: you control one character at a time and <b>swap</b> to the other. A death restarts the level, and the level is won when both stand in their doors.</p>
        <p>Nothing here counts as real progress or stars.</p>
        <button class="primary" id="solo-go">Tap to start</button>
        <p class="small">PC: arrows / A D walk · Space / W jump · Q swap · R restart · N / P next / previous · L all levels · E whose eyes</p>
      </div>
    </div>
    <div class="rotate-msg"><div>📱↻<br/>Turn your phone sideways</div></div>`;

  const swapBtn = $('solo-swap');
  const eyesBtn = $('solo-eyes');

  function refreshHud(): void {
    const c = stage.controlled ?? 'water';
    swapBtn.textContent = NAMES[c];
    swapBtn.classList.toggle('hot', c === 'fire');
    swapBtn.classList.toggle('cool', c === 'water');
    const eyes = !!level.seen || !!level.mechs?.some((m) => m.seen);
    eyesBtn.classList.toggle('hidden', !eyes); // only levels with different eyes need it
    eyesBtn.textContent = followEyes ? `👁 ${c === 'fire' ? '🔥' : '💧'} eyes` : '👁 all';
    stage.setViewer(followEyes && eyes ? c : null);
    $('solo-name').textContent = `${checked.has(level.id) ? '✓ ' : ''}${level.id} ${level.name}`;
  }

  function play(l: LevelDef): void {
    level = l;
    won = false;
    clearTimeout(restartTimer);
    restartTimer = 0;
    stage.setViewer(null);
    stage.setLevel(levelData(l, codeFor(l)));
    music.setMode('level');
    $('solo-done').classList.add('hidden');
    $('solo-menu').classList.add('hidden');
    refreshHud();
    history.replaceState(null, '', `?solo=${l.id}`);
  }
  const step = (d: number) => {
    const i = playable.indexOf(level) + d;
    if (i >= 0 && i < playable.length) play(playable[i]);
  };
  const swap = () => {
    stage.controlled = stage.controlled === 'fire' ? 'water' : 'fire';
    stage.controls.reset();
    stage.showMarker();
    refreshHud();
  };
  const restart = () => {
    clearTimeout(restartTimer);
    restartTimer = 0;
    won = false;
    $('solo-done').classList.add('hidden');
    stage.restart();
  };

  function showMenu(): void {
    const body = $('solo-menu-body');
    const codeLine = (n: number) => {
      const c = codes.get(n);
      return c ? `<p class="small">This visit's code: ${c.map((a) => ANIMAL_ICON[a]).join(' ')}</p>` : '';
    };
    body.innerHTML = `
      <div class="map-head"><span></span><h2>🧪 All levels</h2><button id="solo-close">✕</button></div>
      <p class="small">✓ = you've finished it here. ${checked.size} of ${playable.length} done.</p>
      ${CHAPTERS.map((ch) => `
        <div class="map-chapter">Chapter ${ch.n} · ${ch.name}</div>
        ${ch.levels[0]?.teamCode ? codeLine(ch.n) : ''}
        <div class="solo-row">${ch.levels.map((l) => `<button class="solo-lvl ${l === level ? 'on' : ''} ${checked.has(l.id) ? 'done' : ''}" data-id="${l.id}" ${open(l) ? '' : 'disabled'} title="${l.name}">
          <b>${checked.has(l.id) ? '✓ ' : ''}${l.id}</b><small>${l.name}</small></button>`).join('')}</div>`).join('')}
      <div class="row"><button id="solo-clear">Clear the ✓ marks</button><a class="small" href="./">Main menu</a></div>`;
    $('solo-menu').classList.remove('hidden');
    $('solo-close').addEventListener('click', () => $('solo-menu').classList.add('hidden'));
    $('solo-clear').addEventListener('click', () => { checked.clear(); saveChecked(checked); showMenu(); refreshHud(); });
    for (const b of body.querySelectorAll<HTMLButtonElement>('.solo-lvl')) {
      b.addEventListener('click', () => { const l = findLevel(b.dataset.id!); if (l) play(l); });
    }
  }

  function finish(): void {
    won = true;
    const last = level.id === FINALE_ID; // the story's ending (16.12), not the last Trial
    stage.celebrate(last);
    const g = stage.gemCount();
    const time = Math.round(stage.levelTime * 10) / 10;
    const stars = starsFor(g.got === g.total, time, level.targetTime);
    checked.add(level.id);
    saveChecked(checked);
    refreshHud();
    setTimeout(() => {
      if (!won) return;
      music.jingle(stars);
      const next = playable[playable.indexOf(level) + 1];
      $('solo-done-body').innerHTML = `
        <h2>✓ ${level.id} ${level.name}</h2>
        <div class="stars">${[0, 1, 2].map((i) => `<span class="star ${i < stars ? 'on' : ''}">★</span>`).join('')}</div>
        <p>⏱ ${time.toFixed(1)} s (3 stars under ${level.targetTime} s) · 💎 ${g.got}/${g.total}</p>
        <div class="row">
          <button id="solo-again">↺ Again</button>
          ${next ? `<button class="primary" id="solo-nextlvl">Next: ${next.id} ▶</button>` : '<button class="primary" id="solo-all">All levels</button>'}
        </div>`;
      $('solo-done').classList.remove('hidden');
      $('solo-again').addEventListener('click', restart);
      if (next) $('solo-nextlvl').addEventListener('click', () => play(next));
      else $('solo-all').addEventListener('click', showMenu);
    }, 1400);
  }

  swapBtn.addEventListener('click', swap);
  eyesBtn.addEventListener('click', () => { followEyes = !followEyes; refreshHud(); });
  $('solo-reset').addEventListener('click', restart);
  $('solo-prev').addEventListener('click', () => step(-1));
  $('solo-next').addEventListener('click', () => step(1));
  $('solo-levels').addEventListener('click', showMenu);
  $('solo-go').addEventListener('click', () => {
    device.unlock();
    sfx.configure(settings.sound, settings.volume);
    music.start();
    music.configure(settings.music, settings.musicVolume);
    music.setMode('level');
    $('solo-start').classList.add('hidden');
    if (device.canFullscreen() && !device.isStandalone() && matchMedia('(pointer: coarse)').matches) device.enterFullscreenLandscape().catch(() => {});
  });
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement) return;
    if (e.code === 'KeyQ' || e.code === 'Tab') { e.preventDefault(); swap(); }
    else if (e.code === 'KeyR') restart();
    else if (e.code === 'KeyN') step(1);
    else if (e.code === 'KeyP') step(-1);
    else if (e.code === 'KeyL') showMenu();
    else if (e.code === 'KeyE') eyesBtn.click();
    else if (e.code === 'Escape') { $('solo-menu').classList.add('hidden'); }
  });
  // Tapping the UI must not leave a stuck touch.
  ui.addEventListener('pointerdown', () => stage.controls.reset());
  setInterval(() => music.setMovement(stage.movement('fire'), stage.movement('water')), 100);
  // both alive and standing in their own doors: the level is won
  setInterval(() => {
    if (!won && !restartTimer && stage.atDoor('fire') && stage.atDoor('water')) finish();
  }, 100);

  stage.controlled = 'fire';
  swap(); // starts as Cool Girl, like the Feel Lab
  play(level);
  if (import.meta.env.DEV) Object.assign(window, { __solo: { stage, play, swap, get level() { return level; } } });
}
