// The online game: home → invite → lobby (roles + level pick) → play → results (design doc 11–13).
// Each phone simulates only its own character; the host's phone is the referee of the world:
// it starts levels, restarts them after a death and decides when the level is complete.
import * as device from '../engine/device';
import * as sfx from '../engine/sfx';
import { music } from '../engine/music';
import type { DeathCause, Elem } from '../game/level';
import type { MechSync } from '../game/mechanisms';
import { ALL_LEVELS, CHAPTERS, chapterOf, getLevel, levelData, nextLevel, riddleFor, type LevelDef } from '../game/levels';
import { blankLevel, decodeLink, encodeLink, isCustomId, isVerified, levelHash, markVerified, newId, sanitize, type CustomLevel } from '../game/custom';
import { checkLevel, hasErrors } from '../game/levelCheck';
import { deleteLevel, forgetRoomLevels, getMyLevel, listLevels, rememberRoomLevel, roomLevel, roomLevels, saveLevel } from '../game/myLevels';
import { openEditor } from '../editor/editor';
import { thumb } from '../editor/thumb';
import { isUnlocked, loadName, loadProgress, recordResult, saveName, starsFor } from '../game/progress';
import { isCode, loadCode, phoneId, randomCode, saveCode } from '../game/teamCode';
import { loadPrefs, savePrefs, type PrefKey } from '../game/prefs';
import { playVersion } from '../game/version';
import { FREE_CHAPTERS, canPlay, ownsGame, paywallOn, setOwned } from '../game/unlock';
import { STORE_URL, SUPPORT_EMAIL, WEB_URL, feedbackLink, storeLink } from '../game/links';
import { buy, canBuy, initBilling, priceText, restore } from '../shop/billing';
import { askForReview } from '../shop/review';
import type { Animal } from '../game/mechanisms';
import { defaults } from '../game/settings';
import { Session, type SessionStatus } from '../net/session';
import { normalizeRoomCode } from '../net/room';
import { Stage, createApp, type HeroEvent, type Snapshot } from '../play/stage';

type Screen = 'home' | 'invite' | 'lobby' | 'map' | 'play' | 'results' | 'designer' | 'editor' | 'import';
type Choice = 'next' | 'retry' | 'map';
interface Finish { time: number; got: number; total: number; deaths: number }

const NAMES: Record<Elem, string> = { fire: '🔥 Hot Boy', water: '💧 Cool Girl' };
const other = (e: Elem): Elem => (e === 'fire' ? 'water' : 'fire');
const $ = <E extends HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as E;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const SNAPSHOT_MS = 33; // ~30 per second (13.2)
const RESTART_DELAY_MS = 1100; // death effect, then restart for both (13.3)

export async function startGame(): Promise<void> {
  const settings = defaults();
  loadPrefs(settings); // the player's own sound and vibration choices (15.6)
  settings.stats = false;
  const app = await createApp();

  // ---------------------------------------------------------------- state
  let screen: Screen = 'home';
  let myElem: Elem = 'fire';
  let myName = loadName();
  let partnerName = '';
  let partnerDone: string[] = [];
  /** The partner phone's hidden ID: picks which saved team code to use (16.7, G12). */
  let partnerId = '';
  /** Friend's pass (12.6): the partner's phone owns the full game, so this room plays everything. */
  let partnerOwns = false;
  const roomOwns = () => ownsGame() || partnerOwns;
  let picked = ALL_LEVELS[0].id;
  let readyMe = false, readyPartner = false;
  let level: LevelDef = ALL_LEVELS[0];
  let round = 0;
  let deaths = 0;
  let restartPending = false;
  let partnerAtDoor = false;
  const collected = new Set<number>();
  let myChoice: Choice | null = null, partnerChoice: Choice | null = null;
  let finish: Finish | null = null;
  let menuOpen = false;
  let versionProblem = '';
  // level designer (16.3)
  let mapTab: number | 'mine' = 1; // a chapter number, or the homemade levels
  let editor: { close(): void } | null = null;
  let importLevel: CustomLevel | null = null;
  let pendingDelete = '';
  let verifiedNow = false;
  let gemElems: Elem[] = [];
  // Don't touch (16.7, T2): when each phone last saw a clear overlap; both must see one within TOUCH_AGREE ms
  let myTouchT = -Infinity, partnerTouchT = -Infinity, touchSentT = -Infinity;
  const TOUCH_AGREE = 500;

  const stage = new Stage(app, settings, levelData(ALL_LEVELS[0]), {
    sandbox: false,
    hooks: {
      localDeath: (_e, cause) => { if (screen !== 'play') return; music.duck(); send({ t: 'die', n: round, cause }); if (session.isHost) scheduleRestart(); },
      localGem: (_e, i) => { collected.add(i); send({ t: 'gem', n: round, i }); },
      localEvent: (_e, ev) => send({ t: 'ev', n: round, e: ev }),
      localLever: (i, on) => send({ t: 'lever', n: round, i, on }),
      // Symbol stones (16.7): the guest asks the host; the host's state goes out at once (13.1).
      localStone: (i) => { if (session.isHost) sendWorld(); else send({ t: 'stone', n: round, i }); },
      // Don't touch (16.7, T2): tell the partner's phone (a few times a second while it lasts); burst only if it saw one too.
      localTouch: () => {
        if (screen !== 'play') return;
        const now = performance.now();
        myTouchT = now;
        if (now - touchSentT > 100) { touchSentT = now; send({ t: 'touch', n: round }); }
        if (now - partnerTouchT < TOUCH_AGREE) stage.touchDeath();
      },
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
    <button class="fs-btn hud-btn" data-act="fullscreen"></button>
    <div class="toast hidden"></div>
    <div class="riddle hidden"></div>
    <div class="overlay screen" id="scr"></div>
    <div class="overlay hidden" id="menu"></div>
    <div class="overlay hidden" id="lost"></div>
    <div class="overlay hidden" id="offer"></div>
    <div class="rotate-msg"><div>📱↻<br/>Turn your phone sideways</div></div>`;
  const scr = $<HTMLElement>('#scr');
  const hud = $<HTMLElement>('.hud');
  const hudInfo = $<HTMLElement>('.hud-info');
  const netDot = $<HTMLElement>('.net-dot');
  const toastEl = $<HTMLElement>('.toast');
  const riddleEl = $<HTMLElement>('.riddle');
  const menuEl = $<HTMLElement>('#menu');
  const lostEl = $<HTMLElement>('#lost');
  const offerEl = $<HTMLElement>('#offer');
  const fsBtn = $<HTMLElement>('.fs-btn');

  let toastTimer = 0;
  const toast = (text: string, ms = 2500) => {
    toastEl.textContent = text;
    toastEl.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.add('hidden'), ms);
  };

  // Chapter riddle (11.2): fades in when a chapter's first level starts, and out after a while or on your first touch.
  const RIDDLE_MS = 7000;
  const RIDDLE_GRACE_MS = 1500; // a touch this early is still the tap that started the level
  let riddleTimer = 0;
  let riddleShownAt = 0;
  function showRiddle(text: string): void {
    riddleEl.textContent = text;
    riddleEl.classList.remove('hidden', 'gone');
    riddleShownAt = performance.now();
    clearTimeout(riddleTimer);
    riddleTimer = window.setTimeout(hideRiddle, RIDDLE_MS);
  }
  function hideRiddle(): void {
    clearTimeout(riddleTimer);
    if (riddleEl.classList.contains('hidden')) return;
    riddleEl.classList.add('gone');
    riddleTimer = window.setTimeout(() => riddleEl.classList.add('hidden'), 800);
  }
  const touchHidesRiddle = () => {
    if (!riddleEl.classList.contains('gone') && performance.now() - riddleShownAt > RIDDLE_GRACE_MS) hideRiddle();
  };
  window.addEventListener('pointerdown', touchHidesRiddle);
  window.addEventListener('keydown', touchHidesRiddle);

  // The first touch unlocks sound and (on Android) goes fullscreen.
  let unlocked = false;
  window.addEventListener('pointerdown', (e) => {
    if (unlocked) return;
    unlocked = true;
    device.unlock();
    sfx.configure(settings.sound, settings.volume);
    music.start();
    music.configure(settings.music, settings.musicVolume);
    updateMusic();
    const fsTap = !!(e.target as HTMLElement).closest('[data-act="fullscreen"]');
    if (!fsTap && device.wantsFullscreen() && device.canFullscreen() && !device.isStandalone() && matchMedia('(pointer: coarse)').matches) {
      device.enterFullscreenLandscape().catch(() => {});
    }
  }, { capture: true });

  // ---------------------------------------------------------------- fullscreen button
  // Not needed when opened from the home-screen icon (it's already fullscreen there).
  const fsLabel = () => device.isFullscreen() ? '⛶ Exit full screen' : '⛶ Full screen';
  function updateFsButton(): void {
    fsBtn.textContent = fsLabel();
    fsBtn.classList.toggle('hidden', device.isStandalone() || screen === 'play' || screen === 'editor');
    const menuFs = menuEl.querySelector<HTMLElement>('[data-act="fullscreen"]');
    if (menuFs) menuFs.textContent = fsLabel();
  }
  document.addEventListener('fullscreenchange', updateFsButton);
  function fullscreenTapped(): void {
    if (device.canFullscreen()) { device.toggleFullscreen().catch(() => {}); return; }
    // iPhone: Safari can't hide its bars for a web page; only the home-screen icon plays fullscreen.
    toast(device.isIOS() ? 'iPhone: tap Share ⬆, then “Add to Home Screen”, and open the game from its icon.' : 'This browser can’t go full screen.', 6000);
  }
  // Taps on menus must not leave a stuck touch on the game.
  ui.addEventListener('pointerdown', (e) => { if ((e.target as HTMLElement).closest('button, input, .overlay')) stage.controls.reset(); });

  // ---------------------------------------------------------------- screens
  function show(s: Screen): void {
    screen = s;
    const playing = s === 'play';
    if (s !== 'editor' && editor) { editor.close(); editor = null; goHomeStage(); }
    if (s !== 'designer') pendingDelete = '';
    scr.classList.toggle('hidden', playing || s === 'editor');
    hud.classList.toggle('hidden', !playing);
    netDot.classList.toggle('hidden', s === 'home' || s === 'designer' || s === 'editor' || s === 'import');
    if (!playing) { closeMenu(); stage.showHints = false; clearTimeout(riddleTimer); riddleEl.classList.add('hidden'); }
    syncBanner();
    render();
    updateFsButton();
    updateMusic();
  }

  /** Menu music (15.4b): title on home, your own layer in the lobby until your friend arrives. */
  function updateMusic(): void {
    if (screen === 'home') { music.setPresence(null, false); music.setMode('title'); }
    else if (screen === 'invite' || screen === 'lobby') { music.setPresence(myElem, session.connected); music.setMode('lobby'); }
    else if (screen === 'map' || screen === 'results' || screen === 'designer' || screen === 'editor' || screen === 'import') music.setMode('map');
    else music.setMode('level');
  }

  function render(): void {
    if (screen === 'home') scr.innerHTML = homeHtml();
    else if (screen === 'invite') scr.innerHTML = inviteHtml();
    else if (screen === 'lobby') scr.innerHTML = lobbyHtml();
    else if (screen === 'map') scr.innerHTML = mapHtml();
    else if (screen === 'results') scr.innerHTML = resultsHtml();
    else if (screen === 'designer') scr.innerHTML = designerHtml();
    else if (screen === 'import') scr.innerHTML = importHtml();
  }

  function homeHtml(): string {
    const ios = /iPhone|iPad/.test(navigator.userAgent) && !device.isStandalone();
    // A stranger from a clip or the store must get it in seconds: two people, two phones (MARKETING_PLAN M3).
    // One line, not a tutorial (11.2). The Feel Lab stays at ?lab but isn't advertised to players.
    const about = device.isNativeApp() ? `${WEB_URL}about.html` : 'about.html';
    return `<div class="panel">
      <h1><span class="hot">Hot Boy</span> &amp; <span class="cool">Cool Girl</span></h1>
      <p class="tagline">A co-op puzzle game for two friends, each on their own phone.</p>
      <input class="name-input" id="name" maxlength="12" placeholder="Your name (optional)" value="${esc(myName)}" autocomplete="off" />
      <button class="primary big" data-act="create">Create room</button>
      <div class="row">
        <input class="code-input" id="code" maxlength="4" placeholder="CODE" autocomplete="off" autocapitalize="characters" spellcheck="false" />
        <button class="secondary" data-act="join">Join room</button>
      </div>
      <button data-act="designer">🛠 Level designer</button>
      <div class="status" id="status"></div>
      ${ios ? '<p class="small">Tip: Share → “Add to Home Screen” plays fullscreen and keeps your progress safe.</p>' : ''}
      <p class="small"><a href="${about}" target="${device.isNativeApp() ? '_blank' : '_self'}">About the game</a>${SUPPORT_EMAIL ? ` · <a href="${feedbackLink()}">Send feedback</a>` : ''}</p>
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
    const ch = CHAPTERS.find((c) => c.n === mapTab) ?? CHAPTERS[0];
    // the path zigzags the other way in even chapters, so each chapter's map looks a little different
    const spots = [[9, 60], [29, 27], [50, 57], [71, 25], [91, 52]].map(([x, y]) => [x, ch.n % 2 ? y : 85 - y]);
    const path = spots.map(([x, y], i) => (i ? 'L' : 'M') + x + ' ' + y).join(' ');
    const nodes = ch.levels.map((l, i) => {
      const open = l.rows !== null && isUnlocked(l.id, mine, partnerDone);
      const stars = progress[l.id]?.stars ?? 0;
      const paid = open && !canPlay(l.id, roomOwns());
      const label = l.rows === null ? 'soon' : paid ? '🔑 full game' : open ? `<span class="on">${'★'.repeat(stars)}</span><span class="off">${'★'.repeat(3 - stars)}</span>` : '🔒';
      const [x, y] = spots[i];
      return `<button class="map-node ${l.id === picked ? 'picked' : ''} ${progress[l.id] ? 'done' : ''} ${paid ? 'paid' : ''}" style="left:${x}%;top:${y}%" data-act="pick" data-id="${l.id}" ${open ? '' : 'disabled'}>
        <b>${i + 1}</b><span class="map-name">${l.name}</span><small>${label}</small></button>`;
    }).join('');
    const pl = getLevel(picked);
    const tab = (t: typeof mapTab, text: string) => `<button class="${mapTab === t ? 'on' : ''}" data-act="tab" data-tab="${t}">${text}</button>`;
    const custom = isCustomId(picked);
    const idea = !custom && pl && 'idea' in pl && pl.idea ? ` New here: ${pl.idea}.` : '';
    const hint = custom && pl && !isVerified(pl as CustomLevel) ? ' Finish it together to give it its ✅.' : idea;
    return `<div class="panel wide map-panel">
      <div class="map-head"><button data-act="tolobby">← Characters</button><div class="tabs">${CHAPTERS.map((c) => tab(c.n, `Ch ${c.n}`)).join('')}${tab('mine', '🛠 Mine')}</div><span class="small">Room ${session.code}</span></div>
      ${mapTab !== 'mine'
        ? `<div class="map-chapter">Chapter ${ch.n} · ${ch.name}</div>${riddleFor(ch, myElem) ? `<div class="map-riddle">${riddleFor(ch, myElem)}</div>` : ''}<div class="temple-map"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${path}" /></svg>${nodes}</div>`
        : mineHtml()}
      <div class="row">
        <button class="${readyMe ? 'secondary' : 'primary'} big" data-act="ready">${readyMe ? 'Ready ✓ (tap to undo)' : `Ready: ${pl?.name ?? ''}`}</button>
      </div>
      <div class="status">${!session.connected ? 'Waiting for your friend…' : readyPartner ? 'Your friend is ready ✅' : `Both tap Ready to start. Either of you can pick the level.${hint}`}</div>
      ${versionProblem ? `<div class="status err">${versionProblem}</div>` : ''}
    </div>`;
  }

  /** Homemade levels on the temple map: mine, plus any your friend picked in this room. */
  function mineHtml(): string {
    const mine = listLevels();
    const ids = new Set(mine.map((l) => l.id));
    const all = [...mine, ...roomLevels().filter((l) => !ids.has(l.id))];
    if (!all.length) return '<div class="mine-empty"><p>No homemade levels yet. Make one in the 🛠 Level designer on the home screen, then come back here to play it together.</p></div>';
    return `<div class="mine-list">${all.map((l) => {
      const bad = hasErrors(checkLevel(l));
      const from = ids.has(l.id) ? (l.copy ? `by ${esc(l.author || 'a friend')} · ` : '') : `from ${esc(partnerName || 'your friend')} · `;
      return `<button class="mine-card ${l.id === picked ? 'picked' : ''}" data-act="pick" data-id="${l.id}" ${bad ? 'disabled' : ''}>
        <img src="${thumb(l)}" alt="" /><b>${esc(l.name)}</b>
        <small>${from}${bad ? '⛔ fix it in the designer' : isVerified(l) ? '✅ verified' : '⚠ not verified yet'}</small></button>`;
    }).join('')}</div>`;
  }

  /** Can the friend still save this homemade level (or a newer version of it)? */
  function canKeep(l: CustomLevel): boolean {
    const saved = getMyLevel(l.id);
    return !saved || (!!saved.copy && (levelHash(saved) !== levelHash(l) || isVerified(saved) !== isVerified(l)));
  }

  /** The last official level (16.12): its finish plays the small ending. */
  function isFinale(): boolean {
    return !isCustomId(level.id) && level.id === ALL_LEVELS[ALL_LEVELS.length - 1].id;
  }

  function resultsHtml(): string {
    if (!finish) return '';
    const stars = starsFor(finish.got === finish.total, finish.time, level.targetTime);
    const custom = isCustomId(level.id) ? (level as CustomLevel) : null;
    const nx = custom ? undefined : nextLevel(level.id);
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
      ${isFinale() ? '<div class="status ok">🔥💧 You reached the heart of the temple.</div>' : ''}
      ${custom && verifiedNow ? `<div class="status ok">✅ Level verified with ${esc(partnerName || 'your friend')}! It can be shared by link now.</div>` : ''}
      ${custom && canKeep(custom) ? `<button data-act="keep">💾 ${getMyLevel(custom.id) ? 'Update my copy' : 'Keep a copy of this level'}</button>` : ''}
      <div class="row">
        ${nx?.rows && !canPlay(nx.id, roomOwns()) ? '<button class="primary" data-act="offer">🔑 Unlock the next chapters</button>' : nx?.rows ? btn('next', 'Next level', 'primary') : ''}
        ${btn('retry', 'Retry')}
        ${btn('map', 'Level map')}
      </div>
      <div class="status">${pc}</div>
    </div>`;
  }

  // ---------------------------------------------------------------- level designer (16.3)
  function designerHtml(): string {
    const items = listLevels().map((l) => {
      const v = isVerified(l);
      const status = v ? `✅ Verified with ${esc(l.verified!.with || 'a friend')}` : hasErrors(checkLevel(l)) ? '⛔ Has problems to fix' : '⚠ Not verified yet';
      const by = l.copy ? `by ${esc(l.author || 'a friend')}` : l.basedOn ? `based on ${esc(l.basedOn)}’s level` : 'made by you';
      const del = pendingDelete === l.id;
      return `<div class="lvl-item">
        <img class="lvl-thumb" src="${thumb(l)}" alt="" />
        <div class="lvl-info"><b>${esc(l.name)}</b><small>${by} · ${status}</small></div>
        <div class="lvl-acts">
          ${l.copy ? `<button data-act="owncopy" data-id="${l.id}">Make my own copy</button>` : `<button class="secondary" data-act="edit" data-id="${l.id}">✎ Edit</button>`}
          ${v ? `<button data-act="sharelvl" data-id="${l.id}">Share</button>` : ''}
          <button class="${del ? 'danger' : ''}" data-act="dellvl" data-id="${l.id}" aria-label="Delete">${del ? 'Tap again to delete' : '🗑'}</button>
        </div>
      </div>`;
    }).join('');
    return `<div class="panel wide designer">
      <div class="map-head"><button data-act="tohome">← Home</button><h2>🛠 Level designer</h2><span></span></div>
      <button class="primary big" data-act="newlevel">+ New level</button>
      <div class="lvl-list">${items || '<p>No levels yet. Make your first one!</p>'}</div>
      <p class="small">A level gets its ✅ when you and a friend <b>finish it together</b>: create a room, open <b>🛠 My levels</b> on the temple map and play it.
      Only ✅ levels can be shared by link, and the link is also your backup. Levels are saved on this phone only.</p>
    </div>`;
  }

  function importHtml(): string {
    const l = importLevel;
    if (!l) return '';
    const saved = getMyLevel(l.id);
    const own = !!saved && !saved.copy;
    const v = isVerified(l);
    return `<div class="panel">
      <h2>${esc(l.name)}</h2>
      <img class="lvl-preview" src="${thumb(l, 8)}" alt="" />
      <p>by ${esc(l.author || 'someone')} · ${v ? `✅ verified (finished together with ${esc(l.verified!.with || 'a friend')})` : '⚠ not verified: nobody has proved it can be beaten yet'}</p>
      ${own ? '<p>This is your own level: it’s already in your levels.</p>' : ''}
      <div class="row">
        ${own ? '' : `<button class="primary big" data-act="savelvl">💾 ${saved ? 'Update my copy' : 'Save to My levels'}</button>`}
        <button data-act="tohome">${own ? 'OK' : 'Not now'}</button>
      </div>
      <p class="small">To play it: create a room with a friend and open 🛠 My levels on the temple map.</p>
    </div>`;
  }

  function openEdit(l: CustomLevel): void {
    if (editor) { editor.close(); editor = null; }
    show('editor');
    editor = openEditor({ stage, root: ui, toast, exit: () => show('designer') }, l);
  }

  const clone = (l: CustomLevel): CustomLevel => JSON.parse(JSON.stringify(l));

  function makeOwnCopy(src: CustomLevel): void {
    const now = Date.now();
    const l: CustomLevel = { ...clone(src), id: newId(), name: `${src.name} (my copy)`.slice(0, 24), author: myName, basedOn: src.author || 'a friend', created: now, updated: now };
    delete l.copy;
    delete l.verified;
    saveLevel(l);
    toast('Copy made: it starts without a ✅.');
    render();
  }

  async function shareLevel(l: CustomLevel | undefined): Promise<void> {
    if (!l || !isVerified(l)) return;
    const url = `${siteUrl()}?level=${encodeLink(l)}`;
    try {
      if (navigator.share) await navigator.share({ title: l.name, text: `Play my level “${l.name}” in Hot Boy & Cool Girl!`, url });
      else { await navigator.clipboard.writeText(url); toast('Level link copied'); }
    } catch {
      // share sheet closed
    }
  }

  function keepCopy(): void {
    const l = roomLevel(level.id);
    if (!l) return;
    const ok = saveLevel({ ...clone(l), copy: true, updated: Date.now() });
    toast(ok ? 'Saved to My levels 💾' : 'Couldn’t save on this phone.');
    render();
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
    else if (act === 'pick') { if (canPlay(el.dataset.id!, roomOwns())) pickLevel(el.dataset.id!, true); else showOffer(); }
    else if (act === 'offer') showOffer();
    else if (act === 'buy') void doBuy();
    else if (act === 'restore') void doRestore();
    else if (act === 'getapp') window.open(storeLink('website'), '_blank');
    else if (act === 'closeoffer') offerEl.classList.add('hidden');
    else if (act === 'ready') toggleReady();
    else if (act === 'choice') choose(el.dataset.c as Choice);
    else if (act === 'menu') openMenu();
    else if (act === 'resume') closeMenu();
    else if (act === 'home') { leaveRoom(); lostEl.classList.add('hidden'); }
    else if (act === 'update') { if (device.isNativeApp()) window.open(STORE_URL, '_blank'); else location.reload(); }
    else if (act === 'net') toast(netText());
    else if (act === 'fullscreen') fullscreenTapped();
    else if (act === 'pref') togglePref(el.dataset.k as PrefKey, el);
    else if (act === 'designer') show('designer');
    else if (act === 'tohome') { importLevel = null; show('home'); }
    else if (act === 'newlevel') {
      const l = blankLevel(`Level ${listLevels().length + 1}`, myName);
      if (saveLevel(l)) openEdit(l);
      else toast('Couldn’t save on this phone (storage is full or blocked).', 4000);
    }
    else if (act === 'edit') { const l = getMyLevel(el.dataset.id!); if (l && !l.copy) openEdit(l); }
    else if (act === 'owncopy') { const l = getMyLevel(el.dataset.id!); if (l) makeOwnCopy(l); }
    else if (act === 'sharelvl') void shareLevel(getMyLevel(el.dataset.id!));
    else if (act === 'dellvl') {
      const id = el.dataset.id!;
      if (pendingDelete === id) { deleteLevel(id); pendingDelete = ''; toast('Level deleted'); }
      else pendingDelete = id;
      render();
    }
    else if (act === 'tab') { mapTab = el.dataset.tab === 'mine' ? 'mine' : Number(el.dataset.tab) || 1; render(); }
    else if (act === 'keep') keepCopy();
    else if (act === 'savelvl' && importLevel) {
      const ok = saveLevel({ ...importLevel, copy: true });
      importLevel = null;
      toast(ok ? 'Saved to My levels 💾' : 'Couldn’t save on this phone.');
      show('designer');
    }
  });
  ui.addEventListener('input', (ev) => {
    const t = ev.target as HTMLInputElement;
    if (t.id === 'code') t.value = normalizeRoomCode(t.value);
    if (t.id === 'name') { myName = t.value.trim().slice(0, 12); saveName(myName); }
    if (t.dataset.pref) { (settings as unknown as Record<string, unknown>)[t.dataset.pref] = Number(t.value); applyPrefs(); }
  });
  ui.addEventListener('keydown', (ev) => {
    if ((ev.target as HTMLElement).id === 'code' && ev.key === 'Enter') void join(normalizeRoomCode((ev.target as HTMLInputElement).value));
  });

  // "Doesn't connect" is the review that sinks an online game, so every connection error says what to try (MARKETING_PLAN M13).
  const NET_HELP = 'Check that both phones are online. On shared or school Wi-Fi, try mobile data instead.';
  const setStatus = (text: string, err = false) => {
    const s = document.getElementById('status');
    if (s) { s.textContent = text; s.className = `status ${err ? 'err' : ''}`; }
  };

  /** Where shared links point: this website, or the real website from inside the store app (its own address is local). */
  const siteUrl = () => (device.isNativeApp() ? WEB_URL : `${location.origin}${location.pathname}`);
  const roomLink = () => `${siteUrl()}?room=${session.code}`;
  const rememberRoomInUrl = () => history.replaceState(null, '', `?room=${session.code}`);

  async function create(): Promise<void> {
    setStatus('Opening a room…');
    try {
      await session.create();
      myElem = 'fire'; // the host starts as Hot Boy (11.1)
      rememberRoomInUrl();
      show('invite');
    } catch (e) {
      setStatus(`${(e as Error).message} ${NET_HELP}`, true);
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
      setStatus(`${(e as Error).message} ${NET_HELP}`, true);
    }
  }

  async function shareLink(): Promise<void> {
    const url = roomLink();
    try {
      // The friend decides in a second: say what it is and that it costs nothing to join (MARKETING_PLAN M4).
      const text = `Play Hot Boy & Cool Girl with me: a co-op puzzle game, you on your phone and me on mine. Free, no download, no account. Room ${session.code}`;
      if (navigator.share) await navigator.share({ title: 'Hot Boy & Cool Girl', text, url });
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
    forgetRoomLevels();
    if (isCustomId(picked)) picked = ALL_LEVELS[0].id;
    mapTab = chapterOf(picked)?.n ?? 1;
    history.replaceState(null, '', location.pathname);
    goHomeStage();
    show('home');
  }

  function goHomeStage(): void {
    stage.setViewer(null);
    stage.setLevel(levelData(ALL_LEVELS[0]));
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
    if (tell && isCustomId(id)) {
      // My own level: share my latest saved version with my friend (16.3).
      const l = getMyLevel(id) ?? roomLevel(id);
      if (!l || hasErrors(checkLevel(l))) return;
      rememberRoomLevel(l);
    }
    if (!getLevel(id)?.rows) return;
    picked = id;
    mapTab = isCustomId(id) ? 'mine' : chapterOf(id)?.n ?? 1;
    readyMe = readyPartner = false;
    if (tell) sendPick(id);
    if (screen === 'lobby' || screen === 'map') render();
  }

  /** Tell my friend which level is picked; a homemade level travels along with it (about 1 KB). */
  function sendPick(id: string): void {
    if (isCustomId(id)) {
      const l = roomLevel(id) ?? getMyLevel(id);
      if (!l) return;
      rememberRoomLevel(l);
      send({ t: 'lvl', def: l });
    }
    send({ t: 'pick', id });
  }

  function toggleReady(): void {
    readyMe = !readyMe;
    send({ t: 'ready', id: picked, on: readyMe });
    if (readyMe) sfx.chime([659.25]);
    render();
    maybeStart();
  }

  function maybeStart(): void {
    if (session.isHost && readyMe && readyPartner && !versionProblem && canPlay(picked, roomOwns())) startLevel(picked);
  }

  /** Host: start (or restart) a level for both phones. */
  function startLevel(id: string): void {
    round++;
    const code = teamCodeFor(getLevel(id));
    send({ t: 'start', id, n: round, code });
    doStart(id, round, code);
  }

  // ---------------------------------------------------------------- team codes (16.7, G3, G11, G12)
  /** Chapters whose levels use a team code. */
  const CODE_CHAPTERS = [...new Set(ALL_LEVELS.flatMap((l) => (l.teamCode ? [l.teamCode] : [])))];

  /** Host: this pair's code for a password level (picked and saved now if there is none yet). */
  function teamCodeFor(def: LevelDef | CustomLevel | undefined): Animal[] | undefined {
    const ch = def && 'teamCode' in def ? def.teamCode : undefined;
    if (!ch) return undefined;
    let code = partnerId ? loadCode(ch, partnerId) : null;
    if (!code) {
      code = randomCode();
      if (partnerId) saveCode(ch, partnerId, code);
    }
    return code;
  }

  /** Both phones save the host's codes (12.4: next to progress). */
  function keepCodes(codes: unknown): void {
    if (!partnerId || !codes || typeof codes !== 'object') return;
    for (const [ch, code] of Object.entries(codes)) if (isCode(code)) saveCode(Number(ch), partnerId, code);
  }

  function doStart(id: string, n: number, code?: Animal[]): void {
    const def = getLevel(id);
    if (!def?.rows) return;
    if (isCustomId(id) && !roomLevel(id)) rememberRoomLevel(def as CustomLevel);
    level = def;
    verifiedNow = false;
    round = n;
    deaths = 0;
    readyMe = readyPartner = false;
    myChoice = partnerChoice = null;
    finish = null;
    if (code && !session.isHost && 'teamCode' in def && def.teamCode) keepCodes({ [def.teamCode]: code });
    const data = levelData(def, code);
    gemElems = data.gems.map((g) => g.elem);
    stage.setViewer(myElem); // Different eyes (16.7): you see only what your character sees
    stage.setLevel(data);
    stage.setLocal({ fire: myElem === 'fire', water: myElem === 'water' });
    stage.controlled = myElem;
    stage.inputEnabled = !menuOpen;
    stage.showMarker();
    if (id === ALL_LEVELS[0].id) stage.hintZones(); // zone hints on the first level only (6.3)
    resetRound();
    show('play');
    const ch = chapterOf(id);
    const riddle = ch && ch.levels[0].id === id ? riddleFor(ch, myElem) : '';
    if (riddle) showRiddle(riddle);
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
  /** Pause menu: both players leave the level for the level map (held like restart, 13.3). */
  function leaveToMap(): void {
    closeMenu();
    send({ t: 'lobby', by: myElem });
    finish = null;
    goMap();
  }

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
    stage.celebrate(isFinale());
    music.swell();
    if (isCustomId(level.id)) verifyTogether(level as CustomLevel, data.time);
    const stars = starsFor(data.got === data.total, data.time, level.targetTime);
    recordResult(level.id, stars, data.time); // saved on both phones (12.3)
    // Finishing a password chapter's vault level: the host picks the team's next code (G3, changed 2026-10-24).
    if (session.isHost && 'teamCode' in level && level.teamCode && level.pattern && partnerId) {
      const next = { [level.teamCode]: randomCode() };
      keepCodes(next);
      send({ t: 'codes', codes: next });
    }
    const n = round;
    setTimeout(() => {
      if (round !== n || screen !== 'play') return;
      myChoice = partnerChoice = null;
      show('results');
      music.jingle(stars);
      // stars count up with three rising notes
      for (let i = 0; i < stars; i++) setTimeout(() => sfx.chime([523.25 * Math.pow(1.26, i)], 0, 0.14), 300 + i * 350);
      // a whole chapter just cleared: the best moment to ask for a rating, once the stars have counted up
      const ch = chapterOf(level.id);
      if (ch && ch.levels[ch.levels.length - 1].id === level.id) setTimeout(() => void askForReview(), 2500);
    }, 1800);
  }

  /**
   * THE rule of the level designer (16.3): a homemade level gets its ✅ only here, when both
   * players reached their doors in a real online game. Both phones mark this exact version.
   */
  function verifyTogether(l: CustomLevel, time: number): void {
    verifiedNow = markVerified(l, time, partnerName || 'a friend');
    const saved = getMyLevel(l.id);
    if (saved && levelHash(saved) === levelHash(l) && !isVerified(saved)) {
      saved.verified = { ...l.verified! };
      saved.targetTime = l.targetTime;
      saveLevel(saved);
    }
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
    if (!isCustomId(picked)) mapTab = chapterOf(picked)?.n ?? 1; // open the map on the chapter you're playing
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
      <button class="hold-btn" id="hold-map"><span class="hold-ring"></span><span>Hold for the level map</span></button>
      ${device.isStandalone() ? '' : `<button data-act="fullscreen">${fsLabel()}</button>`}
      <button data-act="leave">Leave room</button>
      ${prefsHtml()}
    </div>`;
    menuEl.classList.remove('hidden');
    setupHold($<HTMLElement>('#hold', menuEl), requestRestart);
    setupHold($<HTMLElement>('#hold-map', menuEl), leaveToMap);
  }

  /** Sound, music and vibration (15.6): on/off buttons plus volume sliders. */
  function prefsHtml(): string {
    const tog = (k: PrefKey, label: string) => `<button class="pref${settings[k] ? ' on' : ''}" data-act="pref" data-k="${k}">${label}<small>${settings[k] ? 'On' : 'Off'}</small></button>`;
    const vol = (k: PrefKey, label: string) => `<label class="pref-vol">${label}<input type="range" min="0" max="1" step="0.05" data-pref="${k}" value="${settings[k]}" /></label>`;
    return `<div class="prefs">
      <div class="row">${tog('sound', '🔊 Sound')}${tog('music', '🎵 Music')}${'vibrate' in navigator ? tog('haptics', '📳 Vibration') : ''}</div>
      <div class="row">${vol('volume', '🔊')}${vol('musicVolume', '🎵')}</div>
    </div>`;
  }

  function applyPrefs(): void {
    sfx.configure(settings.sound, settings.volume);
    music.configure(settings.music, settings.musicVolume);
    savePrefs(settings);
  }

  function togglePref(k: PrefKey, btn: HTMLElement): void {
    const on = !settings[k];
    (settings as unknown as Record<string, unknown>)[k] = on;
    applyPrefs();
    btn.classList.toggle('on', on);
    btn.querySelector('small')!.textContent = on ? 'On' : 'Off';
    if (k === 'haptics' && on) device.haptic(30);
  }

  function closeMenu(): void {
    if (!menuOpen) return;
    menuOpen = false;
    menuEl.classList.add('hidden');
    stage.inputEnabled = !document.hidden;
    send({ t: 'status', s: '' });
  }

  /** The ring fills over 1 s while held, the button shakes and brightens; early release drains it (13.3). */
  function setupHold(btn: HTMLElement, done: () => void): void {
    let p = 0, holding = false, last = 0, raf = 0;
    const loop = (t: number) => {
      const dt = last ? (t - last) / 1000 : 0;
      last = t;
      p = Math.max(0, Math.min(1, p + (holding ? dt : -dt * 2)));
      btn.style.setProperty('--p', String(p));
      btn.classList.toggle('holding', holding && p > 0);
      if (p >= 1) {
        btn.classList.add('pop');
        if (settings.haptics) device.haptic(40);
        sfx.chime([392, 784], 0.05, 0.15);
        done();
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
      send({ t: 'hello', v: __BUILD__, pv: playVersion(), own: ownsGame() ? 1 : 0, name: myName, done: Object.keys(loadProgress()), id: phoneId() });
      sfx.chime([523.25, 783.99]); // "partner joined" (15.5)
      if (settings.haptics) device.haptic(30);
      if (screen === 'home' || screen === 'invite') show('lobby');
      else updateMusic();
    } else if (s === 'lost') {
      showLost();
      updateMusic();
    } else if (s === 'idle' && info) {
      forgetRoomLevels();
      goHomeStage();
      show('home');
      setStatus(info, true);
    }
    updateNet();
  }

  function showLost(): void {
    stage.inputEnabled = false;
    stage.controls.reset();
    stage.setPartnerStatus(other(myElem), '');
    lostEl.innerHTML = `<div class="panel">
      <h2>Waiting for your friend…</h2>
      <p>The connection dropped. We keep trying; they can also reopen the same link (room <b>${session.code}</b>) and you'll continue.</p>
      <p class="small">${NET_HELP}</p>
      <div class="spinner"></div>
      <button id="lost-home" data-act="home">Leave room</button>
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
        partnerId = typeof m.id === 'string' ? m.id.slice(0, 24) : '';
        partnerOwns = m.own === 1;
        // Tell the host which codes this phone remembers for this partner; the host settles them (G3, G12).
        if (partnerId && !session.isHost) send({ t: 'mycodes', codes: Object.fromEntries(CODE_CHAPTERS.map((ch) => [ch, loadCode(ch, partnerId)])) });
        const v = Number(m.v);
        // Friends can play together when the levels, physics and messages match (play version), even if other parts differ (13.6).
        const same = typeof m.pv === 'string' ? m.pv === playVersion() : v === __BUILD__;
        versionProblem = same ? '' : v > __BUILD__ ? 'Your friend has a newer version.' : 'Your friend has an older version: ask them to update the game.';
        if (!same && v > __BUILD__) showUpdate();
        if (session.isHost) {
          send({ t: 'roles', host: myElem });
          sendPick(picked);
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
      case 'lvl': {
        const l = sanitize(m.def); // never trust a level from another phone as-is
        if (l) rememberRoomLevel(l);
        break;
      }
      case 'pick':
        pickLevel(String(m.id), false);
        break;
      case 'own':
        partnerOwns = m.on === 1;
        if (screen === 'map' || screen === 'results') render();
        break;
      case 'ready':
        readyPartner = !!m.on && m.id === picked;
        if (readyPartner) sfx.chime([783.99]);
        if (screen === 'lobby' || screen === 'map') render();
        maybeStart();
        break;
      case 'start':
        doStart(String(m.id), Number(m.n), isCode(m.code) ? m.code : undefined);
        break;
      case 'mycodes': {
        // Host: keep my code for this pair; if I have none, take my friend's; if neither has one, pick a new one.
        if (!session.isHost || !partnerId) break;
        const theirs = (m.codes ?? {}) as Record<string, unknown>;
        const codes: Record<number, Animal[]> = {};
        for (const ch of CODE_CHAPTERS) {
          const t = theirs[ch];
          codes[ch] = loadCode(ch, partnerId) ?? (isCode(t) ? t : randomCode());
        }
        keepCodes(codes);
        send({ t: 'codes', codes });
        break;
      }
      case 'codes':
        if (!session.isHost) keepCodes(m.codes);
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
      case 'touch':
        if (n === round && screen === 'play') {
          partnerTouchT = performance.now();
          if (partnerTouchT - myTouchT < TOUCH_AGREE) stage.touchDeath();
        }
        break;
      case 'die':
        if (n === round && screen === 'play') {
          stage.remoteDeath(partner, m.cause as DeathCause);
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
        if (n === round && !session.isHost) stage.correctMech(m as MechSync);
        break;
      case 'stone':
        if (n === round && session.isHost && screen === 'play') {
          stage.remoteStone(Number(m.i));
          sendWorld();
        }
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
        if (m.by) { // from the pause menu, mid-level (not from the results screen)
          if (screen === 'play') toast(`${NAMES[m.by as Elem]} went to the level map`);
          closeMenu();
          finish = null;
        }
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
      <button class="primary big" data-act="update">${device.isNativeApp() ? 'Update in the store' : 'Tap to update'}</button>
    </div>`;
    lostEl.classList.remove('hidden');
  }

  // ---------------------------------------------------------------- the full game (12.6, decided 2026-10-31)
  /** The offer: after the last free level, or when a 🔑 level is tapped. Never in the middle of a level. */
  function showOffer(): void {
    const paid = CHAPTERS.filter((c) => c.n > FREE_CHAPTERS);
    const levels = paid.reduce((n, c) => n + c.levels.filter((l) => l.rows).length, 0);
    const app = canBuy();
    // The unlock is sold only in the Android app for now, so an iPhone gets no store button it can't use (MARKETING_PLAN M5).
    const iphone = !app && device.isIOS();
    const action = app
      ? `<button class="primary big" data-act="buy">Unlock for ${esc(priceText())}</button>`
      : iphone
        ? '<p>The full game is sold in the Android app for now, not yet on iPhone.</p>'
        : '<button class="primary big" data-act="getapp">Get the app on Google Play</button>';
    offerEl.innerHTML = `<div class="panel offer">
      <h2>🔑 The temple goes deeper</h2>
      <p>${levels} more levels: ${paid.map((c) => esc(c.name)).join(', ')}.</p>
      <ul class="offer-points">
        <li>✅ One purchase, yours forever. No ads, ever.</li>
        <li>🤝 Only one of you pays: when either of you owns it, you play every chapter together.</li>
      </ul>
      <div class="row">${action}</div>
      <p class="small">${app ? '<button class="linkish" data-act="restore">Restore my purchase</button> · ' : ''}${iphone ? 'You can still play every chapter with a friend who owns it on Android.' : 'Or play with a friend who owns it.'}</p>
      <button data-act="closeoffer">Not now</button>
    </div>`;
    offerEl.classList.remove('hidden');
  }

  function ownedNow(): void {
    send({ t: 'own', on: 1 });
    offerEl.classList.add('hidden');
    toast('🔑 Full game unlocked. Thank you!', 4000);
    sfx.chime([523.25, 659.25, 783.99]);
    if (screen === 'map' || screen === 'results') render();
  }

  async function doBuy(): Promise<void> {
    try { await buy(); } catch { toast('The purchase didn’t go through. Nothing was charged.', 4000); }
  }

  async function doRestore(): Promise<void> {
    try { await restore(); } catch { /* reported by the store */ }
    if (!ownsGame()) toast('No purchase found for this Google account.', 4000);
  }

  initBilling((owned) => { if (owned) ownedNow(); });

  // Store app: Android's back button goes one step back, like the screen's own back button (closes a popup,
  // pauses or resumes a level, results → map → characters → leave the room → home). On the home screen it
  // sends the app to the background like Home; it never closes the app.
  const BACK: Partial<Record<Screen, string>> = {
    results: '[data-act="choice"][data-c="map"]',
    map: '[data-act="tolobby"]',
    lobby: '[data-act="leave"]',
    invite: '[data-act="leave"]',
    designer: '[data-act="tohome"]',
    import: '[data-act="tohome"]',
    editor: '[data-ed="done"]', // saves first, like tapping Done
  };
  function backPressed(): boolean {
    const visible = (sel: string) => [...ui.querySelectorAll<HTMLElement>(sel)].find((b) => b.offsetParent !== null);
    const popup = visible('[data-act="closeoffer"]') ?? visible('#lost-home');
    if (popup) { popup.click(); return true; }
    if (screen === 'play') { if (menuOpen) closeMenu(); else openMenu(); return true; }
    const btn = BACK[screen] && visible(BACK[screen]!);
    if (btn) { btn.click(); return true; }
    return false;
  }
  if (device.isNativeApp()) {
    void import('@capacitor/app').then(({ App }) => {
      void App.addListener('backButton', () => { if (!backPressed()) void App.minimizeApp(); });
      // the app's own "hidden" signal, in case the web view doesn't report it on every phone
      void App.addListener('pause', () => device.setHidden(true));
      void App.addListener('resume', () => device.setHidden(false));
    });
  }
  // dev only: `?paywall&owned` pretends this phone bought the game, `?paywall&unowned` forgets it
  if (import.meta.env.DEV && paywallOn()) {
    const q = new URLSearchParams(location.search);
    if (q.has('owned')) setOwned(true);
    if (q.has('unowned')) setOwned(false);
  }

  // ---------------------------------------------------------------- update check (16.7)
  // The website asks for version.json (written by the build) when it opens and when you come back to it.
  // A newer one shows a banner, never in the middle of a level. The store app is updated by the store instead.
  var updateReady = false; // var: show() may read it before this line runs
  const updateBanner = document.createElement('div');
  updateBanner.className = 'update-banner hidden';
  updateBanner.innerHTML = '✨ New version available <button class="primary" data-act="update">Update</button>';
  ui.appendChild(updateBanner);
  function syncBanner(): void {
    // looked up, not captured: show() can run before this part of the setup has
    document.querySelector('.update-banner')?.classList.toggle('hidden', !updateReady || screen === 'play' || screen === 'editor');
  }
  async function checkForUpdate(): Promise<void> {
    if (device.isNativeApp() || updateReady) return;
    try {
      const r = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: 'no-store' });
      const v = Number(((await r.json()) as { v?: unknown }).v);
      if (v > __BUILD__) { updateReady = true; syncBanner(); }
    } catch {
      // offline or no version file (dev server): try again later
    }
  }
  void checkForUpdate();
  setInterval(() => void checkForUpdate(), 10 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void checkForUpdate(); });

  // Host: the shared world's state, so the guest's buttons/levers/platforms never drift apart (13.1, 13.2).
  function sendWorld(): void {
    if (screen !== 'play' || !session.connected || !session.isHost) return;
    session.sendFresh({ t: 'w', n: round, ...stage.mechState() });
  }
  setInterval(() => {
    if (stage.mech.levers.length || stage.mech.platforms.length || stage.mech.vault) sendWorld();
  }, 200);

  // Send my character ~30×/s while playing (13.2).
  setInterval(() => {
    if (screen !== 'play' || !session.connected) return;
    session.sendFresh({ t: 's', n: round, ...stage.snapshot(myElem), d: stage.atDoor(myElem) ? 1 : 0 });
  }, SNAPSHOT_MS);

  // HUD, connection dot, finish check, waiting timeout.
  const gemTotals = () => {
    const out = { fire: [0, 0], water: [0, 0] } as Record<Elem, [number, number]>;
    gemElems.forEach((e, i) => { out[e][1]++; if (collected.has(i)) out[e][0]++; });
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
  }, 100);

  function updateNet(): void {
    const r = session.rtt;
    // a friend silent for 2 s is a hiccup in progress: show it before the ping catches up
    netDot.textContent = !session.connected ? '⚪' : session.silentFor > 2000 ? '🔴' : Number.isNaN(r) ? '🟢' : r < 100 ? '🟢' : r < 200 ? '🟡' : '🔴';
  }

  function netText(): string {
    if (!session.connected) return 'Not connected';
    const path = { local: 'same Wi-Fi', direct: 'direct', relay: 'through the relay server', unknown: 'checking…' }[session.kind];
    const drop = session.lastDrop ? ` · last drop: ${session.lastDrop}` : '';
    return `Ping ${Number.isNaN(session.rtt) ? '…' : Math.round(session.rtt) + ' ms'} · ${path}${drop}`;
  }

  // ---------------------------------------------------------------- go
  show('home');
  const linkLevel = new URLSearchParams(location.search).get('level');
  if (linkLevel !== null) {
    history.replaceState(null, '', location.pathname);
    importLevel = decodeLink(linkLevel);
    if (importLevel) show('import');
    else setStatus('This level link is broken or cut off. Ask your friend to send it again.', true);
  }
  const linkCode = normalizeRoomCode(new URLSearchParams(location.search).get('room') ?? '');
  if (linkCode.length === 4) {
    setStatus(`Joining room ${linkCode}…`);
    void join(linkCode); // opening a room link joins automatically (11.1)
  }
  if (import.meta.env.DEV) Object.assign(window, { __game: { stage, session, get round() { return round; }, get screen() { return screen; } } });
}
