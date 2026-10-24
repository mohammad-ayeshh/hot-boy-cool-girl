// Small picture of a level for the My levels list and the link preview.
import { COLS, ROWS } from '../game/level';
import { levelHash, type CustomLevel } from '../game/custom';

const COLOR: Record<string, string> = {
  '#': '#55695f', L: '#ff6a1a', W: '#1fa3ff', P: '#a23be8', h: '#ff8a2a', H: '#ff8a2a', c: '#3fb8ff', C: '#3fb8ff',
};
const cache = new Map<string, string>();

/** A data-URL PNG, `px` pixels per tile. */
export function thumb(l: CustomLevel, px = 4): string {
  const key = `${levelHash(l)}:${px}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = COLS * px;
  c.height = ROWS * px;
  const g = c.getContext('2d')!;
  g.fillStyle = '#0a1211';
  g.fillRect(0, 0, c.width, c.height);
  l.rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch === 'r' || ch === 'b') {
      g.fillStyle = ch === 'r' ? '#ffb02e' : '#7adfff';
      g.fillRect(x * px + px / 4, y * px + px / 4, px / 2, px / 2);
      return;
    }
    const col = COLOR[ch];
    if (!col) return;
    g.fillStyle = col;
    if (ch === 'H' || ch === 'C') g.fillRect(x * px, (y - 1) * px, px, px * 2); // doors are tall
    else g.fillRect(x * px, y * px, px, px);
  }));
  g.fillStyle = '#f2c35b';
  for (const m of l.mechs) {
    if (m.kind === 'gate') g.fillRect(m.x * px, m.y * px, m.w * px, m.h * px);
    else if (m.kind === 'platform') g.fillRect(m.x * px, m.y * px, m.w * px, px / 2);
    else if (m.kind !== 'carving') g.fillRect(m.x * px, m.y * px + px / 2, px, px / 2); // carvings are only wall decoration
  }
  const url = c.toDataURL();
  cache.set(key, url);
  return url;
}
