// Device + network smoke test. Proves rendering, touch, haptics, audio and phone-to-phone
// networking work on real phones before the game itself is built on top of these modules.
import { Application, Graphics, type FederatedPointerEvent } from 'pixi.js';
import { ParticleSystem, makeGlowTexture } from './render/particles';
import * as device from './engine/device';
import { Room, normalizeRoomCode, type ConnectionKind, type RoomEvents } from './net/room';

type Elem = 'fire' | 'water';
type FxKind = 'burst' | 'trail';
type Msg =
  | { t: 'ping'; ts: number }
  | { t: 'pong'; ts: number }
  | { t: 'fx'; x: number; y: number; e: Elem; k: FxKind };

const FIRE = [0xff7a1f, 0xffb347, 0xff4e1a, 0xffd27a];
const WATER = [0x29b6ff, 0x7fdcff, 0x1d7cf2, 0xc8f2ff];
const MOTES = [0xf2c35b, 0x9be37a, 0xfff2b0];
const TRAIL_SEND_INTERVAL_MS = 33;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function mixColor(a: number, b: number, t: number): number {
  const ch = (s: number) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

export async function startDeviceTest(): Promise<void> {
  const app = new Application();
  await app.init({
    resizeTo: window,
    background: '#07110d',
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
    preference: 'webgl',
  });
  $('app').appendChild(app.canvas);

  const bg = new Graphics();
  const drawBg = () => {
    const { width: w, height: h } = app.screen;
    const bands = 32;
    bg.clear();
    for (let i = 0; i < bands; i++) bg.rect(0, (h * i) / bands, w, h / bands + 1).fill(mixColor(0x0d2419, 0x040907, i / (bands - 1)));
  };
  drawBg();
  app.renderer.on('resize', drawBg);

  const particles = new ParticleSystem(makeGlowTexture(64));
  app.stage.addChild(bg, particles.view);

  // ---------- effects ----------
  function spawn(x: number, y: number, e: Elem, k: FxKind): void {
    const fire = e === 'fire';
    const colors = fire ? FIRE : WATER;
    if (k === 'burst') {
      particles.emit({ x, y, count: 1, colors: [0xffffff], speed: [0, 0], life: [0.16, 0.2], size: [110, 130], alpha: 0.55 });
      particles.emit({
        x, y, count: 46, colors, speed: [80, 460], life: [0.4, 1.0], size: [8, 26],
        angle: -Math.PI / 2, spread: Math.PI, gravity: fire ? -320 : 620, drag: 0.12,
      });
    } else {
      particles.emit({
        x, y, count: 5, colors, speed: [10, 90], life: [0.3, 0.6], size: [8, 18],
        angle: -Math.PI / 2, spread: Math.PI, gravity: fire ? -360 : 360, drag: 0.3,
      });
    }
  }

  function feedback(e: Elem, remote: boolean): void {
    device.haptic(remote ? 6 : 14);
    if (e === 'fire') device.blip(170, 'sawtooth', 0.14, remote ? 0.05 : 0.08);
    else device.blip(640, 'sine', 0.14, remote ? 0.1 : 0.18);
  }

  let moteTimer = 0;
  let frames = 0;
  let measuredHz = 0;
  let hzWindowStart = performance.now();
  app.ticker.add((ticker) => {
    const dt = Math.min(ticker.deltaMS / 1000, 0.05);
    moteTimer -= dt;
    if (moteTimer <= 0) {
      moteTimer = 0.08;
      const { width: w, height: h } = app.screen;
      particles.emit({
        x: Math.random() * w, y: h * (0.4 + Math.random() * 0.65), count: 1, colors: MOTES,
        speed: [8, 30], life: [3, 6], size: [4, 10], angle: -Math.PI / 2, spread: 0.8, alpha: 0.35,
      });
    }
    particles.update(dt);

    frames++;
    const now = performance.now();
    if (now - hzWindowStart >= 1000) {
      measuredHz = (frames * 1000) / (now - hzWindowStart);
      frames = 0;
      hzWindowStart = now;
    }
  });

  // ---------- UI ----------
  $('ui').innerHTML = `
    <div class="stats" id="stats"></div>
    <div class="toolbar">
      <button id="btn-fs">⛶ Fullscreen</button>
      <button id="btn-net" class="secondary">🌐 Online test</button>
    </div>
    <div class="net-badge hidden" id="badge"></div>
    <div class="overlay" id="start">
      <div class="panel">
        <h1><span class="hot">Hot Boy</span> &amp; <span class="cool">Cool Girl</span></h1>
        <p>Device test: tap or drag anywhere. Left side makes fire, right side makes water.</p>
        <button class="primary" id="btn-start">Tap to start</button>
        <p id="install-hint"></p>
      </div>
    </div>
    <div class="overlay hidden" id="net">
      <div class="panel">
        <h2>Online test</h2>
        <p>One phone creates a room, the other joins with the code. Then tap: your particles show up on both screens.</p>
        <div class="row"><button class="primary" id="btn-host">Create room</button></div>
        <div class="code hidden" id="code"></div>
        <div class="row">
          <input class="code-input" id="code-in" maxlength="4" placeholder="CODE" autocomplete="off" autocapitalize="characters" spellcheck="false" />
          <button class="secondary" id="btn-join">Join</button>
        </div>
        <div class="status" id="status"></div>
        <div class="row">
          <button id="btn-leave" class="hidden">Leave room</button>
          <button id="btn-close">Close</button>
        </div>
      </div>
    </div>`;

  if (!device.isStandalone()) {
    const ios = /iPhone|iPad/.test(navigator.userAgent);
    $('install-hint').textContent = ios
      ? 'Tip: Share → "Add to Home Screen" for true fullscreen.'
      : 'Tip: browser menu → "Add to Home screen" for true fullscreen.';
  }
  if (!device.canFullscreen() || device.isStandalone()) $('btn-fs').classList.add('hidden');

  $('btn-start').addEventListener('click', () => {
    device.unlock();
    device.blip(440, 'sine', 0.2, 0.15);
    device.haptic(20);
    $('start').classList.add('hidden');
  });
  $('btn-fs').addEventListener('click', () => {
    device.unlock();
    device.enterFullscreenLandscape().catch(() => {});
  });

  // ---------- touch ----------
  const pointers = new Map<number, number>(); // pointerId -> last trail send time
  let room: Room | null = null;
  const myElem = (x: number): Elem => (room?.connected ? (room.isHost ? 'fire' : 'water') : x < app.screen.width / 2 ? 'fire' : 'water');

  const sendFx = (x: number, y: number, e: Elem, k: FxKind) => {
    if (room?.connected) room.send({ t: 'fx', x: x / app.screen.width, y: y / app.screen.height, e, k } satisfies Msg);
  };

  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;
  app.stage.on('pointerdown', (ev: FederatedPointerEvent) => {
    const { x, y } = ev.global;
    const e = myElem(x);
    pointers.set(ev.pointerId, performance.now());
    spawn(x, y, e, 'burst');
    feedback(e, false);
    sendFx(x, y, e, 'burst');
  });
  app.stage.on('pointermove', (ev: FederatedPointerEvent) => {
    const last = pointers.get(ev.pointerId);
    if (last === undefined) return;
    const { x, y } = ev.global;
    const e = myElem(x);
    spawn(x, y, e, 'trail');
    const now = performance.now();
    if (now - last >= TRAIL_SEND_INTERVAL_MS) {
      pointers.set(ev.pointerId, now);
      sendFx(x, y, e, 'trail');
    }
  });
  const release = (ev: FederatedPointerEvent) => pointers.delete(ev.pointerId);
  app.stage.on('pointerup', release);
  app.stage.on('pointerupoutside', release);
  app.stage.on('pointercancel', release);

  // ---------- network ----------
  let pingMs = NaN;
  let kind: ConnectionKind = 'unknown';
  let pingTimer = 0;

  const setStatus = (text: string, cls: '' | 'ok' | 'err' = '') => {
    const s = $('status');
    s.textContent = text;
    s.className = `status ${cls}`;
  };
  const kindLabel: Record<ConnectionKind, string> = {
    local: 'same Wi-Fi (LAN)',
    direct: 'direct over internet',
    relay: 'via relay server',
    unknown: 'checking path…',
  };
  const updateBadge = () => {
    const b = $('badge');
    if (!room?.connected) { b.classList.add('hidden'); return; }
    b.classList.remove('hidden');
    const role = room.isHost ? '🔥 You are Hot Boy' : '💧 You are Cool Girl';
    b.textContent = `${role} · ${Number.isNaN(pingMs) ? '…' : Math.round(pingMs) + ' ms'} · ${kindLabel[kind]}`;
  };
  const resetNetUi = () => {
    $('code').classList.add('hidden');
    $('btn-leave').classList.add('hidden');
    ($('btn-host') as HTMLButtonElement).disabled = false;
    ($('btn-join') as HTMLButtonElement).disabled = false;
  };
  const leave = () => {
    room?.close();
    room = null;
    clearInterval(pingTimer);
    pingMs = NaN;
    kind = 'unknown';
    resetNetUi();
    updateBadge();
  };

  const events: RoomEvents = {
    onConnected() {
      setStatus('Connected! Close this window and tap the screen.', 'ok');
      $('btn-leave').classList.remove('hidden');
      device.haptic(40);
      device.blip(880, 'sine', 0.25, 0.15);
      let tick = 0;
      clearInterval(pingTimer);
      pingTimer = window.setInterval(() => {
        if (!room?.connected) return;
        room.send({ t: 'ping', ts: performance.now() } satisfies Msg);
        if (tick++ % 5 === 0) room.connectionKind().then((k) => { kind = k; updateBadge(); }).catch(() => {});
      }, 1000);
      updateBadge();
    },
    onMessage(raw) {
      const m = raw as Msg;
      if (!m || typeof m !== 'object') return;
      if (m.t === 'ping') room?.send({ t: 'pong', ts: m.ts } satisfies Msg);
      else if (m.t === 'pong') {
        const rtt = performance.now() - m.ts;
        pingMs = Number.isNaN(pingMs) ? rtt : pingMs * 0.7 + rtt * 0.3;
        updateBadge();
      } else if (m.t === 'fx' && (m.e === 'fire' || m.e === 'water')) {
        spawn(m.x * app.screen.width, m.y * app.screen.height, m.e, m.k === 'trail' ? 'trail' : 'burst');
        if (m.k === 'burst') feedback(m.e, true);
      }
    },
    onDisconnected(reason) {
      leave();
      setStatus(reason, 'err');
      $('net').classList.remove('hidden');
    },
  };

  $('btn-net').addEventListener('click', () => { device.unlock(); $('net').classList.remove('hidden'); });
  $('btn-close').addEventListener('click', () => $('net').classList.add('hidden'));
  $('btn-leave').addEventListener('click', () => { leave(); setStatus('Left the room.'); });

  $('btn-host').addEventListener('click', async () => {
    leave();
    ($('btn-host') as HTMLButtonElement).disabled = true;
    setStatus('Creating room…');
    try {
      room = await Room.host(events);
      const code = $('code');
      code.textContent = room.code;
      code.classList.remove('hidden');
      $('btn-leave').classList.remove('hidden');
      setStatus('Waiting for the other phone to join with this code…');
    } catch (err) {
      resetNetUi();
      setStatus((err as Error).message, 'err');
    }
  });

  const codeIn = $('code-in') as HTMLInputElement;
  codeIn.addEventListener('input', () => { codeIn.value = normalizeRoomCode(codeIn.value); });
  const join = async () => {
    const code = normalizeRoomCode(codeIn.value);
    leave();
    ($('btn-join') as HTMLButtonElement).disabled = true;
    setStatus(`Joining room ${code}…`);
    try {
      room = await Room.join(code, events);
    } catch (err) {
      room = null;
      resetNetUi();
      setStatus((err as Error).message, 'err');
    }
  };
  $('btn-join').addEventListener('click', join);
  codeIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') void join(); });

  // ---------- stats ----------
  const stats = $('stats');
  setInterval(() => {
    const { width: w, height: h } = app.screen;
    stats.textContent =
      `${Math.round(measuredHz)} fps · ${app.renderer.name}\n` +
      `${w}×${h} css · dpr ${window.devicePixelRatio.toFixed(2)} → res ${app.renderer.resolution}\n` +
      `${particles.count} particles`;
  }, 500);
}

