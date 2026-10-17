// The online game: home → invite → lobby (roles + level pick) → play → results (design doc 11–13).
// Each phone simulates only its own character; the host's phone is the referee of the world:
// it starts levels, restarts them after a death and decides when the level is complete.
import * as device from '../engine/device';
import * as sfx from '../engine/sfx';
import { music } from '../engine/music';
import type { Elem, Liquid } from '../game/level';
import { CHAPTER_1, findLevel, levelData, nextLevel, type LevelDef } from '../game/levels';
import { isUnlocked, loadName, loadProgress, recordResult, saveName, starsFor } from '../game/progress';
import { defaults } from '../game/settings';
import { Session, type SessionStatus } from '../net/session';
import { normalizeRoomCode } from '../net/room';
import { Stage, createApp, type HeroEvent, type Snapshot } from '../play/stage';

type Screen = 'home' | 'invite' | 'lobby' | 'map' | 'play' | 'results';
type Choice = 'next' | 'retry' | 'map';
interface Finish { time: number; got: number; total: number; deaths: number }

const NAMES: Record<Elem, string> = { fire: '🔥 Hot Boy', water: '💧 Cool Girl' };
const other = (e: Elem): Elem => (e === 'fire' ? 'water' : 'fire');
const $ = <E extends HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as E;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const SNAPSHOT_MS = 33; // ~30 per second (13.2)
const RESTART_DELAY_MS = 1100; // death effect, then restart for both (13.3)
const WAIT_LIMIT_MS = 120_000; // after 2 minutes of waiting, offer the way home (13.5)

export async function startGame(): Promise<void> {
  const settings = defaults();
  settings.stats = false;
  const app = await createApp();

  // ---------------------------------------------------------------- state
  let screen: Screen = 'home';
  let myElem: Elem = 'fire';
  let myName = loadName();
  let partnerName = '';
  let partnerDone: string[] = [];
  let picked = CHAPTER_1[0].id;
  let readyMe = false, readyPartner = false;
  let level: LevelDef = CHAPTER_1[0];
  let round = 0;
  let deaths = 0;
  let restartPending = false;
  let partnerAtDoor = false;
  const collected = new Set<number>();
  let myChoice: Choice | null = null, partnerChoice: Choice | null = null;
  let finish: Finish | null = null;
  let menuOpen = false;
  let lostAt = 0;
  let versionProblem = '';

  const stage = new Stage(app, settings, levelData(CHAPTER_1[0]), {
    sandbox: false,
    hooks: {
      localDeath: (_e, cause) => { music.duck(); send({ t: 'die', n: round, cause }); if (session.isHost) scheduleRestart(); },
      localGem: (_e, i) => { collected.add(i); send({ t: 'gem', n: round, i }); },
      localEvent: (_e, ev) => send({ t: 'ev', n: round, e: ev }),
      localLever: (i, on) => send({ t: 'lever', n: round, i, on }),
    },
  });
  stage.controlled = null;
  stage.setLocal({ fire: true, water: true });

  const session = new Session({ status: onStatus, message: onMessage });
  const send = (m: Record<string, unknown>) => session.send(m);

  // ---------------------------------------------------------------- UI shell
  const ui = $<HTMLElement>('#ui');
  ui.innerHTML = `
    <div class="hud hidden">
      <div class="hud-info"></div>
      <button class="hud-btn" data-act="menu" aria-label="Pause">⏸</button>
    </div>
    <button class="net-dot hidden" data-act="net" aria-label="Connection"></button>
    <div class="toast hidden"></div>
    <div class="overlay screen" id="scr"></div>
    <div class="overlay hidden" id="menu"></div>
    <div class="overlay hidden" id="lost"></div>
    <div class="rotate-msg"><div>📱↻<br/>Turn your phone sideways</div></div>`;
  const scr = $<HTMLElement>('#scr');
  const hud = $<HTMLElement>('.hud');
  const hudInfo = $<HTMLElement>('.hud-info');
  const netDot = $<HTMLElement>('.net-dot');
  const toastEl = $<HTMLElement>('.toast');
  const menuEl = $<HTMLElement>('#menu');
  const lostEl = $<HTMLElement>('#lost');

  let toastTimer = 0;
  const toast = (text: string, ms = 2500) => {
    toastEl.textContent = text;
    toastEl.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.add('hidden'), ms);
  };

  // The first touch unlocks sound and (on Android) goes fullscreen.
  let unlocked = false;
  window.addEventListener('pointerdown', () => {
    if (unlocked) return;
    unlocked = true;
    device.unlock();
    sfx.configure(settings.sound, settings.volume);
    music.start();
    music.configure(settings.music, settings.musicVolume);
    updateMusic();
    if (device.canFullscreen() && !device.isStandalone() && matchMedia('(pointer: coarse)').matches) device.enterFullscreenLandscape().catch(() => {});
  }, { capture: true });
  // Taps on menus must not leave a stuck touch on the game.
  ui.addEventListener('pointerdown', (e) => { if ((e.target as HTMLElement).closest('button, input, .overlay')) stage.controls.reset(); });

  // ---------------------------------------------------------------- screens
  function show(s: Screen): void {
    screen = s;
    const playing = s === 'play';
    scr.classList.toggle('hidden', playing);
    hud.classList.toggle('hidden', !playing);
    netDot.classList.toggle('hidden', s === 'home');
    if (!playing) { closeMenu(); stage.showHints = false; }
    render();
    updateMusic();
  }

  /** Menu music (15.4b): title on home, your own layer in the lobby until your friend arrives. */
  function updateMusic(): void {
    if (screen === 'home') { music.setPresence(null, false); music.setMode('title'); }
    else if (screen === 'invite' || screen === 'lobby') { music.setPresence(myElem, session.connected); music.setMode('lobby'); }
    else if (screen === 'map' || screen === 'results') music.setMode('map');
    else music.setMode('level');
  }

  function render(): void {
    if (screen === 'home') scr.innerHTML = homeHtml();
    else if (screen === 'invite') scr.innerHTML = inviteHtml();
    else if (screen === 'lobby') scr.innerHTML = lobbyHtml();
    else if (screen === 'map') scr.innerHTML = mapHtml();
    else if (screen === 'results') scr.innerHTML = resultsHtml();
  }

  function homeHtml(): string {
    const ios = /iPhone|iPad/.test(navigator.userAgent) && !device.isStandalone();
    return `<div class="panel">
      <h1><span class="hot">Hot Boy</span> &amp; <span class="cool">Cool Girl</span></h1>
      <input class="name-input" id="name" maxlength="12" placeholder="Your name (optional)" value="${esc(myName)}" autocomplete="off" />
      <button class="primary big" data-act="create">Create room</button>
      <div class="row">
        <input class="code-input" id="code" maxlength="4" placeholder="CODE" autocomplete="off" autocapitalize="characters" spellcheck="false" />
        <button class="secondary" data-act="join">Join room</button>
      </div>
      <div class="status" id="status"></div>
      ${ios ? '<p class="small">Tip: Share → “Add to Home Screen” plays fullscreen and keeps your progress safe.</p>' : ''}
      <p class="small"><a href="?lab">Feel Lab</a></p>
    </div>`;
  }

  function inviteHtml(): string {
    return `<div class="panel">
      <h2>Your room</h2>
      <div class="code">${session.code}</div>
      <p>Send this link to your friend. Opening it joins the room, with no typing.</p>
      <div class="row">
        <button class="primary" data-act="share">Share link</button>
        <button data-act="copy">Copy link</button>
      </div>
      <div class="status">Waiting for your friend…</div>
      <button data-act="leave">Cancel</button>
    </div>`;
  }

  function lobbyHtml(): string {
    const card = (e: Elem) => {
      const me = e === myElem;
      const who = me ? `You${myName ? ` (${esc(myName)})` : ''}` : session.connected ? (partnerName ? esc(partnerName) : 'Your friend') : 'waiting…';
      return `<div class="char-card ${e === 'fire' ? 'hot' : 'cool'} ${me ? 'me' : ''}"><b>${NAMES[e]}</b><span>${who}</span></div>`;
    };
    return `<div class="panel wide">
      <h2>Who plays who?</h2>
      <div class="duo">${card('fire')}<button data-act="swap" title="Swap characters">⇄ Swap</button>${card('water')}</div>
      <p class="small">Either of you can swap. Hot Boy walks through lava, Cool Girl through water.</p>
      <button class="primary big" data-act="tomap">Level map →</button>
      ${versionProblem ? `<div class="status err">${versionProblem}</div>` : ''}
      <div class="row small-row"><span class="small">Room ${session.code}</span><button data-act="leave">Leave room</button></div>
    </div>`;
  }

  /** The temple map (11.1): a path of level stones; either player picks, both tap Ready. */
  function mapHtml(): string {
    const progress = loadProgress();
    const mine = Object.keys(progress);
    const spots = [[9, 60], [29, 27], [50, 57], [71, 25], [91, 52]];
    const path = spots.map(([x, y], i) => (i ? 'L' : 'M') + x + ' ' + y).join(' ');
    const nodes = CHAPTER_1.map((l, i) => {
      const open = l.rows !== null && isUnlocked(l.id, mine, partnerDone);
      const stars = progress[l.id]?.stars ?? 0;
      const label = l.rows === null ? 'soon' : open ? `<span class="on">${'★'.repeat(stars)}</span><span class="off">${'★'.repeat(3 - stars)}</span>` : '🔒';
      const [x, y] = spots[i];
      return `<button class="map-node ${l.id === picked ? 'picked' : ''} ${progress[l.id] ? 'done' : ''}" style="left:${x}%;top:${y}%" data-act="pick" data-id="${l.id}" ${open ? '' : 'disabled'}>
        <b>${i + 1}</b><span class="map-name">${l.name}</span><small>${label}</small></button>`;
    }).join('');
    const pl = findLevel(picked);
    return `<div class="panel wide map-panel">
      <div class="map-head"><button data-act="tolobby">← Characters</button><h2>Chapter 1 · The Temple Gate</h2><span class="small">Room ${session.code}</span></div>
      <div class="temple-map"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${path}" /></svg>${nodes}</div>
      <div class="row">
        <button class="${readyMe ? 'secondary' : 'primary'} big" data-act="ready">${readyMe ? 'Ready ✓ (tap to undo)' : `Ready: ${pl?.name ?? ''}`}</button>
      </div>
      <div class="status">${!session.connected ? 'Waiting for your friend…' : readyPartner ? 'Your friend is ready ✅' : 'Both tap Ready to start. Either of you can pick the level.'}</div>
      ${versionProblem ? `<div class="status err">${versionProblem}</div>` : ''}
    </div>`;
  }

  function resultsHtml(): string {
    if (!finish) return '';
    const stars = starsFor(finish.got === finish.total, finish.time, level.targetTime);
    const nx = nextLevel(level.id);
    const pc = partnerChoice ? `Your friend picked: <b>${{ next: 'Next level', retry: 'Retry', map: 'Level map' }[partnerChoice]}</b>` : 'Both tap the same choice to continue.';
    const btn = (c: Choice, text: string, cls = '') => `<button class="${cls} ${myChoice === c ? 'chosen' : ''}" data-act="choice" data-c="${c}">${text}</button>`;
    return `<div class="panel">
      <h2>${level.name} complete!</h2>
      <div class="stars">${[0, 1, 2].map((i) => `<span class="star ${i < stars ? 'on' : ''}" style="animation-delay:${0.3 + i * 0.35}s">★</span>`).join('')}</div>
      <div class="result-row">
        <span>⏱ ${finish.time.toFixed(1)} s <small>(⭐⭐⭐ under ${level.targetTime} s)</small></span>
        <span>💎 ${finish.got}/${finish.total}</span>
        <span>💀 ${finish.deaths}</span>
      </div>
      <div class="row">
        ${nx?.rows ? btn('next', 'Next level', 'primary') : ''}
        ${btn('retry', 'Retry')}
        ${btn('map', 'Level map')}
      </div>
      <div class="status">${pc}</div>
    </div>`;
  }

  // ---------------------------------------------------------------- button actions
  ui.addEventListener('click', (ev) => {
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'create') void create();
    else if (act === 'join') void join(normalizeRoomCode(($<HTMLInputElement>('#code')).value));
    else if (act === 'share') void shareLink();
    else if (act === 'copy') void copyLink();
    else if (act === 'leave') leaveRoom();
    else if (act === 'swap') swapRoles();
    else if (act === 'tomap') show('map');
    else if (act === 'tolobby') { if (readyMe) toggleReady(); show('lobby'); }
    else if (act === 'pick') pickLevel(el.dataset.id!, true);
    else if (act === 'ready') toggleReady();
    else if (act === 'choice') choose(el.dataset.c as Choice);
    else if (act === 'menu') openMenu();
    else if (act === 'resume') closeMenu();
    else if (act === 'home') { leaveRoom(); lostEl.classList.add('hidden'); }
    else if (act === 'update') location.reload();
    else if (act === 'net') toast(netText());
  });
  ui.addEventListener('input', (ev) => {
    const t = ev.target as HTMLInputElement;
    if (t.id === 'code') t.value = normalizeRoomCode(t.value);
    if (t.id === 'name') { myName = t.value.trim().slice(0, 12); saveName(myName); }
  });
  ui.addEventListener('keydown', (ev) => {
    if ((ev.target as HTMLElement).id === 'code' && ev.key === 'Enter') void join(normalizeRoomCode((ev.target as HTMLInputElement).value));
  });

  const setStatus = (text: string, err = false) => {
    const s = document.getElementById('status');
    if (s) { s.textContent = text; s.className = `status ${err ? 'err' : ''}`; }
  };

  const roomLink = () => `${location.origin}${location.pathname}?room=${session.code}`;
  const rememberRoomInUrl = () => history.replaceState(null, '', `?room=${session.code}`);

  async function create(): Promise<void> {
    setStatus('Opening a room…');
    try {
      await session.create();
      myElem = 'fire'; // the host starts as Hot Boy (11.1)
      rememberRoomInUrl();
      show('invite');
    } catch (e) {
      setStatus((e as Error).message, true);
    }
  }

  async function join(code: string): Promise<void> {
    if (code.length !== 4) { setStatus('Room codes are 4 letters.', true); return; }
    setStatus(`Joining room ${code}…`);
    try {
      await session.join(code);
      rememberRoomInUrl();
      if (session.status === 'waiting') show('invite'); // nobody was there: we opened it
    } catch (e) {
      setStatus((e as Error).message, true);
    }
  }

  async function shareLink(): Promise<void> {
    const url = roomLink();
    try {
      if (navigator.share) await navigator.share({ title: 'Hot Boy & Cool Girl', text: `Play with me! Room ${session.code}`, url });
      else await copyLink();
    } catch {
      // share sheet closed
    }
  }

  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(roomLink());
      toast('Link copied');
    } catch {
      toast(roomLink(), 6000);
    }
  }

  function leaveRoom(): void {
    session.leave();
    history.replaceState(null, '', location.pathname);
    goHomeStage();
    show('home');
  }

  function goHomeStage(): void {
    stage.setLevel(levelData(CHAPTER_1[0]));
    stage.setLocal({ fire: true, water: true });
    stage.controlled = null;
  }

  // ---------------------------------------------------------------- lobby
  function swapRoles(): void {
    if (session.isHost) {
      myElem = other(myElem);
      send({ t: 'roles', host: myElem });
      render();
    } else send({ t: 'swap' });
    readyMe = readyPartner = false;
  }

  function pickLevel(id: string, tell: boolean): void {
    if (!findLevel(id)?.rows) return;
    picked = id;
    readyMe = readyPartner = false;
    if (tell) send({ t: 'pick', id });
    if (screen === 'lobby' || screen === 'map') render();
  }

  function toggleReady(): void {
    readyMe = !readyMe;
    send({ t: 'ready', id: picked, on: readyMe });
    if (readyMe) sfx.chime([659.25]);
    render();
    maybeStart();
  }

  function maybeStart(): void {
    if (session.isHost && readyMe && readyPartner && !versionProblem) startLevel(picked);
  }

  /** Host: start (or restart) a level for both phones. */
  function startLevel(id: string): void {
    round++;
    send({ t: 'start', id, n: round });
    doStart(id, round);
  }

  function doStart(id: string, n: number): void {
    const def = findLevel(id);
    if (!def?.rows) return;
    level = def;
    round = n;
    deaths = 0;
    readyMe = readyPartner = false;
    myChoice = partnerChoice = null;
    finish = null;
    stage.setLevel(levelData(def));
    stage.setLocal({ fire: myElem === 'fire', water: myElem === 'water' });
    stage.controlled = myElem;
    stage.inputEnabled = !menuOpen;
    stage.showMarker();
    if (id === CHAPTER_1[0].id) stage.hintZones(); // zone hints on the first level only (6.3)
    resetRound();
    show('play');
  }

  function resetRound(): void {
    restartPending = false;
    partnerAtDoor = false;
    collected.clear();
  }

  // ---------------------------------------------------------------- deaths and restarts (13.3)
  function scheduleRestart(): void {
    if (restartPending || screen !== 'play') return;
    restartPending = true;
    deaths++;
    const n = round;
    setTimeout(() => {
      if (screen !== 'play' || round !== n || !session.isHost) return;
      round++;
      send({ t: 'restart', n: round, deaths });
      doRestart();
    }, RESTART_DELAY_MS);
  }

  function doRestart(by?: Elem): void {
    resetRound();
    stage.restart();
    stage.setLocal({ fire: myElem === 'fire', water: myElem === 'water' });
    if (by && by !== myElem) toast(`${NAMES[by]} restarted the level`);
  }

  /** Hold-to-restart from the pause menu: the host does it, the guest asks the host. */
  function requestRestart(): void {
    if (session.isHost) {
      round++;
      send({ t: 'restart', n: round, deaths, by: myElem });
      doRestart();
    } else send({ t: 'reqRestart' });
    closeMenu();
  }

  // ---------------------------------------------------------------- level complete (10.2, 12.1)
  function checkFinish(): void {
    if (!session.isHost || screen !== 'play' || stage.completed || restartPending) return;
    if (!stage.atDoor(myElem) || !partnerAtDoor || !stage.isAlive(other(myElem))) return;
    const data: Finish = { time: Math.round(stage.levelTime * 10) / 10, got: collected.size, total: stage.gemCount().total, deaths };
    send({ t: 'finish', n: round, ...data });
    doFinish(data);
  }

  function doFinish(data: Finish): void {
    finish = data;
    stage.celebrate();
    music.swell();
    const stars = starsFor(data.got === data.total, data.time, level.targetTime);
    recordResult(level.id, stars, data.time); // saved on both phones (12.3)
    const n = round;
    setTimeout(() => {
      if (round !== n || screen !== 'play') return;
      myChoice = partnerChoice = null;
      show('results');
      music.jingle(stars);
      // stars count up with three rising notes
      for (let i = 0; i < stars; i++) setTimeout(() => sfx.chime([523.25 * Math.pow(1.26, i)], 0, 0.14), 300 + i * 350);
    }, 1800);
  }

  function choose(c: Choice): void {
    myChoice = c;
    send({ t: 'choice', c });
    render();
    resolveChoice();
  }

  function resolveChoice(): void {
    if (!session.isHost || !myChoice || myChoice !== partnerChoice) return;
    if (myChoice === 'retry') startLevel(level.id);
    else if (myChoice === 'next') { const nx = nextLevel(level.id); if (nx?.rows) startLevel(nx.id); }
    else { send({ t: 'lobby' }); goMap(); }
  }

  function goMap(): void {
    readyMe = readyPartner = false;
    const nx = nextLevel(level.id);
    if (finish && nx?.rows) picked = nx.id;
    goHomeStage();
    show('map');
  }

  // ---------------------------------------------------------------- pause menu (13.3, 13.4)
  function openMenu(): void {
    menuOpen = true;
    stage.inputEnabled = false;
    stage.controls.reset();
    send({ t: 'status', s: 'menu' });
    menuEl.innerHTML = `<div class="panel">
      <h2>Paused <small>(the game keeps running)</small></h2>
      <button class="primary big" data-act="resume">Resume</button>
      <button class="hold-btn big" id="hold"><span class="hold-ring"></span><span>Hold to restart</span></button>
      <button data-act="leave">Leave room</button>
    </div>`;
    menuEl.classList.remove('hidden');
    setupHold($<HTMLElement>('#hold', menuEl));
  }

  function closeMenu(): void {
    if (!menuOpen) return;
    menuOpen = false;
    menuEl.classList.add('hidden');
    stage.inputEnabled = !document.hidden;
    send({ t: 'status', s: '' });
  }

  /** The ring fills over 1 s while held, the button shakes and brightens; early release drains it (13.3). */
  function setupHold(btn: HTMLElement): void {
    let p = 0, holding = false, last = 0, raf = 0;
    const loop = (t: number) => {
      const dt = last ? (t - last) / 1000 : 0;
      last = t;
      p = Math.max(0, Math.min(1, p + (holding ? dt : -dt * 2)));
      btn.style.setProperty('--p', String(p));
      btn.classList.toggle('holding', holding && p > 0);
      if (p >= 1) {
        btn.classList.add('pop');
        device.haptic(40);
        sfx.chime([392, 784], 0.05, 0.15);
        requestRestart();
        return;
      }
      if (holding || p > 0) raf = requestAnimationFrame(loop);
      else last = 0;
    };
    const start = (e: PointerEvent) => { e.preventDefault(); holding = true; last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); };
    const stop = () => { holding = false; };
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointerleave', stop);
    btn.addEventListener('pointercancel', stop);
  }

  document.addEventListener('visibilitychange', () => {
    // Switching apps or locking the phone: your character stands still, your friend sees 💤 (13.4).
    const away = document.hidden;
    stage.inputEnabled = !away && !menuOpen;
    if (away) stage.controls.reset();
    send({ t: 'status', s: away ? 'away' : menuOpen ? 'menu' : '' });
  });

  // ---------------------------------------------------------------- network
  function onStatus(s: SessionStatus, info?: string): void {
    if (s === 'connected') {
      lostEl.classList.add('hidden');
      send({ t: 'hello', v: __BUILD__, name: myName, done: Object.keys(loadProgress()) });
      sfx.chime([523.25, 783.99]); // "partner joined" (15.5)
      device.haptic(30);
      if (screen === 'home' || screen === 'invite') show('lobby');
      else updateMusic();
    } else if (s === 'lost') {
      showLost();
      updateMusic();
    } else if (s === 'idle' && info) {
      goHomeStage();
      show('home');
      setStatus(info, true);
    }
    updateNet();
  }

  function showLost(): void {
    lostAt = performance.now();
    stage.inputEnabled = false;
    stage.controls.reset();
    stage.setPartnerStatus(other(myElem), '');
    lostEl.innerHTML = `<div class="panel">
      <h2>Waiting for your friend…</h2>
      <p>The connection dropped. They can reopen the same link (room <b>${session.code}</b>) and you'll continue.</p>
      <div class="spinner"></div>
      <button class="hidden" id="lost-home" data-act="home">Back to home</button>
    </div>`;
    lostEl.classList.remove('hidden');
  }

  function onMessage(m: Record<string, unknown>): void {
    const n = m.n as number | undefined;
    const partner = other(myElem);
    switch (m.t) {
      case 'hello': {
        partnerName = String(m.name ?? '').slice(0, 12);
        partnerDone = Array.isArray(m.done) ? (m.done as string[]) : [];
        const v = Number(m.v);
        versionProblem = v > __BUILD__ ? 'Your friend has a newer version.' : v < __BUILD__ ? 'Your friend has an older version: ask them to reload the page.' : '';
        if (v > __BUILD__) showUpdate();
        if (session.isHost) {
          send({ t: 'roles', host: myElem });
          send({ t: 'pick', id: picked });
          // Back after a drop in the middle of a level: the level restarts (13.5).
          if (screen === 'play' || screen === 'results') startLevel(level.id);
        }
        if (screen === 'lobby' || screen === 'map') render();
        break;
      }
      case 'roles':
        if (m.host === 'fire' || m.host === 'water') myElem = other(m.host);
        readyMe = readyPartner = false;
        if (screen === 'lobby' || screen === 'map') render();
        break;
      case 'swap':
        if (session.isHost) swapRoles();
        break;
      case 'pick':
        pickLevel(String(m.id), false);
        break;
      case 'ready':
        readyPartner = !!m.on && m.id === picked;
        if (readyPartner) sfx.chime([783.99]);
        if (screen === 'lobby' || screen === 'map') render();
        maybeStart();
        break;
      case 'start':
        doStart(String(m.id), Number(m.n));
        break;
      case 's':
        if (n === round && screen === 'play') {
          stage.pushSnapshot(partner, m as unknown as Snapshot);
          partnerAtDoor = m.d === 1;
        }
        break;
      case 'ev':
        if (n === round) stage.remoteEvent(partner, m.e as HeroEvent);
        break;
      case 'die':
        if (n === round && screen === 'play') {
          stage.remoteDeath(partner, m.cause as Liquid);
          music.duck();
          if (session.isHost) scheduleRestart();
        }
        break;
      case 'gem':
        if (n === round) { collected.add(Number(m.i)); stage.remoteGem(Number(m.i)); }
        break;
      case 'restart':
        round = Number(m.n);
        deaths = Number(m.deaths) || 0;
        if (screen === 'play') doRestart(m.by as Elem | undefined);
        break;
      case 'lever':
        if (n === round) stage.remoteLever(Number(m.i), !!m.on);
        break;
      case 'w':
        if (n === round && !session.isHost) stage.correctMech(m as { lv?: number[]; pl?: number[] });
        break;
      case 'reqRestart':
        if (session.isHost && screen === 'play') {
          round++;
          send({ t: 'restart', n: round, deaths, by: partner });
          doRestart(partner);
        }
        break;
      case 'finish':
        if (n === round && screen === 'play') doFinish({ time: Number(m.time), got: Number(m.got), total: Number(m.total), deaths: Number(m.deaths) });
        break;
      case 'choice':
        partnerChoice = m.c as Choice;
        if (screen === 'results') render();
        resolveChoice();
        break;
      case 'lobby':
        goMap();
        break;
      case 'status':
        stage.setPartnerStatus(partner, m.s === 'menu' || m.s === 'away' ? m.s : '');
        break;
      case 'bye':
        toast(`${partnerName || 'Your friend'} left the room`, 4000);
        break;
    }
  }

  function showUpdate(): void {
    lostEl.innerHTML = `<div class="panel">
      <h2>Update needed</h2>
      <p>Your friend has a newer version of the game.</p>
      <button class="primary big" data-act="update">Tap to update</button>
    </div>`;
    lostEl.classList.remove('hidden');
  }

  // Host: the shared world's state, so the guest's buttons/levers/platforms never drift apart (13.1, 13.2).
  setInterval(() => {
    if (screen !== 'play' || !session.connected || !session.isHost || !stage.mech.levers.length && !stage.mech.platforms.length) return;
    send({ t: 'w', n: round, ...stage.mechState() });
  }, 200);

  // Send my character ~30×/s while playing (13.2).
  setInterval(() => {
    if (screen !== 'play' || !session.connected) return;
    send({ t: 's', n: round, ...stage.snapshot(myElem), d: stage.atDoor(myElem) ? 1 : 0 });
  }, SNAPSHOT_MS);

  // HUD, connection dot, finish check, waiting timeout.
  const gemTotals = () => {
    const out = { fire: [0, 0], water: [0, 0] } as Record<Elem, [number, number]>;
    levelData(level).gems.forEach((g, i) => { out[g.elem][1]++; if (collected.has(i)) out[g.elem][0]++; });
    return out;
  };
  setInterval(() => {
    checkFinish();
    if (screen === 'play') {
      music.setMovement(stage.movement('fire'), stage.movement('water'));
      const g = gemTotals();
      hudInfo.textContent = `⏱ ${stage.levelTime.toFixed(1)}   🔥 ${g.fire[0]}/${g.fire[1]}   💧 ${g.water[0]}/${g.water[1]}`;
    }
    updateNet();
    if (session.status === 'lost' && performance.now() - lostAt > WAIT_LIMIT_MS) document.getElementById('lost-home')?.classList.remove('hidden');
  }, 100);

  function updateNet(): void {
    const r = session.rtt;
    netDot.textContent = !session.connected ? '⚪' : Number.isNaN(r) ? '🟢' : r < 100 ? '🟢' : r < 200 ? '🟡' : '🔴';
  }

  function netText(): string {
    if (!session.connected) return 'Not connected';
    const path = { local: 'same Wi-Fi', direct: 'direct', relay: 'through the relay server', unknown: 'checking…' }[session.kind];
    return `Ping ${Number.isNaN(session.rtt) ? '…' : Math.round(session.rtt) + ' ms'} · ${path}`;
  }

  // ---------------------------------------------------------------- go
  show('home');
  const linkCode = normalizeRoomCode(new URLSearchParams(location.search).get('room') ?? '');
  if (linkCode.length === 4) {
    setStatus(`Joining room ${linkCode}…`);
    void join(linkCode); // opening a room link joins automatically (11.1)
  }
  if (import.meta.env.DEV) Object.assign(window, { __game: { stage, session, get round() { return round; }, get screen() { return screen; } } });
}
