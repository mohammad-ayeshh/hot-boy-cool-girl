// Touch + keyboard controls (design doc 6.2–6.4).
// Left ~40% of the screen: put a thumb down anywhere and slide left/right to walk.
// Right ~40%: tap to jump, hold for a higher jump. The middle 20% does nothing.

export interface ControlOptions {
  deadZone: number; // CSS px (≈ points)
  anchorFollows: boolean;
  anchorLeash: number;
}

export interface MoveTouch {
  anchorX: number;
  anchorY: number;
  x: number;
  y: number;
}

export class Controls {
  /** Current move direction from touch or keys. */
  dir: -1 | 0 | 1 = 0;
  jumpHeld = false;
  /** Set when jump goes down; the game clears it with consumeJump(). */
  private jumpQueued = false;
  /** Bumped on any touch/key, so hints can fade after real play. */
  lastActivity = 0;

  private moveId: number | null = null;
  move: MoveTouch | null = null;
  private touchDir: -1 | 0 | 1 = 0;
  private jumpIds = new Set<number>();
  private keys = new Set<string>();
  private keyJump = false;

  constructor(private readonly el: HTMLElement, public opts: ControlOptions) {
    el.addEventListener('pointerdown', this.onDown);
    el.addEventListener('pointermove', this.onMove);
    el.addEventListener('pointerup', this.onUp);
    el.addEventListener('pointercancel', this.onUp);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKey);
    window.addEventListener('blur', this.reset);
  }

  consumeJump(): boolean {
    const j = this.jumpQueued;
    this.jumpQueued = false;
    return j;
  }

  reset = (): void => {
    this.moveId = null;
    this.move = null;
    this.touchDir = 0;
    this.jumpIds.clear();
    this.keys.clear();
    this.keyJump = false;
    this.update();
  };

  private zone(x: number): 'move' | 'jump' | 'none' {
    const w = this.el.clientWidth;
    if (x < w * 0.4) return 'move';
    if (x > w * 0.6) return 'jump';
    return 'none';
  }

  private onDown = (e: PointerEvent): void => {
    this.lastActivity = performance.now();
    const z = this.zone(e.clientX);
    if (z === 'move' && this.moveId === null) {
      this.moveId = e.pointerId;
      this.move = { anchorX: e.clientX, anchorY: e.clientY, x: e.clientX, y: e.clientY };
      this.touchDir = 0;
    } else if (z === 'jump') {
      if (this.jumpIds.size === 0) this.jumpQueued = true;
      this.jumpIds.add(e.pointerId);
    } else return;
    this.el.setPointerCapture?.(e.pointerId);
    this.update();
  };

  private onMove = (e: PointerEvent): void => {
    if (e.pointerId !== this.moveId || !this.move) return;
    const m = this.move;
    m.x = e.clientX;
    m.y = e.clientY;
    const dx = m.x - m.anchorX;
    const dz = this.opts.deadZone;
    if (this.touchDir === 0) {
      if (dx > dz) this.touchDir = 1;
      else if (dx < -dz) this.touchDir = -1;
    } else if (Math.sign(dx) === -this.touchDir && Math.abs(dx) > dz * 0.3) {
      // Slid back past the first touch point: turn around without lifting the thumb.
      this.touchDir = -this.touchDir as -1 | 1;
    }
    if (this.opts.anchorFollows) {
      const leash = this.opts.anchorLeash;
      if (dx > leash) m.anchorX = m.x - leash;
      else if (dx < -leash) m.anchorX = m.x + leash;
    }
    m.anchorY += (m.y - m.anchorY) * 0.2;
    this.update();
  };

  private onUp = (e: PointerEvent): void => {
    if (e.pointerId === this.moveId) {
      this.moveId = null;
      this.move = null;
      this.touchDir = 0;
    }
    this.jumpIds.delete(e.pointerId);
    this.update();
  };

  private onKey = (e: KeyboardEvent): void => {
    if (e.target instanceof HTMLInputElement) return;
    const k = e.code;
    const isJump = k === 'Space' || k === 'ArrowUp' || k === 'KeyW';
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'KeyA' || k === 'KeyD';
    if (!isJump && !isMove) return;
    e.preventDefault();
    this.lastActivity = performance.now();
    if (e.type === 'keydown') {
      if (isJump && !this.keyJump && !e.repeat) this.jumpQueued = true;
      if (isJump) this.keyJump = true;
      this.keys.add(k);
    } else {
      if (isJump) this.keyJump = false;
      this.keys.delete(k);
    }
    this.update();
  };

  private update(): void {
    const l = this.keys.has('ArrowLeft') || this.keys.has('KeyA');
    const r = this.keys.has('ArrowRight') || this.keys.has('KeyD');
    const keyDir = l === r ? 0 : l ? -1 : 1;
    this.dir = this.touchDir !== 0 ? this.touchDir : keyDir;
    this.jumpHeld = this.jumpIds.size > 0 || this.keyJump;
  }
}
