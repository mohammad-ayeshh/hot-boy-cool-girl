// The 8 temple animals of the password gates (design doc 16.7, G5), drawn in code as carved silhouettes.
// Each one has its own outline, so they can be told apart as plain black shapes (14.7) and said out loud (E1).
// Shapes are designed in a 1 × 1 box centered on (0, 0); `hole` is the color cut into them (eyes, mouth).
import type { Graphics } from 'pixi.js';
import type { Animal } from '../game/mechanisms';

type Pt = [number, number];

export function drawAnimal(g: Graphics, animal: Animal, cx: number, cy: number, size: number, color: number, alpha: number, hole: number): void {
  const X = (x: number) => cx + x * size;
  const Y = (y: number) => cy + y * size;
  const S = (r: number) => r * size;
  const fill = { color, alpha };
  const cut = { color: hole, alpha };
  const poly = (pts: Pt[], f = fill) => g.poly(pts.flatMap(([x, y]) => [X(x), Y(y)])).fill(f);
  const mirror = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [-x, y]);

  switch (animal) {
    case 'snake': {
      g.moveTo(X(-0.4), Y(0.34))
        .bezierCurveTo(X(-0.08), Y(0.5), X(0.3), Y(0.36), X(0.12), Y(0.12))
        .bezierCurveTo(X(-0.04), Y(-0.08), X(-0.32), Y(-0.12), X(-0.06), Y(-0.3))
        .stroke({ width: S(0.13), color, alpha, cap: 'round', join: 'round' });
      g.ellipse(X(0.1), Y(-0.32), S(0.16), S(0.11)).fill(fill);
      g.moveTo(X(0.25), Y(-0.31)).lineTo(X(0.36), Y(-0.31)).lineTo(X(0.43), Y(-0.36)).moveTo(X(0.36), Y(-0.31)).lineTo(X(0.43), Y(-0.26))
        .stroke({ width: S(0.035), color, alpha, cap: 'round' });
      g.circle(X(0.13), Y(-0.35), S(0.03)).fill(cut);
      break;
    }
    case 'monkey': {
      g.circle(X(-0.33), Y(-0.02), S(0.14)).fill(fill);
      g.circle(X(0.33), Y(-0.02), S(0.14)).fill(fill);
      g.circle(X(0), Y(-0.04), S(0.31)).fill(fill);
      poly([[-0.08, -0.33], [0, -0.46], [0.08, -0.33]]); // tuft
      g.circle(X(-0.33), Y(-0.02), S(0.06)).fill(cut);
      g.circle(X(0.33), Y(-0.02), S(0.06)).fill(cut);
      // heart-shaped face mask with the eyes left standing
      g.circle(X(-0.1), Y(-0.06), S(0.11)).fill(cut);
      g.circle(X(0.1), Y(-0.06), S(0.11)).fill(cut);
      g.ellipse(X(0), Y(0.1), S(0.19), S(0.13)).fill(cut);
      g.circle(X(-0.1), Y(-0.06), S(0.045)).fill(fill);
      g.circle(X(0.1), Y(-0.06), S(0.045)).fill(fill);
      g.moveTo(X(-0.08), Y(0.15)).quadraticCurveTo(X(0), Y(0.21), X(0.08), Y(0.15)).stroke({ width: S(0.035), color, alpha, cap: 'round' });
      break;
    }
    case 'jaguar': {
      const ear: Pt[] = [[-0.32, -0.08], [-0.27, -0.44], [-0.06, -0.24]];
      poly(ear);
      poly(mirror(ear));
      g.ellipse(X(0), Y(0.04), S(0.34), S(0.3)).fill(fill);
      poly([[-0.24, -0.06], [-0.04, -0.03], [-0.17, 0.04]], cut); // slanted eyes
      poly(mirror([[-0.24, -0.06], [-0.04, -0.03], [-0.17, 0.04]]), cut);
      poly([[-0.07, 0.1], [0.07, 0.1], [0, 0.18]], cut); // nose
      for (const [x, y] of [[-0.12, -0.18], [0.02, -0.21], [0.13, -0.16]] as Pt[]) g.circle(X(x), Y(y), S(0.035)).fill(cut); // spots
      for (const s of [-1, 1]) {
        g.moveTo(X(0.08 * s), Y(0.2)).lineTo(X(0.28 * s), Y(0.17)).moveTo(X(0.08 * s), Y(0.23)).lineTo(X(0.27 * s), Y(0.26))
          .stroke({ width: S(0.025), color: hole, alpha });
      }
      break;
    }
    case 'frog': {
      g.ellipse(X(-0.34), Y(0.26), S(0.16), S(0.08)).fill(fill); // back legs
      g.ellipse(X(0.34), Y(0.26), S(0.16), S(0.08)).fill(fill);
      g.ellipse(X(0), Y(0.1), S(0.36), S(0.2)).fill(fill);
      g.circle(X(-0.19), Y(-0.1), S(0.12)).fill(fill); // eye bumps on top
      g.circle(X(0.19), Y(-0.1), S(0.12)).fill(fill);
      poly([[-0.16, 0.2], [-0.24, 0.36], [-0.08, 0.36]]); // front legs
      poly(mirror([[-0.16, 0.2], [-0.24, 0.36], [-0.08, 0.36]]));
      g.circle(X(-0.19), Y(-0.11), S(0.05)).fill(cut);
      g.circle(X(0.19), Y(-0.11), S(0.05)).fill(cut);
      g.moveTo(X(-0.2), Y(0.1)).quadraticCurveTo(X(0), Y(0.2), X(0.2), Y(0.1)).stroke({ width: S(0.03), color: hole, alpha, cap: 'round' });
      break;
    }
    case 'bird': {
      poly([[-0.28, 0.0], [-0.5, -0.14], [-0.47, 0.06], [-0.3, 0.13]]); // tail
      g.ellipse(X(-0.04), Y(0.05), S(0.3), S(0.19)).fill(fill);
      g.circle(X(0.2), Y(-0.14), S(0.14)).fill(fill);
      poly([[0.31, -0.19], [0.48, -0.13], [0.31, -0.08]]); // beak
      g.moveTo(X(-0.2), Y(0.0)).quadraticCurveTo(X(0.02), Y(-0.04), X(0.08), Y(0.06)).quadraticCurveTo(X(-0.06), Y(0.14), X(-0.2), Y(0.0))
        .fill(cut); // wing
      g.circle(X(0.23), Y(-0.17), S(0.03)).fill(cut);
      g.moveTo(X(-0.04), Y(0.22)).lineTo(X(-0.04), Y(0.36)).moveTo(X(0.06), Y(0.22)).lineTo(X(0.06), Y(0.36))
        .stroke({ width: S(0.035), color, alpha, cap: 'round' });
      break;
    }
    case 'fish': {
      poly([[-0.26, 0.0], [-0.48, -0.2], [-0.48, 0.2]]); // tail
      poly([[-0.08, -0.15], [0.1, -0.16], [-0.16, -0.3]]); // top fin
      g.ellipse(X(0.04), Y(0), S(0.34), S(0.18)).fill(fill);
      g.circle(X(0.22), Y(-0.04), S(0.04)).fill(cut);
      g.moveTo(X(0.1), Y(-0.1)).quadraticCurveTo(X(0.04), Y(0), X(0.1), Y(0.1)).stroke({ width: S(0.03), color: hole, alpha, cap: 'round' });
      break;
    }
    case 'bat': {
      const wing: Pt[] = [[-0.06, -0.08], [-0.3, -0.22], [-0.5, -0.12], [-0.44, 0.06], [-0.35, 0.0], [-0.29, 0.13], [-0.19, 0.05], [-0.12, 0.15], [-0.06, 0.08]];
      poly(wing);
      poly(mirror(wing));
      g.ellipse(X(0), Y(0.02), S(0.1), S(0.17)).fill(fill);
      poly([[-0.08, -0.1], [-0.11, -0.28], [-0.01, -0.14]]); // ears
      poly(mirror([[-0.08, -0.1], [-0.11, -0.28], [-0.01, -0.14]]));
      g.circle(X(-0.04), Y(-0.06), S(0.022)).fill(cut);
      g.circle(X(0.04), Y(-0.06), S(0.022)).fill(cut);
      break;
    }
    case 'turtle': {
      const dome: Pt[] = [];
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI + (i / 12) * Math.PI;
        dome.push([-0.06 + Math.cos(a) * 0.34, 0.1 + Math.sin(a) * 0.3]);
      }
      poly(dome);
      g.rect(X(-0.43), Y(0.08), S(0.74), S(0.07)).fill(fill); // shell rim
      g.circle(X(0.38), Y(0.03), S(0.1)).fill(fill); // head
      g.rect(X(-0.32), Y(0.14), S(0.11), S(0.14)).fill(fill); // legs
      g.rect(X(0.08), Y(0.14), S(0.11), S(0.14)).fill(fill);
      poly([[-0.42, 0.1], [-0.5, 0.16], [-0.4, 0.15]]); // tail
      g.circle(X(0.41), Y(0.0), S(0.025)).fill(cut);
      // shell plates
      poly([[-0.14, -0.1], [0.02, -0.1], [0.07, 0.0], [0.02, 0.06], [-0.14, 0.06], [-0.19, 0.0]], { color: hole, alpha: alpha * 0.85 });
      poly([[-0.12, -0.07], [0.0, -0.07], [0.04, 0.0], [0.0, 0.03], [-0.12, 0.03], [-0.16, 0.0]]);
      break;
    }
  }
}
