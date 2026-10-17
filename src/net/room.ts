import Peer, { type DataConnection, type PeerError } from 'peerjs';

// Peer IDs live on the public PeerJS broker, so namespace them to avoid clashing with other apps.
const ID_PREFIX = 'hbcg-v1-';
// No I/O/0/1 so codes are easy to read out loud.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_LENGTH = 4;
const CONNECT_TIMEOUT_MS = 15000;

export type ConnectionKind = 'local' | 'direct' | 'relay' | 'unknown';

export interface RoomEvents {
  onConnected(): void;
  onMessage(msg: unknown): void;
  onDisconnected(reason: string): void;
}

export function makeRoomCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return code;
}

export function normalizeRoomCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z]/g, '').slice(0, CODE_LENGTH);
}

function waitForPeerOpen(peer: Peer): Promise<string> {
  return new Promise((resolve, reject) => {
    const onOpen = (id: string) => { cleanup(); resolve(id); };
    const onError = (err: PeerError<string>) => { cleanup(); reject(err); };
    const cleanup = () => { peer.off('open', onOpen); peer.off('error', onError); };
    peer.on('open', onOpen);
    peer.on('error', onError);
  });
}

/**
 * A two-player room over WebRTC. The host owns a short room code; the guest joins with it.
 * After connecting, both sides are symmetric: send() / onMessage.
 */
export class Room {
  private conn: DataConnection | null = null;
  private closed = false;

  private constructor(
    private readonly peer: Peer,
    readonly code: string,
    readonly isHost: boolean,
    private readonly events: RoomEvents,
  ) {
    // Losing the broker doesn't drop an open data channel, but we need it to accept new connections.
    peer.on('disconnected', () => { if (!this.closed && !peer.destroyed) peer.reconnect(); });
  }

  static async host(events: RoomEvents): Promise<Room> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = makeRoomCode();
      const peer = new Peer(ID_PREFIX + code, { debug: 1 });
      try {
        await waitForPeerOpen(peer);
      } catch (err) {
        peer.destroy();
        if ((err as PeerError<string>).type === 'unavailable-id') continue; // code taken, roll again
        throw new Error(`Could not reach the matchmaking server (${(err as PeerError<string>).type}).`);
      }
      const room = new Room(peer, code, true, events);
      peer.on('connection', (c) => {
        if (room.conn) { c.on('open', () => c.close()); return; } // room is full
        room.attach(c);
      });
      return room;
    }
    throw new Error('Could not create a room, please try again.');
  }

  static async join(rawCode: string, events: RoomEvents): Promise<Room> {
    const code = normalizeRoomCode(rawCode);
    if (code.length !== CODE_LENGTH) throw new Error(`Room codes are ${CODE_LENGTH} letters.`);
    const peer = new Peer({ debug: 1 });
    try {
      await waitForPeerOpen(peer);
    } catch (err) {
      peer.destroy();
      throw new Error(`Could not reach the matchmaking server (${(err as PeerError<string>).type}).`);
    }
    const room = new Room(peer, code, false, events);
    const conn = peer.connect(ID_PREFIX + code, { reliable: true, serialization: 'json' });

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => fail(new Error('Connection timed out. The network may need a relay server.')), CONNECT_TIMEOUT_MS);
      const onPeerError = (err: PeerError<string>) => {
        fail(new Error(err.type === 'peer-unavailable' ? `Room ${code} not found.` : `Connection failed (${err.type}).`));
      };
      const fail = (e: Error) => { clearTimeout(timer); peer.off('error', onPeerError); room.close(); reject(e); };
      conn.on('open', () => { clearTimeout(timer); peer.off('error', onPeerError); resolve(); });
      peer.on('error', onPeerError);
      room.attach(conn);
    });
    return room;
  }

  get connected(): boolean {
    return !!this.conn?.open;
  }

  send(msg: unknown): void {
    if (this.conn?.open) this.conn.send(msg);
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.conn?.close();
    this.peer.destroy();
  }

  /** Which network path the WebRTC connection ended up using. */
  async connectionKind(): Promise<ConnectionKind> {
    const pc = this.conn?.peerConnection;
    if (!pc) return 'unknown';
    const stats = await pc.getStats();
    let pairId: string | undefined;
    stats.forEach((r) => { if (r.type === 'transport' && r.selectedCandidatePairId) pairId = r.selectedCandidatePairId; });
    let pair: any;
    stats.forEach((r) => {
      if (r.type !== 'candidate-pair') return;
      if (pairId ? r.id === pairId : r.nominated && r.state === 'succeeded') pair = r;
    });
    if (!pair) return 'unknown';
    const local = stats.get(pair.localCandidateId)?.candidateType;
    const remote = stats.get(pair.remoteCandidateId)?.candidateType;
    if (local === 'relay' || remote === 'relay') return 'relay';
    if (local === 'host' && remote === 'host') return 'local';
    return 'direct';
  }

  private attach(c: DataConnection): void {
    this.conn = c;
    const onOpen = () => this.events.onConnected();
    if (c.open) onOpen(); else c.on('open', onOpen);
    c.on('data', (d) => this.events.onMessage(d));
    c.on('close', () => { if (!this.closed) this.events.onDisconnected('The other player left.'); });
    c.on('error', (e) => { if (!this.closed) this.events.onDisconnected(`Connection error: ${e.type}`); });
  }
}
