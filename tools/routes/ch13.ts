// Solutions for Chapter 13's remade levels (design doc 16.16, 16.7 "The remake", D14, SUPER HARD). An entry here replaces
// the entry with the same id in ../routes.ts. Every level has a tide, so every solution is a function (() => Route).
import { enteredAt, gateOpen, gateShut, heard, jump, pause, platAt, say, to, until, type Cmd, type Route } from '../sim.ts';

export const ROUTES_13: Record<string, Route | (() => Route)> = {
  '13-1': () => ({
    fire: [jump(1.6), to(1.6), jump(5.3), to(5.5), say('he holds'), heard('she is on the switch'), jump(8.5), to(15.8), say('he is in'),
      until('the hatch is open', (w) => w.gone(0) && w.gone(1)), jump(17.6), to(20.0), jump(18.3), heard('she holds'), gateOpen(3), to(5.5), say('he is past')],
    water: [to(28.6), jump(25.5), heard('he holds'), gateOpen(1), to(21.5), jump(20.5), say('she is on the switch'),
      until('he is on his way', (w) => w.body.fire.x > 6.5), to(5.5), say('she holds'), heard('he is past'),
      until('her hatch is open', (w) => w.gone(2) && w.gone(3)), to(7.8), jump(10.4), to(10.5)],
  }),
  '13-2': () => ({
    fire: [heard('she is on'), to(30.5), until('she is under way', (w) => w.body.water.x > 8), to(25.2), jump(21.6), to(21.5), say('he holds'),
      until('she is past the gate', (w) => w.body.water.x > 16.6), to(22.4), jump(25.5, { hold: 0.08 }), to(30.5), heard('she is at the gate'), to(27.5), jump(26.5),
      until('she is through', (w) => w.body.water.x < 22.4), to(27.6), jump(29.5, { at: 27.6 }), jump(27.0), to(26.5)],
    water: [jump(1.6), to(1.6), to(5.6), say('she is on'), platAt(0, 1), to(26.0), until('he is back', (w) => w.body.fire.x > 29.5), to(27.0), jump(28.5),
      jump(27.0), to(24.6), say('she is at the gate'), gateOpen(1), to(20.5), to(21.5)],
  }),
  '13-3': () => ({
    fire: [jump(26.4), to(26.5), heard('she is on'), to(25.5), heard('she is up'), to(26.5), to(25.5), say('he flipped it back'), jump(23.6), to(24.4),
      to(22.3), jump(19.0), to(18.6), jump(17.2), to(13.0), jump(8.0, { at: 12.8 }), to(7.5)],
    water: [jump(1.6), to(1.6), to(3.0), to(4.9), say('she is on'), platAt(0, 1), to(9.4), say('she is up'), until('he is over', (w) => w.body.fire.x < 8.8 && w.body.fire.grounded),
      to(16.5)],
  }),
  '13-4': () => ({
    fire: [say('he is ready'), heard('she is ready'), jump(4.8, { at: 2.7 }), to(12.4), say('he is at the skylight'), heard('she is at the skylight'),
      say('jump'), jump(17.4, { at: 12.9 }), to(24.5), jump(26.6), to(27.4), to(26.4), jump(22.6), to(21.6), jump(20.4), to(18.6), to(19.5)],
    water: [say('she is ready'), heard('he is ready'), jump(27.2, { at: 29.3 }), to(17.6), say('she is at the skylight'), heard('jump'), to(15.6),
      until('he is over', (w) => w.body.fire.x > 16.2), to(6.5), jump(8.6), to(10.4), jump(11.6), to(13.4), to(12.5)],
  }),
};
