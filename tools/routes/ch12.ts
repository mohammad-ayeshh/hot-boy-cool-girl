// Solutions for Chapter 12's remade levels (design doc 16.7 "The remake", D14). An entry here replaces the entry
// with the same id in ../routes.ts. A level with timed switches or a tide gives a function (() => Route).
import { enteredAt, gateOpen, gateShut, heard, jump, pause, platAt, say, to, until, type Cmd, type Route } from '../sim.ts';

export const ROUTES_12: Record<string, Route | (() => Route)> = {
  '12-1': () => ({
    fire: [to(3.4), jump(6.6), to(8.6), jump(10.6), to(18.3), heard('she holds'), gateOpen(1), to(25.5), to(23), jump(19.5), to(16.5), say('he holds'),
      until('she is past his gate', (w) => w.body.water.x > 20.5 && w.body.water.y < 8.1), to(6.5), say('he is in'), heard('she is in'), to(2.5)],
    water: [to(28.6), jump(25.4), to(23.5), say('she holds'), heard('he holds'), gateOpen(0), to(8.6), jump(10.6), to(29.5), heard('he is in'), to(22.5),
      jump(19.5), to(4.5), say('she is in')],
  }),
  '12-2': () => ({
    fire: [to(12.4), jump(7.5), to(6.5), say('he holds'), heard('she holds'), gateOpen(3), to(5.3), jump(1.5), jump(3.5), jump(8, { at: 3.6 }), jump(13.5, { at: 11.5 }),
      to(15.5), say('he waits'), heard('she holds his gates'), gateOpen(1), to(19.5), say('he is in'), until('she is in', (w) => w.body.water.x < 21 && w.body.water.y < 5.1), to(18.5)],
    water: [to(19.7), jump(23.6), heard('he holds'), gateOpen(0), jump(28, { at: 25.3 }), to(29.6), jump(24, { at: 27.5 }), to(23.5), say('she holds'), heard('he waits'),
      to(25.5), to(23.5), say('she holds his gates'), heard('he is in'), jump(28, { at: 25.3 }), to(29.6), jump(24, { at: 27.5 }), to(20.5)],
  }),
  '12-3': () => ({
    fire: [to(6.4), heard('she is on'), to(8.5), to(4.4), jump(7.5), platAt(0, 0), to(6.5), to(15), say('he is on'), platAt(0, 1), to(2.5)],
    water: [to(22.5), to(26.5), jump(23.5), to(16), say('she is on'), platAt(0, 1), to(10.6), heard('he is on'), to(9.5), gateOpen(0), to(4.5)],
  }),
  '12-4': () => ({
    fire: [jump(7, { at: 3.8 }), jump(13, { at: 8.5 }), jump(19.5, { at: 14.5 }), to(19.5), say('he holds'), heard('she holds'), gateOpen(1), jump(25, { at: 20.5 }),
      jump(29.8, { at: 26.4 }), to(29.3), jump(25.5), jump(19.5, { at: 24.3 }), to(14.5)],
    water: [jump(25, { at: 27.8 }), jump(19.5, { at: 24.3 }), jump(13, { at: 18.3 }), jump(7.5, { at: 12.3 }), jump(1.8, { at: 6.3 }), to(2.6), jump(6),
      heard('he holds'), gateOpen(0), jump(10.5, { at: 7.6 }), say('she holds'), until('he is up', (w) => w.body.fire.y < 4.1 && w.body.fire.x < 20.5 && w.body.fire.grounded), to(17.5)],
  }),
  '12-5': () => ({
    fire: [jump(12.6), to(14.5), say('he waits'), until('she is over', (w) => w.body.water.x < 12 && w.body.water.grounded), jump(17, { at: 15.6 }), to(21.5), say('he holds'),
      heard('she is on the water step'), to(21.3), jump(19.4), jump(21.4), to(22.5), say('he holds again'), heard('she holds'), gateOpen(2), jump(18.5), to(18.5)],
    water: [to(21.4), jump(19.4), heard('he waits'), jump(10, { at: 16.6 }), to(10.2), until('he is away', (w) => w.body.fire.x > 16), jump(12.5), heard('he holds'),
      gateOpen(0), jump(10), say('she is on the water step'), heard('he holds again'), gateOpen(1), jump(13), to(14.5), say('she holds'),
      until('he is up', (w) => w.body.fire.y < 4.1 && w.body.fire.grounded), to(13.5)],
  }),
  '12-6': () => ({
    fire: [to(6.5), say('he holds B'), until('she is on the second step', (w) => w.body.water.x > 20.5 && w.body.water.y < 10.1 && w.body.water.grounded), to(7.4),
      say('he is at A'), gateOpen(1), jump(9.5), say('he holds D'), until('she is back on the right', (w) => w.body.water.x > 18 && w.body.water.y < 7.1 && w.body.water.grounded),
      to(10.4), say('he is at C'), gateOpen(3), jump(12.6), jump(14.6), to(15.5)],
    water: [to(25.4), jump(22, { at: 25.2 }), to(10.5), heard('he is at A'), to(12),
      heard('he holds D'), gateOpen(2), to(21.4), jump(19.5), heard('he is at C'), to(19.5), to(18.6), jump(19.5), jump(17.4), to(16.5)],
  }),
  '12-7': () => ({
    fire: [to(25.3), jump(22.5), to(22.5), jump(22.5), jump(20.5), say('he is ready'), gateOpen(1), to(8.5)],
    water: [heard('he is ready'), jump(27.5), jump(14, { at: 18 }), to(5.5), to(3.5), jump(1.6), jump(4.6), jump(6.6), to(7.5)],
  }),
  '12-8': () => ({
    fire: [jump(6, { at: 3.6 }), jump(11, { at: 7.4 }), to(14), say('he waits'), until('she is over', (w) => w.body.water.x < 10 && w.body.water.grounded),
      to(21.4), jump(25, { at: 21.5, hold: 0.05 }), to(25.4), jump(20.6, { at: 24.3 }), to(21.4), jump(22.6), to(23.4), jump(20.5, { at: 22.3 }), to(20.5),
      say('he is on his switch'), heard('she is on her switch'), to(17.5)],
    water: [jump(26, { at: 28.4 }), jump(21, { at: 24.6 }), heard('he waits'), jump(10.5, { at: 16.2 }), jump(6, { at: 10.3, hold: 0.05 }), to(5.8),
      until('he is away', (w) => w.body.fire.x > 15), jump(11, { at: 7.4 }), to(10.6), jump(9.4), to(8.6), jump(11.5, { at: 9.4 }), to(11.5),
      say('she is on her switch'), heard('he is on his switch'), to(14.5)],
  }),
  '12-9': () => ({
    fire: [to(3.2), say('he is close'), to(27.6), until('she holds', (w) => w.body.water.x > 30), jump(29.6), jump(25.5, { at: 29.2 }), to(10.5), say('he holds'),
      until('she is past', (w) => w.body.water.x < 6 && w.body.water.grounded), to(7.5)],
    water: [heard('he is close'), to(30.5), heard('he holds'), to(28.2), jump(29.6), jump(25.5, { at: 29.2 }), jump(8, { at: 12.4 }), to(4.5)],
  }),
  '12-10': () => ({
    fire: [until('she is across', (w) => w.body.water.x > 19.5 && w.body.water.grounded), to(11.5), say('he is on his switch'), heard('she is on her switch'),
      jump(15.5, { at: 12.6 }), to(15.5), jump(13.5), jump(11.5), until('she holds', (w) => w.flags.has('she holds')), to(2.5), say('he holds'),
      until('she is in', (w) => w.body.water.x < 8 && w.body.water.y < 5.1), to(4.5)],
    water: [jump(21, { at: 17.4 }), to(20.5), say('she is on her switch'), heard('he is on his switch'), jump(16.5, { at: 19.4 }), to(16.5), jump(18.5), jump(19.5), to(25.5),
      say('she holds'), heard('he holds'), to(21.5), jump(16, { at: 19.3 }), jump(12, { at: 15.4 }), to(7.5)],
  }),
};
