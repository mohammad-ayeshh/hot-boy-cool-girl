// Solutions for Chapter 11's remade levels (design doc 16.7 "The remake", D14). An entry here replaces the entry
// with the same id in ../routes.ts. A level with timed switches or a tide gives a function (() => Route).
import { enteredAt, gateOpen, gateShut, heard, jump, pause, platAt, say, to, until, type Cmd, type Route } from '../sim.ts';

export const ROUTES_11: Record<string, Route | (() => Route)> = {
  '11-1': () => ({
    fire: [to(4.4), heard('she holds'), gateOpen(0), jump(6.5), say('he is on the stair'), heard('she is on the lift'), to(7.5), jump(10.5), to(10.6),
      say('he holds'), heard('she is on her switch'), jump(11.8), say('he is on the lift'), platAt(1, 1), to(14.5)],
    water: [to(26.3), jump(28.5), say('she holds'), heard('he is on the stair'), to(25.7), jump(24), say('she is on the lift'), platAt(0, 1), heard('he holds'), to(29.5),
      say('she is on her switch'), heard('he is on the lift'), jump(22.5, { at: 25.6 }), jump(19.6, { at: 21.9 }), jump(18.3), to(17.5)],
  }),
  '11-2': () => ({
    fire: [to(10.6), heard('she is on the lift'), to(5.5), heard('she is ready'), jump(2.5), jump(5), jump(8), jump(12.5), jump(16.6), say('he is across'),
      to(18.6), until('he is down', (w) => w.body.fire.y > 10.9), to(18.5)],
    water: [to(23.5), jump(25.6), say('she is on the lift'), platAt(0, 1), to(28.2), say('she is ready'), heard('he is across'), to(29.5),
      jump(24, { at: 27.4 }), to(21.5)],
  }),
  '11-3': () => ({
    fire: [to(3.5), say('he is ready'), heard('she is ready'), to(10.5), say('he is set'), heard('she is on the lift'), jump(12.9, { at: 11.6 }), jump(14.7),
      to(16.5), say('he is behind'), heard('she pressed'), jump(18.8), to(27.5)],
    water: [to(28.5), say('she is ready'), heard('he is ready'), to(20.5), heard('he is set'), to(18.9), say('she is on the lift'), platAt(0, 1), to(15.5),
      heard('he is behind'), say('she pressed'), jump(18.6, { at: 16.8 }), to(29.5)],
  }),
  '11-4': () => ({
    fire: [to(21.5), until('she is coming', (w) => w.body.water.x > 19.5), to(26.3), jump(27.6), jump(25.3),
      to(8.5), say('he pressed'), to(22.4), platAt(0, 1), jump(23.9), platAt(0, 0), to(9.5), say('he waits'), gateOpen(3), to(5.5)],
    water: [to(11.2), jump(12.5), to(11), to(20.4), jump(19.5), to(20.6), to(8.2), jump(7.5), to(9.3), to(26.3), jump(27.8), jump(25.3),
      to(21.6), heard('he pressed'), platAt(0, 1), jump(23.5), platAt(0, 0), to(30.5), to(3.5)],
  }),
  '11-5': () => ({
    fire: [to(4.5), say('go'), until('she is away', (w) => w.body.water.x > 9), to(7.5), jump(11, { at: 7.6 }), jump(16, { at: 12.5 }), jump(21.6, { at: 17.5 }), heard('she is on the lift'), jump(21.5),
      until('she is off the lift', (w) => w.body.water.y < 3.1 && w.body.water.x < 24.2), to(23.6), platAt(0, 0), jump(25.6), say('he is on the lift'), platAt(0, 1), to(5.5)],
    water: [heard('go'), jump(11, { at: 7.6 }), jump(16, { at: 12.5 }), jump(21.5, { at: 17.5 }), to(24), jump(26.2), say('she is on the lift'), platAt(0, 1), to(9.6),
      heard('he is on the lift'), to(8.5), to(2.5)],
  }),
  '11-6': () => ({
    fire: [to(4.5), jump(8.5), jump(10.5), say('3'), heard('she 2'), jump(12.5), say('4'), heard('she 3'), jump(14.5), say('5'), heard('she 4'), to(16.6), say('he waits'), heard('she is on 5'),
      to(28.5)],
    water: [heard('3'), jump(8.5), say('she 2'), heard('4'), jump(10.5), say('she 3'), heard('5'), jump(12.5), say('she 4'),
      heard('he waits'), jump(14.5), to(15.2), say('she is on 5'), to(25.5)],
  }),
  '11-7': () => ({
    fire: [to(5.5), say('he is on'), heard('she is on'), jump(25.7, { at: 22.6 }), say('he is on the lift'), platAt(0, 1), to(28.5)],
    water: [to(28.5), say('she is on'), heard('he is on'), jump(24.4, { at: 27.3 }), to(4.5), jump(1.8), jump(3.8), heard('he is on the lift'), to(4.5),
      jump(28, { at: 23.6 }), to(30.5)],
  }),
  '11-8': () => ({
    fire: [heard('she is on the lift'), to(17.5), jump(5.5, { at: 9.2 }), jump(2.5), jump(5.5), heard('she holds'), say('he goes'), to(17.5)],
    water: [to(20.5), jump(19.5), say('she is on the lift'), platAt(0, 1), to(16.5), say('she holds'), heard('he goes'), jump(22.4, { at: 18.2 }), to(22.5)],
  }),
  '11-9': () => ({
    fire: [jump(3.5), say('he is on it'), heard('she is through'), to(15.6), jump(14.5), heard('she waits'), to(24.5)],
    water: [gateOpen(0), to(10.5), say('she is through'), to(16.2), jump(19.6), to(22.4), say('she waits'), gateOpen(1), to(27.5)],
  }),
  '11-10': () => ({
    fire: [jump(2.5), say('he is on'), heard('she is on'), to(14.3), until('she dropped', (w) => w.body.water.y > 9), to(15.5), until('he landed', (w) => w.body.fire.y > 12.9),
      to(28.5), jump(20.5, { at: 25.6 }), jump(13.6, { at: 17.6 }), to(5.5)],
    water: [jump(29.5), say('she is on'), heard('he is on'), to(16), until('she landed', (w) => w.body.water.y > 12.9), to(8.5), say('she waits'), gateOpen(2), to(2.5)],
  }),
};
