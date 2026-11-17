// Solutions for Chapter 9's remade levels (design doc 16.7 "The remake", D14). An entry here replaces the entry
// with the same id in ../routes.ts. A level with timed switches or a tide gives a function (() => Route).
import { enteredAt, gateOpen, gateShut, heard, jump, pause, platAt, say, to, until, type Cmd, type Route } from '../sim.ts';
import { CHAPTER_9 } from '../../src/game/chapter9.ts';
import type { Animal } from '../../src/game/mechanisms.ts';
import { TEST_CODE } from '../routes.ts';

export const ROUTES_9: Record<string, Route | (() => Route)> = {
  '9-5': {
    fire: [to(5.6), jump(9.0), to(9.5), jump(12.9), say('he is on his lift'), heard('she holds'), platAt(0, 1), to(14.5),
      heard('she is on her lift'), to(15.5), until('she is up and off her lift', (w) => w.body.water.y < 5.1 && w.body.water.x < 17.9), to(14.5)],
    water: [to(27.5), say('she holds'), until('he is up on the tower', (w) => w.body.fire.y < 5.1 && w.body.fire.x > 14.1), to(26.4), jump(23.0), to(22.5),
      jump(19.0), say('she is on her lift'), platAt(1, 1), to(16.4), to(17.5)],
  },
  '9-6': {
    fire: [to(11.9), gateOpen(0), until('he is down', (w) => w.body.fire.y > 15.9), to(8.6), jump(6.5), to(6.5), jump(10.0), to(13.3),
      heard('she waits in the pool'), to(13.6), jump(18.0, { at: 13.6 }), to(19.5)],
    water: [to(26.4), jump(28.6), to(29.5), say('she read the carving'), jump(25.0), to(24.4), jump(22.5), to(22.5), to(19.9), gateOpen(1),
      until('she is down', (w) => w.body.water.y > 15.9), to(15.5), say('she waits in the pool'), until('he is past', (w) => w.body.fire.x > 18 && w.body.fire.y > 15.9), to(12.5)],
  },
  '9-7': {
    fire: [heard('she is on her lift'), to(23.6), jump(22.4), to(22.4), jump(26.8), say('he is on his lift'), platAt(1, 1), to(20.6),
      heard('she waits in the water'), jump(16.0, { at: 20.6 }), to(11.5)],
    water: [jump(5.0), say('she is on her lift'), platAt(0, 1), heard('he is on his lift'), to(8.5), to(12.4), jump(15.8), to(17.9),
      say('she waits in the water'), until('he is past', (w) => w.body.fire.x < 16.4 && w.body.fire.y < 6.1), to(21.5)],
  },
  '9-8': {
    fire: [to(13.4), jump(16.6), to(26.6), to(30.5), heard('she holds the top'), gateOpen(0), to(5.0), to(6.5), say('he holds the bottom'),
      until('she is down', (w) => w.body.water.y > 15.9), to(15.4), jump(18.6), to(23.5)],
    water: [to(8.4), jump(11.6), to(25.4), jump(28.8), to(29.3), jump(24.6), to(23.5), say('she holds the top'),
      until('he is down', (w) => w.body.fire.y > 15.9), heard('he holds the bottom'), to(26.6), to(5.0), to(11.4), jump(14.6), to(26.5)],
  },
  '9-9': {
    fire: [heard('she is on the ferry'), to(11.5), until('she is across', (w) => w.body.water.x > 21.2), to(12.4), platAt(0, 0), to(13.6), say('he is on the ferry'),
      heard('she holds'), platAt(0, 1), to(21.6), jump(25.9), to(28.5)],
    water: [to(4.4), jump(8.6), to(10.6), jump(13.0), say('she is on the ferry'), platAt(0, 1), to(23.0), say('she is across'), heard('he is on the ferry'),
      to(24.5), say('she holds'), until('he is past', (w) => w.body.fire.x > 25.5 && w.body.fire.y > 11.9), to(22.5)],
  },
  '9-10': () => heartRoute(TEST_CODE),
};

/**
 * The finale 9-10 for any code. The shaft: she holds the button while his lift (it fits only one) brings him up; he leaps over
 * her, walks onto the lever that opens her gate and waits at his; she drops down, jumps the lava only he sees and walks over
 * the lever that opens his gate. In the vault he has the upper floor and she the lower one; whoever owns the next animal stands
 * in the gap left of its shelf, jumps up onto the stone and steps back down (a repeat = off and on again, G11).
 */
export function heartRoute(code: Animal[]): Route {
  const vault = CHAPTER_9.find((l) => l.id === '9-10')!;
  const fire: Cmd[] = [to(5.6), jump(4.5), say('he is on the lift'), heard('she holds'), platAt(0, 1), to(5.4), jump(9.7, { at: 5.4 }), to(10.5),
    say('her gate is open'), gateOpen(0), to(13.3)];
  const water: Cmd[] = [heard('he is on the lift'), to(7.5), say('she holds'), until('he is past her', (w) => w.body.fire.x > 9.3 && w.body.fire.y < 9.1),
    to(6.2), platAt(0, 0), to(4.5), to(5.6), jump(8.6), to(10.5), gateOpen(1), to(13.3)];
  const stones = vault.mechs!.flatMap((m) => (m.kind === 'stone' ? [m] : []));
  code.forEach((animal, i) => {
    const st = stones.find((x) => x.animal === animal)!;
    const stand = st.x - 0.7;
    (st.y < 9 ? fire : water).push(enteredAt(i), to(stand), jump(st.x + 0.5), enteredAt(i + 1), to(stand));
  });
  fire.push(gateOpen(2), to(28.5));
  water.push(gateOpen(3), to(27.4), jump(29.5), to(29.5));
  return { fire, water };
}

/** The vault 9-10 for any code (the robot plays it with many codes, route_check.ts). Wins over CODE_ROUTES in ../routes.ts. */
export const CODE_ROUTES_9: Record<string, (code: Animal[]) => Route> = { '9-10': heartRoute };
