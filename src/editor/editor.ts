// The level designer's editing screen (design doc 16.3). The level is drawn by the real game Stage
// (physics paused), so it looks exactly like it will in play; this file adds the toolbars, touch
// painting, undo, the built-in checks and "Try alone" (both characters on one phone, never verifies).
import { COLS, ROWS, parseLevel, type Elem } from '../game/level';
import type { Rune } from '../game/mechanisms';
import { isVerified, NAME_MAX, RUNES, type CustomLevel } from '../game/custom';
import { checkLevel, hasErrors, type Issue } from '../game/levelCheck';
import { saveLevel } from '../game/myLevels';
import type { Stage } from '../play/stage';
import { T } from '../render/world';
import { BRUSH, MAX_PLATFORM, addGate, addPlatform, box, mechAt, paint, setPlatformTarget, toggleSwitch, type Tool } from './tools';

export interface EditorHost {
  stage: Stage;
  root: HTMLElement;
  toast(text: string, ms?: number): void;
  /** Back to the My levels list. */
  exit(): void;
}

const RUNE_ICON: Record<Rune, string> = { circle: '○', triangle: '△', square: '□', star: '☆' };
const NAMES: Record<Elem, string> = { fire: '🔥 Hot Boy', water: '💧 Cool Girl' };
const GOLD = 0xf2c35b;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

interface ToolInfo { id: Tool; icon: string; label: string; hint: string }
const TOOLS: (ToolInfo | '|')[] = [
  { id: 'stone', icon: '<i class="sw sw-stone"></i>', label: 'Stone', hint: 'Stone: drag to paint walls and floors.' },
  { id: 'erase', icon: '✖', label: 'Erase', hint: 'Erase: drag to clear tiles. Also removes buttons, levers, platforms and gates.' },
  { id: 'lava', icon: '<i class="sw sw-lava"></i>', label: 'Lava', hint: 'Lava: safe for Hot Boy, deadly for Cool Girl.' },
  { id: 'water', icon: '<i class="sw sw-water"></i>', label: 'Water', hint: 'Water: safe for Cool Girl, deadly for Hot Boy.' },
  { id: 'poison', icon: '<i class="sw sw-poison"></i>', label: 'Poison', hint: 'Poison: deadly for both.' },
  '|',
  { id: 'gemFire', icon: '<span class="c-fire">◆</span>', label: 'Gem', hint: 'Tap to place a fire gem (Hot Boy collects it).' },
  { id: 'gemWater', icon: '<span class="c-water">◆</span>', label: 'Gem', hint: 'Tap to place a water gem (Cool Girl collects it).' },
  '|',
  { id: 'startFire', icon: '🔥', label: 'Start', hint: 'Tap where Hot Boy starts.' },
  { id: 'startWater', icon: '💧', label: 'Start', hint: 'Tap where Cool Girl starts.' },
  { id: 'doorFire', icon: '<span class="door c-fire">▯</span>', label: 'Door', hint: 'Tap where Hot Boy’s door stands.' },
  { id: 'doorWater', icon: '<span class="door c-water">▯</span>', label: 'Door', hint: 'Tap where Cool Girl’s door stands.' },
  '|',
  { id: 'button', icon: '⏺', label: 'Button', hint: 'Tap a floor tile for a button: powered while someone stands on it. Tap again to remove.' },
  { id: 'lever', icon: '⟋', label: 'Lever', hint: 'Tap a floor tile for a lever: stays where it was pushed. Tap again to remove.' },
  { id: 'platform', icon: '▬', label: 'Platform', hint: `Platform: drag sideways for its width (up to ${MAX_PLATFORM}), then tap where it moves to.` },
  { id: 'gate', icon: '▮', label: 'Gate', hint: 'Gate: drag a box. It slides open while its rune is powered.' },
];

export function openEditor(host: EditorHost, level: CustomLevel): { close(): void } {
  const { stage } = host;
  const canvas = stage.app.canvas;
  let tool: Tool = 'stone';
  let rune: Rune = 'circle';
  let trying = false;
  let editOk = !isVerified(level); // changing a ✅ level asks first
  const undo: string[] = [];
  const redo: string[] = [];
  let pendingPlatform = -1;
  let issues: Issue[] = checkLevel(level);

  // ---------------------------------------------------------------- DOM
  const el = document.createElement('div');
  el.className = 'editor';
  el.innerHTML = `
    <div class="ed-bar ed-left">${TOOLS.map((t) => t === '|' ? '<hr/>' : `<button class="ed-btn" data-tool="${t.id}">${t.icon}<small>${t.label}</small></button>`).join('')}</div>
    <div class="ed-bar ed-right">
      <button class="ed-btn" data-ed="undo">↶<small>Undo</small></button>
      <button class="ed-btn" data-ed="redo">↷<small>Redo</small></button>
      <button class="ed-btn ed-rune" data-ed="rune"></button>
      <button class="ed-btn" data-ed="zoom">🔍<small>Zoom</small></button>
      <button class="ed-btn ed-check" data-ed="issues"></button>
      <button class="ed-btn primary" data-ed="try">▶<small>Try</small></button>
      <button class="ed-btn" data-ed="done">✔<small>Done</small></button>
    </div>
    <button class="ed-title hud-btn" data-ed="rename"></button>
    <div class="ed-try hidden">
      <button class="hud-btn" data-ed="swap"></button>
      <button class="hud-btn" data-ed="restart">↺ Restart</button>
      <button class="hud-btn" data-ed="stoptry">✎ Back to editing</button>
    </div>
    <div class="overlay hidden ed-pop"></div>`;
  host.root.appendChild(el);
  const q = <E extends HTMLElement>(s: string) => el.querySelector(s) as E;
  const left = q<HTMLElement>('.ed-left'), right = q<HTMLElement>('.ed-right'), pop = q<HTMLElement>('.ed-pop');

  function updateUi(): void {
    el.querySelectorAll<HTMLElement>('[data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === tool));
    q<HTMLElement>('.ed-rune').innerHTML = `<span class="rune">${RUNE_ICON[rune]}</span><small>Rune</small>`;
    const errs = issues.filter((i) => i.error).length, warns = issues.length - errs;
    const chk = q<HTMLElement>('.ed-check');
    chk.innerHTML = errs ? `⛔${errs}<small>Problems</small>` : warns ? `⚠${warns}<small>Tips</small>` : `✓<small>Checks</small>`;
    chk.className = `ed-btn ed-check ${errs ? 'bad' : warns ? 'meh' : 'good'}`;
    q<HTMLButtonElement>('[data-ed="undo"]').disabled = !undo.length;
    q<HTMLButtonElement>('[data-ed="redo"]').disabled = !redo.length;
    q<HTMLElement>('.ed-title').textContent = `✎ ${level.name}  ${isVerified(level) ? '✅' : '· not verified'}`;
    q<HTMLElement>('[data-ed="zoom"]').innerHTML = `🔍<small>${stage.view.zoom > 1 ? '1×' : '2×'}</small>`;
    q<HTMLElement>('[data-ed="swap"]').textContent = `⇄ ${stage.controlled ? NAMES[stage.controlled] : ''}`;
  }

  /** Keep the level clear of the two toolbars. */
  function applyInsets(): void {
    if (trying) stage.insets = { left: 0, right: 0 };
    else {
      const l = left.getBoundingClientRect(), r = right.getBoundingClientRect();
      stage.insets = { left: l.right + 6, right: window.innerWidth - r.left + 6 };
    }
    stage.relayout();
    clampPan();
  }
  const onResize = () => requestAnimationFrame(applyInsets);
  window.addEventListener('resize', onResize);

  // ---------------------------------------------------------------- drawing
  let redrawQueued = false;
  function refresh(): void {
    if (redrawQueued) return;
    redrawQueued = true;
    requestAnimationFrame(() => {
      redrawQueued = false;
      stage.setLevel(parseLevel(level.rows, level.mechs), true);
      issues = checkLevel(level);
      drawOverlay();
      updateUi();
    });
  }

  let preview: { x: number; y: number; w: number; h: number } | null = null;
  function drawOverlay(): void {
    const g = stage.overlay.clear();
    if (trying) return;
    for (let x = 1; x < COLS; x++) g.moveTo(x * T, T).lineTo(x * T, (ROWS - 1) * T);
    for (let y = 1; y < ROWS; y++) g.moveTo(T, y * T).lineTo((COLS - 1) * T, y * T);
    g.stroke({ width: 1, color: 0xffffff, alpha: 0.07 });
    // thumb corners (5.3): keep them simple
    for (const x0 of [0, COLS - 4]) g.rect(x0 * T, (ROWS - 4) * T, 4 * T, 4 * T).fill({ color: 0xffffff, alpha: 0.04 }).stroke({ width: 2, color: 0xffffff, alpha: 0.18 });
    // where each platform travels to
    level.mechs.forEach((m, i) => {
      if (m.kind !== 'platform') return;
      const pending = i === pendingPlatform;
      const ax = (m.x + m.w / 2) * T, ay = (m.y + 0.25) * T, bx = (m.to[0] + m.w / 2) * T, by = (m.to[1] + 0.25) * T;
      if (!pending && (ax !== bx || ay !== by)) {
        g.moveTo(ax, ay).lineTo(bx, by).stroke({ width: 2, color: GOLD, alpha: 0.45 });
        g.rect(m.to[0] * T, m.to[1] * T, m.w * T, T * 0.5).stroke({ width: 2, color: GOLD, alpha: 0.8 });
      }
      if (pending) g.rect(m.x * T - 3, m.y * T - 3, m.w * T + 6, T * 0.5 + 6).stroke({ width: 3, color: 0xffffff, alpha: 0.9 });
    });
    if (preview) g.rect(preview.x * T, preview.y * T, preview.w * T, preview.h * T).fill({ color: GOLD, alpha: 0.3 }).stroke({ width: 2, color: GOLD });
    for (const i of issues) {
      if (i.x === undefined || i.y === undefined) continue;
      g.circle((i.x + 0.5) * T, (i.y + 0.5) * T, T * 0.62).stroke({ width: 3, color: i.error ? 0xff5a5a : 0xffd24a, alpha: 0.9 });
    }
  }

  // ---------------------------------------------------------------- history + saving
  const snap = () => JSON.stringify({ rows: level.rows, mechs: level.mechs });
  function restore(s: string): void {
    const o = JSON.parse(s);
    level.rows = o.rows;
    level.mechs = o.mechs;
  }
  function save(): void {
    level.updated = Date.now();
    if (!saveLevel(level)) host.toast('Couldn’t save on this phone (storage is full or blocked).', 4000);
  }
  function commit(before: string): void {
    if (snap() === before) return;
    undo.push(before);
    if (undo.length > 100) undo.shift();
    redo.length = 0;
    save();
    refresh();
  }
  function stepHistory(from: string[], to: string[]): void {
    const s = from.pop();
    if (!s) return;
    to.push(snap());
    restore(s);
    pendingPlatform = -1;
    save();
    refresh();
  }

  // ---------------------------------------------------------------- touch
  const pointers = new Map<number, { x: number; y: number }>();
  let stroke: { start: { x: number; y: number }; last: { x: number; y: number }; before: string; drag: boolean } | null = null;
  let pan: { mx: number; my: number; panX: number; panY: number } | null = null;

  const cellAt = (e: PointerEvent) => {
    const t = stage.toTile(e.clientX, e.clientY);
    return { x: Math.floor(t.x), y: Math.floor(t.y) };
  };
  const mid = () => {
    const ps = [...pointers.values()];
    return { x: (ps[0].x + ps[1].x) / 2, y: (ps[0].y + ps[1].y) / 2 };
  };
  function clampPan(): void {
    const v = stage.view;
    const mx = (COLS * stage.tilePx * (1 - 1 / v.zoom)) / 2, my = (ROWS * stage.tilePx * (1 - 1 / v.zoom)) / 2;
    v.panX = Math.max(-mx, Math.min(mx, v.panX));
    v.panY = Math.max(-my, Math.min(my, v.panY));
  }

  /** One tile touched by the brush or a tap tool. */
  function apply(x: number, y: number): boolean {
    if (BRUSH.includes(tool) || tool.startsWith('gem') || tool.startsWith('start') || tool.startsWith('door')) return paint(level, tool, x, y);
    if (tool === 'button' || tool === 'lever') return toggleSwitch(level, tool, x, y, rune);
    return false;
  }

  function onDown(e: PointerEvent): void {
    if (trying || !pop.classList.contains('hidden')) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      // Two fingers: move the view instead (undo whatever the first finger just did).
      if (stroke) { restore(stroke.before); stroke = null; preview = null; refresh(); }
      const m = mid();
      pan = { mx: m.x, my: m.y, panX: stage.view.panX, panY: stage.view.panY };
      return;
    }
    if (pointers.size > 2) return;
    const c = cellAt(e);
    if (c.x < 0 || c.y < 0 || c.x >= COLS || c.y >= ROWS) return;
    if (!editOk) { askToEditVerified(); return; }
    const before = snap();
    stroke = { start: c, last: c, before, drag: tool === 'platform' || tool === 'gate' };
    if (tool === 'platform' && pendingPlatform >= 0) {
      setPlatformTarget(level, pendingPlatform, c.x, c.y);
      pendingPlatform = -1;
      stroke.drag = false;
      host.toast('Platform ready. Give a button or lever the same rune to move it.');
    } else if (stroke.drag) {
      const i = mechAt(level, c.x, c.y);
      if (i >= 0 && level.mechs[i].kind === tool) { level.mechs.splice(i, 1); stroke.drag = false; } // tap an existing one: remove it
      else updatePreview();
    } else apply(c.x, c.y);
    refresh();
  }

  function updatePreview(): void {
    if (!stroke) return;
    const { start: s, last: l } = stroke;
    if (tool === 'gate') preview = { ...box(s.x, s.y, l.x, l.y) };
    else {
      const b = box(s.x, s.y, l.x, s.y);
      preview = { x: b.x, y: b.y, w: Math.min(MAX_PLATFORM, b.w), h: 0.5 };
    }
  }

  function onMove(e: PointerEvent): void {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pan && pointers.size >= 2) {
      const m = mid();
      stage.view.panX = pan.panX + m.x - pan.mx;
      stage.view.panY = pan.panY + m.y - pan.my;
      clampPan();
      return;
    }
    if (!stroke) return;
    const c = cellAt(e);
    if (c.x === stroke.last.x && c.y === stroke.last.y) return;
    if (stroke.drag) {
      stroke.last = c;
      updatePreview();
      drawOverlay();
    } else if (BRUSH.includes(tool)) {
      // paint every tile between the last point and this one, so fast swipes leave no holes
      const { x: x0, y: y0 } = stroke.last;
      const n = Math.max(Math.abs(c.x - x0), Math.abs(c.y - y0));
      let changed = false;
      for (let i = 1; i <= n; i++) changed = apply(Math.round(x0 + ((c.x - x0) * i) / n), Math.round(y0 + ((c.y - y0) * i) / n)) || changed;
      stroke.last = c;
      if (changed) refresh();
    }
  }

  function onUp(e: PointerEvent): void {
    if (!pointers.delete(e.pointerId)) return;
    if (pan) { if (pointers.size === 0) pan = null; return; }
    if (!stroke) return;
    const s = stroke;
    stroke = null;
    if (s.drag && preview) {
      if (tool === 'gate') addGate(level, s.start.x, s.start.y, s.last.x, s.last.y, rune);
      else {
        pendingPlatform = addPlatform(level, s.start.x, s.last.x, s.start.y, rune);
        host.toast('Now tap where the platform moves to.', 4000);
      }
    }
    preview = null;
    commit(s.before);
    refresh();
  }

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  // ---------------------------------------------------------------- popups
  function openPop(html: string): void {
    pop.innerHTML = `<div class="panel">${html}</div>`;
    pop.classList.remove('hidden');
  }
  const closePop = () => pop.classList.add('hidden');

  function askToEditVerified(): void {
    openPop(`<h2>Change a verified level?</h2>
      <p>This level is ✅ verified. Changing it removes the ✅ until you finish it together again.</p>
      <div class="row"><button class="primary" data-ed="unlock">Change it</button><button data-ed="close">Keep it as it is</button></div>`);
  }

  function showIssues(): void {
    const list = issues.length
      ? issues.map((i) => `<li class="${i.error ? 'bad' : 'meh'}">${i.error ? '⛔' : '⚠'} ${esc(i.msg)}</li>`).join('')
      : '<li class="good">✓ Everything looks good.</li>';
    openPop(`<h2>Level checks</h2>
      <ul class="ed-issues">${list}</ul>
      <p class="small">⛔ must be fixed before you can play it with a friend. ⚠ are tips from our level rules: allowed, but think twice.
      The checks can’t tell if the level can be beaten: finishing it together (✅) proves that.</p>
      <button class="primary" data-ed="close">OK</button>`);
  }

  function rename(): void {
    openPop(`<h2>Level name</h2>
      <input class="name-input" id="ed-name" maxlength="${NAME_MAX}" value="${esc(level.name)}" autocomplete="off" />
      <div class="row"><button class="primary" data-ed="savename">Save</button><button data-ed="close">Cancel</button></div>`);
    const input = q<HTMLInputElement>('#ed-name');
    input.focus();
    input.select();
  }

  // ---------------------------------------------------------------- try alone (never verifies)
  function startTry(): void {
    trying = true;
    pendingPlatform = -1;
    el.classList.add('trying');
    q<HTMLElement>('.ed-try').classList.remove('hidden');
    stage.view = { zoom: 1, panX: 0, panY: 0 };
    applyInsets();
    stage.overlay.clear();
    stage.setSandbox(true);
    stage.paused = false;
    stage.setLevel(parseLevel(level.rows, level.mechs));
    stage.setLocal({ fire: true, water: true });
    stage.controlled = 'fire';
    stage.inputEnabled = true;
    stage.showMarker();
    stage.hintZones();
    host.toast(hasErrors(issues) ? 'Trying alone. Fix the ⛔ problems before playing with a friend.' : 'Trying alone: swap characters with ⇄. Only finishing it together gives the ✅.', 4000);
    updateUi();
  }

  function stopTry(): void {
    trying = false;
    el.classList.remove('trying');
    q<HTMLElement>('.ed-try').classList.add('hidden');
    stage.setSandbox(false);
    stage.paused = true;
    stage.controlled = null;
    stage.inputEnabled = false;
    stage.controls.reset();
    stage.showHints = false;
    applyInsets();
    refresh();
  }

  // ---------------------------------------------------------------- buttons
  function onClick(ev: MouseEvent): void {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-tool], [data-ed]');
    if (!b) return;
    if (b.dataset.tool) {
      tool = b.dataset.tool as Tool;
      pendingPlatform = -1;
      const info = TOOLS.find((t) => t !== '|' && t.id === tool) as ToolInfo;
      host.toast(info.hint, 3500);
      updateUi();
      drawOverlay();
      return;
    }
    switch (b.dataset.ed) {
      case 'undo': stepHistory(undo, redo); break;
      case 'redo': stepHistory(redo, undo); break;
      case 'rune':
        rune = RUNES[(RUNES.indexOf(rune) + 1) % RUNES.length];
        host.toast(`Rune ${RUNE_ICON[rune]} ${rune}: new buttons, levers, platforms and gates get it. Same rune = linked.`, 3500);
        updateUi();
        break;
      case 'zoom':
        stage.view = stage.view.zoom > 1 ? { zoom: 1, panX: 0, panY: 0 } : { zoom: 2, panX: 0, panY: 0 };
        if (stage.view.zoom > 1) host.toast('Zoomed in: move around with two fingers.');
        updateUi();
        break;
      case 'issues': showIssues(); break;
      case 'try': startTry(); break;
      case 'stoptry': stopTry(); break;
      case 'swap':
        stage.controlled = stage.controlled === 'fire' ? 'water' : 'fire';
        stage.controls.reset();
        stage.showMarker();
        updateUi();
        break;
      case 'restart': stage.restart(); break;
      case 'done': save(); host.exit(); break;
      case 'rename': rename(); break;
      case 'savename': {
        const name = q<HTMLInputElement>('#ed-name').value.trim().slice(0, NAME_MAX);
        if (name) { level.name = name; save(); }
        closePop();
        updateUi();
        break;
      }
      case 'unlock': editOk = true; closePop(); break;
      case 'close': closePop(); break;
    }
  }
  el.addEventListener('click', onClick);
  el.addEventListener('keydown', (ev) => { if ((ev.target as HTMLElement).id === 'ed-name' && ev.key === 'Enter') q<HTMLElement>('[data-ed="savename"]').click(); });
  const onKey = (ev: KeyboardEvent) => {
    if (trying || !(ev.ctrlKey || ev.metaKey)) return;
    if (ev.key === 'z') { ev.preventDefault(); stepHistory(undo, redo); } else if (ev.key === 'y') { ev.preventDefault(); stepHistory(redo, undo); }
  };
  window.addEventListener('keydown', onKey);

  // ---------------------------------------------------------------- open
  stage.paused = true;
  stage.controlled = null;
  stage.inputEnabled = false;
  stage.view = { zoom: 1, panX: 0, panY: 0 };
  updateUi();
  applyInsets();
  refresh();
  host.toast(TOOLS[0] !== '|' ? TOOLS[0].hint : '', 3000);

  return {
    close(): void {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
      el.remove();
      stage.overlay.clear();
      stage.setSandbox(false);
      stage.paused = false;
      stage.showHints = false;
      stage.insets = { left: 0, right: 0 };
      stage.view = { zoom: 1, panX: 0, panY: 0 };
      stage.relayout();
    },
  };
}
