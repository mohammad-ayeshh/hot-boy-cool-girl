// Solutions for Chapter 10's remade levels (design doc 16.7 "The remake", D14). An entry here replaces the entry
// with the same id in ../routes.ts. A level with timed switches or a tide gives a function (() => Route).
// Every Chapter 10 solution is a function, so the workbench can play it again and again (level_lab -p).
import { enteredAt, gateOpen, gateShut, heard, jump, pause, platAt, say, to, until, type Cmd, type Route } from '../sim.ts';

export const ROUTES_10: Record<string, Route | (() => Route)> = {
  '10-1': () => ({
    fire: [to(5.5), say('he holds'), until('she is through', (w) => w.body.water.x > 25.3), heard('she holds'),
      until('the stairs are back', (w) => [0, 1, 2, 3, 4].every((i) => w.mech.crumbles[i].t < 0)), jump(9.5, { at: 6.8 }), jump(12.5), jump(15.5), jump(18.5), jump(21.5),
      jump(26, { at: 21.6 }), to(30.5)],
    water: [heard('he holds'), jump(9.5, { at: 6.8 }), jump(12.5), jump(15.5), jump(18.5), jump(21.5), jump(25.5, { at: 21.6 }), to(25.5), say('she holds'),
      until('he is through', (w) => w.body.fire.x > 25.9), to(27.5)],
  }),
  '10-4': () => ({
    fire: [to(25.5), say('he holds'), until('she is on her ledge', (w) => w.body.water.y < 10.1 && w.body.water.x > 9.9), heard('she holds'), gateOpen(1),
      jump(22.5, { at: 24.6 }), jump(20.6), say('he holds 2'), until('she is through', (w) => w.body.water.y < 4.1 && w.body.water.x > 11.6), heard('she holds 3'),
      gateOpen(3), jump(23.5), jump(21.3), to(18.5)],
    water: [heard('he holds'), gateOpen(0), jump(9.5, { at: 7.4 }), jump(10.9), say('she holds'), until('he is on his ledge', (w) => w.body.fire.y < 10.1 && w.body.fire.x < 21.9),
      heard('he holds 2'), gateOpen(2), jump(8.5), jump(10.4), to(15.5), say('she holds 3'), until('he is in', (w) => w.body.fire.y < 4.1 && w.body.fire.x < 18.9), to(13.5)],
  }),
  '10-10': () => ({
    fire: [to(5.5), say('he holds'), until('she is past the gate', (w) => w.body.water.x > 23.6), jump(6.9, { hold: 0.15 }), say('he is on his lift'), platAt(0, 1),
      to(8.4), heard('she is on her lift'), to(9.5), say('he holds hers'), until('she is up', (w) => w.body.water.y < 10.1 && w.body.water.x < 23.2), to(13.4), heard('she is ready'),
      jump(15.5, { at: 14.25 }), until('she is past', (w) => w.body.water.x < 13.8), until('he dropped', (w) => w.body.fire.y > 9.9),
      until('her bridge is back', (w) => [7, 8, 9, 10, 11].every((i) => w.mech.crumbles[i].t < 0)), jump(25.5, { at: 21.9 }), to(26.6), jump(28.5), jump(25.3), to(20.5)],
    water: [heard('he holds'), jump(12.5, { at: 9.6 }), jump(15.5), jump(18.5), jump(21.9), jump(26, { at: 22.2 }), to(27.5), say('she holds'), heard('he is on his lift'),
      until('he is off his lift', (w) => w.body.fire.x > 8.1 && w.body.fire.y < 10.1), to(25.5), jump(23.9, { hold: 0.15 }), say('she is on her lift'), heard('he holds hers'), platAt(1, 1),
      to(21.6), say('she is ready'), jump(4.6, { at: 8.4 }), to(4.6), jump(3.5), jump(6.5), to(10.5)],
  }),
  '10-9': () => ({
    fire: [heard('she holds'), gateOpen(0), to(25.5), say('he is across'), until('she is up', (w) => w.body.water.y < 10.1 && w.body.water.x > 21.9),
      jump(27.9, { at: 26.0 }), say('he is on the lift'), platAt(0, 1), to(30.5), say('he is off'),
      until('the lift is down with her', (w) => w.plat(0) === 0 && w.body.water.x > 26.9), to(29.5), until('she is up', (w) => w.body.water.y < 4.1 && w.body.water.x < 26.5), to(30.5)],
    water: [to(6.5), say('she holds'), until('he is past the gate', (w) => w.body.fire.x > 9.5), heard('he is across'), to(21.3),
      until('her way up is open', (w) => w.gone(11)), jump(22.6), to(24.5), heard('he is on the lift'), heard('he is off'), to(23.4),
      until('the lift is down', (w) => w.plat(0) === 0), jump(27.9), platAt(0, 1), to(23.5)],
  }),
  '10-8': () => ({
    fire: [jump(26.5, { at: 29.1 }), jump(23.5), jump(20.5), jump(16.9), say('he is on the lift'), platAt(0, 1), to(18.8), say('he is off'),
      until('the lift is down and she is on it', (w) => w.plat(0) === 0 && w.body.water.x > 15.9 && w.body.water.y > 11.9), jump(14.5, { at: 18.2 }), to(14.5),
      until('she is up', (w) => w.body.water.y < 5.1 && w.body.water.x < 15.9), jump(19, { at: 15.4 }), to(20.5)],
    water: [jump(6.5, { at: 3.4 }), jump(9.4), heard('he is on the lift'), to(10.5), heard('he is off'), to(9.4), until('the lift is down', (w) => w.plat(0) === 0),
      jump(13.5), jump(16.9), platAt(0, 1), to(13.5)],
  }),
  '10-6': () => ({
    fire: [to(9.5), say('he holds'), until('she is up', (w) => w.body.water.y < 7.1 && w.body.water.x > 6.2), heard('she holds'), gateOpen(0),
      jump(15.5, { at: 12.4 }), jump(17.5), jump(19.5), to(28.5), until('she is in', (w) => w.body.water.x > 25.6 && w.body.water.y > 8.9), to(29.5)],
    water: [heard('he holds'), jump(4.9), platAt(0, 1), to(12.5), say('she holds'), until('he is past his gate', (w) => w.body.fire.x > 14.4),
      jump(2.5, { at: 6.4 }), to(2.5), until('he holds the door gate', (w) => w.body.fire.x > 27.9), until('her bridge is back', (w) => [2, 3, 4, 5, 6, 7].every((i) => w.mech.crumbles[i].t < 0)), jump(6.5, { at: 3.4 }), jump(18.8, { at: 14.2 }), to(26.5)],
  }),
  '10-7': () => ({
    fire: [jump(20, { at: 24.4, hold: 0.12 }), to(17.4), to(9.5), gateOpen(0), to(2), until('he is down', (w) => w.body.fire.y > 9.9), to(6.5), say('he holds'),
      until('she is past the gate', (w) => w.body.water.x > 14.2), to(13.4),
      until('she runs', (w) => w.body.water.y < 10.1 && w.body.water.x < 23), jump(15.5, { at: 14.25 }), until('she is past', (w) => w.body.water.x < 13.8),
      until('he dropped', (w) => w.body.fire.y > 9.9), to(16.5)],
    water: [to(9.5), say('she holds'), until('he is past his gate', (w) => w.body.fire.x < 7.6), heard('he holds'), gateOpen(1), to(16), jump(20, { at: 16.2 }),
      to(23.5), jump(25.5), jump(27.5), jump(23.6), say('she is up'), to(11.5)],
  }),
};
