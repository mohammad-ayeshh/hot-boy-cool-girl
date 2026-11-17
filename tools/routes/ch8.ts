// Solutions for Chapter 8's remade levels (design doc 16.7 "The remake", D14). An entry here replaces the entry
// with the same id in ../routes.ts. A level with timed switches or a tide gives a function (() => Route).
import { enteredAt, gateOpen, gateShut, heard, jump, pause, platAt, say, to, until, type Cmd, type Route } from '../sim.ts';

export const ROUTES_8: Record<string, Route | (() => Route)> = {
  '8-2': {
    fire: [jump(9.5), to(11.5), say('he is on'), platAt(0, 1), to(28.3), say('he is up'), heard('she is on'), to(29.5), say('he holds'),
      until('she is at her door', (w) => w.body.water.x > 22.5 && w.body.water.y < 7.1), to(26.5)],
    water: [heard('he is on'), to(6.5), heard('he is up'), to(10.4), platAt(0, 0), to(11.5), say('she is on'), platAt(0, 1), jump(22.5), to(23.5)],
  },
  '8-4': {
    fire: [heard('she holds 1'), gateOpen(0), jump(10.5, { at: 6.4 }), jump(12.5), to(14.5), say('he holds 1'), heard('she is through 1'), to(15.4), jump(16.6),
      to(19.5), say('he holds 2'), heard('she holds 2'), to(23.6), say('he is through 2'), until('she is away', (w) => w.body.water.x > 27.4), to(26.5)],
    water: [to(8.5), say('she holds 1'), heard('he holds 1'), to(10.4), jump(11.6), to(12.5), say('she is through 1'), heard('he holds 2'), gateOpen(1), to(15.4),
      jump(16.6), jump(21.6, { at: 17.4 }), to(24.5), say('she holds 2'), heard('he is through 2'), to(26.6), jump(27.6), to(29.5)],
  },
  '8-6': {
    fire: [heard('she holds 1'), gateOpen(0), to(14.5), jump(15.6), to(21.5), say('he holds 1'), heard('she is through 1'), to(22.6), jump(23.5), to(28.5),
      to(21.5), to(27.5), say('he holds 2'), heard('she holds 2'), to(20.6), jump(19.4), to(15.0), say('he is through 2'),
      until('she is at her door', (w) => w.body.water.x < 4), to(6.5)],
    water: [to(13.6), to(7.5), say('she holds 1'), heard('he holds 1'), to(14.5), jump(15.6), to(19.7), say('she is through 1'),
      until('he is down in the lower tunnel', (w) => w.body.fire.y > 11.9 && w.body.fire.x < 25), to(28.5), heard('he holds 2'), gateOpen(1), to(20.5), jump(19.4), to(13.5),
      say('she holds 2'), heard('he is through 2'), to(10.4), jump(9.5), to(2.5)],
  },
  '8-7': {
    fire: [heard('she is on the lift'), to(14.5), until('she is up', (w) => w.plat(0) > 0.6), to(27.6), jump(28.7), jump(26.3), jump(23.4), to(21.6), jump(20.5), to(15.5),
      say('he stands still'), until('she is over', (w) => w.body.water.x > 17 && w.body.water.grounded), to(13.5)],
    water: [to(15.5), say('she is on the lift'), until('he is past', (w) => w.body.fire.x > 18), platAt(0, 0), to(4.4), jump(3.3), jump(5.7), jump(8.6), to(9.5),
      heard('he stands still'), jump(17.6, { at: 13.4 }), to(17.5)],
  },
  '8-8': {
    fire: [jump(9.5), jump(12.6), to(15.5), say('he waits'), until('she is past', (w) => w.body.water.x < 12.5), to(18.5), jump(22.5), jump(25.6), to(30.5),
      to(25.6), jump(22.5), jump(19.0), until('she is in her door', (w) => w.body.water.y > 13.9), jump(15.5, { at: 18.4 }), to(14.5)],
    water: [jump(22.5), heard('he waits'), jump(19.0), jump(13.0, { at: 18.0 }), jump(9.5), jump(5.6), to(1.5), to(5.6), jump(9.5), jump(12.6),
      until('he is back on the stones', (w) => w.body.fire.x < 23), jump(15.5, { at: 12.6 }), to(17.5)],
  },
  '8-9': {
    fire: [to(20.5), say('he holds the top'), until('she is up', (w) => w.body.water.y < 10.1 && w.body.water.x < 26.4), to(7.5), heard('she holds hers'), gateOpen(1),
      to(4.5), to(10.5), say('he is in the dip'), until('she is past', (w) => w.body.water.x > 12.5), jump(12.5), to(18.5)],
    water: [heard('he holds the top'), to(25.5), jump(27.5), gateOpen(0), jump(25.8), jump(8.6, { at: 11.6 }), to(1.5), say('she holds hers'), heard('he is in the dip'),
      jump(12.2, { at: 8.6 }), to(22.5)],
  },
  '8-10': {
    fire: [to(19.5), say('he holds the lift'), until('she is up', (w) => w.body.water.y < 7.1 && w.body.water.x > 6.2), to(27.6), jump(29.6), jump(27.6), jump(25.4),
      to(24.5), heard('she holds the gate'), gateOpen(0), jump(12.0, { at: 16.7 }), to(10.5), say('he holds 2'), until('she is at her door', (w) => w.body.water.x > 20.8), to(7.5)],
    water: [to(5.5), platAt(0, 1), to(14.5), say('she holds the gate'), heard('he holds 2'), to(21.5)],
  },
};
