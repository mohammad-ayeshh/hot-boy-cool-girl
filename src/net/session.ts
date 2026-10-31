// A play session with one friend: create or join a room, keep it alive, and come back after drops
// (design doc 13.5–13.7). The room code stays the same for the whole session.
// If the host disappears, whoever is still around takes over the code, so either player can
// reopen the same link and land back in the room.
import { Room, RoomNotFoundError, RoomTakenError, normalizeRoomCode, type ConnectionKind, type RoomEvents } from './room';

export type SessionStatus = 'idle' | 'connecting' | 'waiting' | 'connected' | 'lost';

export interface SessionEvents {
  status(s: SessionStatus, info?: string): void;
  message(msg: Record<string, unknown>): void;
}

const HEARTBEAT_MS = 1000;
const SILENT_LIMIT_MS = 6000;
// Silent, but the browser says the path still works: a Wi-Fi hiccup (busy router, phone power saving).
// Give it longer before calling it a drop, since a full reconnect takes several seconds.
const HICCUP_LIMIT_MS = 15000;
// Position updates are only useful while fresh: when this much is already queued, skip one instead of
// adding to the pile (all messages go in order, so a pile-up delays everything behind it).
const BACKLOG_LIMIT = 16 * 1024;
const REJOIN_EVERY_MS = 3000;

export class Session {
  code = '';
  status: SessionStatus = 'idle';
  /** Smoothed round-trip time in ms (NaN until measured). */
  rtt = NaN;
  kind: ConnectionKind = 'unknown';
  /** What the last drop looked like, for the connection info (e.g. "same Wi-Fi, 6 s silent"). */
  lastDrop = '';
  private room: Room | null = null;
  private beat = 0;
  private rejoinTimer = 0;
  private beats = 0;
  private ended = false;
  private readonly events: SessionEvents;

  constructor(events: SessionEvents) {
    this.events = events;
  }

  get isHost(): boolean {
    return !!this.room?.isHost;
  }

  get connected(): boolean {
    return this.status === 'connected';
  }

  /** Make a brand-new room and wait for the friend. */
  async create(): Promise<void> {
    this.ended = false;
    this.set('connecting');
    this.room = await Room.host(this.roomEvents());
    this.code = this.room.code;
    this.set('waiting');
    this.startHeartbeat();
  }

  /** Join a friend's room; if nobody hosts that code (anymore), open it ourselves and wait. */
  async join(rawCode: string): Promise<void> {
    this.ended = false;
    this.code = normalizeRoomCode(rawCode);
    this.set('connecting');
    try {
      await this.joinOrHost();
    } catch (err) {
      this.set('idle');
      throw err;
    }
    this.startHeartbeat();
  }

  send(msg: Record<string, unknown>): void {
    if (this.status === 'connected') this.room?.send(msg);
  }

  /** For frequent updates that the next one replaces (positions, world state): skipped during a pile-up. */
  sendFresh(msg: Record<string, unknown>): void {
    if (this.status === 'connected' && (this.room?.backlog ?? 0) < BACKLOG_LIMIT) this.room?.send(msg);
  }

  /** Milliseconds the friend has been silent while connected (0 if not connected). */
  get silentFor(): number {
    return this.status === 'connected' ? this.room?.silentFor ?? 0 : 0;
  }

  leave(): void {
    this.ended = true;
    this.send({ t: 'bye' });
    clearInterval(this.beat);
    clearTimeout(this.rejoinTimer);
    const r = this.room;
    this.room = null;
    setTimeout(() => r?.close(), 200);
    this.set('idle');
  }

  private async joinOrHost(): Promise<void> {
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (this.ended) return;
      try {
        this.room = await Room.join(this.code, this.roomEvents());
        return; // onConnected fires through the events
      } catch (err) {
        lastError = err;
        if (!(err instanceof RoomNotFoundError)) continue; // timeout or network hiccup: just try again
      }
      try {
        this.room = await Room.host(this.roomEvents(), this.code);
        this.set('waiting');
        return;
      } catch (err) {
        if (!(err instanceof RoomTakenError)) throw err;
        // Someone took the code a moment ago: try joining them instead.
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Could not open the room, please try again.');
  }

  private roomEvents(): RoomEvents {
    return {
      onConnected: () => {
        clearTimeout(this.rejoinTimer);
        // When joining, this fires just before Room.join() resolves; wait a tick so this.room is set
        // and the first messages (hello) can be sent.
        setTimeout(() => { if (!this.ended && this.room?.connected) this.set('connected'); }, 0);
      },
      onMessage: (raw) => {
        const m = raw as Record<string, unknown>;
        if (!m || typeof m !== 'object') return;
        if (m.t === 'ping') this.room?.send({ t: 'pong', ts: m.ts });
        else if (m.t === 'pong') {
          const r = performance.now() - (m.ts as number);
          this.rtt = Number.isNaN(this.rtt) ? r : this.rtt * 0.7 + r * 0.3;
        } else if (m.t === 'full') {
          this.ended = true;
          this.room?.close();
          this.room = null;
          this.set('idle', 'This room is full.');
        } else this.events.message(m);
      },
      onDisconnected: (reason) => { this.noteDrop(reason); this.lost(); },
    };
  }

  private lost(): void {
    if (this.ended || !this.room) return;
    this.rtt = NaN;
    this.set('lost');
    if (this.room.isHost) return; // the room stays open; the friend can come back to it
    // Guest: the host may be gone. Keep trying the same code (and take it over if it's free).
    this.room.close();
    this.room = null;
    const retry = () => {
      if (this.ended || this.status === 'connected') return;
      this.joinOrHost().catch(() => {
        this.rejoinTimer = window.setTimeout(retry, REJOIN_EVERY_MS);
      });
    };
    this.rejoinTimer = window.setTimeout(retry, 500);
  }

  private startHeartbeat(): void {
    clearInterval(this.beat);
    this.beat = window.setInterval(() => {
      const room = this.room;
      if (!room || this.status !== 'connected') return;
      room.send({ t: 'ping', ts: performance.now() });
      // A phone that went to sleep may never send "close": notice the silence ourselves.
      const silent = room.silentFor;
      if (silent > (room.pathAlive ? HICCUP_LIMIT_MS : SILENT_LIMIT_MS)) {
        this.noteDrop(`${Math.round(silent / 1000)} s silent`);
        if (room.isHost) room.dropPartner();
        this.lost();
        return;
      }
      if (this.beats++ % 5 === 0) room.connectionKind().then((k) => { this.kind = k; }).catch(() => {});
    }, HEARTBEAT_MS);
  }

  private noteDrop(why: string): void {
    const path = { local: 'same Wi-Fi', direct: 'direct', relay: 'relay', unknown: 'unknown path' }[this.kind];
    this.lastDrop = `${path}, ${why}`;
  }

  private set(s: SessionStatus, info?: string): void {
    this.status = s;
    this.events.status(s, info);
  }
}
