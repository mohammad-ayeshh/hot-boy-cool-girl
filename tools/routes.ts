// A written solution for every level: what each character does, step by step.
// x is in tiles (column 10 is x 10..11, its middle 10.5). `npm run check:routes` plays them all.
import { gateOpen, gateShut, heard, jump, pause, platAt, say, to, until, type Route } from './sim.ts';

export const ROUTES: Record<string, Route> = {
  '1-1': {
    fire: [to(7.5), jump(10), to(20.4), jump(25.5, { at: 20.4 }), jump(27.5), to(27.5)],
    water: [to(6), jump(9.5), to(14), jump(15.8), jump(17.5), to(20.4), jump(21.6), jump(23.6), jump(25.6), jump(28), to(30.5)],
  },
  '1-2': {
    fire: [to(14.4), jump(15.6), to(17.3), jump(21.6, { at: 17.3 }), jump(23.6), to(24.4), jump(27.6, { at: 24.4 }), to(28.5)],
    water: [to(9.3), jump(13.7), to(14.4), jump(15.6), to(22.4), jump(23.6), to(24.4), jump(27.6, { at: 24.4 }), to(30.5)],
  },
  '1-3': {
    fire: [to(12.5), heard('water on button'), to(17.2), jump(20.7, { at: 17.2 }), say('fire past'), to(25.2), jump(26.8), to(27.5)],
    water: [gateOpen(0), to(21.5), say('water on button'), heard('fire past'), to(22.4), jump(25.4, { at: 22.4 }), jump(26.8), to(29.5)],
  },
  '1-4': {
    fire: [to(6.2), jump(9.6), jump(12.9), say('fire on lift'), platAt(0, 1), to(15.3), heard('water on lift 2'), to(19.5), jump(22.5), jump(25.6, { at: 22.4 }), to(26.5)],
    water: [heard('fire on lift'), to(6.5), platAt(0, 1), until('fire on the shelf', (w) => w.body.fire.x > 14.5), jump(9.8), say('water on lift 2'), platAt(1, 1), to(10.6), jump(14.6, { at: 10.6 }), to(19.4), jump(22.5, { at: 19.4 }), to(28.5)],
  },
  '1-5': {
    fire: [to(9.3), jump(11.5), say('fire on ferry'), platAt(0, 1), to(23.4), to(22.4), to(23.4), say('fire off'), jump(26.6, { at: 23.4 }), to(26.4), heard('water on ferry'), to(27.5), heard('water off'), gateOpen(0), jump(28.6), jump(25.6), to(25.5)],
    water: [heard('fire on ferry'), to(4.5), heard('fire off'), to(9.3), platAt(0, 0), jump(11.5), say('water on ferry'), platAt(0, 1), to(23.4), say('water off'), to(26.5), until('fire up', (w) => w.body.fire.y < 13.1), jump(28.6), jump(27.5), to(27.5)],
  },

  // ---- Chapter 2
  '2-1': {
    fire: [to(1.6), to(5.5), to(11.4), jump(14.6, { at: 11.4 }), to(17.2), gateOpen(0), to(22.4), jump(26.5)],
    water: [to(6.4), to(10.4), jump(14.6, { at: 11.4 }), to(15.2), gateOpen(1), to(22.4), jump(23.8), jump(25.8), to(28.5)],
  },
  '2-2': {
    fire: [to(9.5), until('she is through her gate', (w) => w.body.water.x > 8.6), gateOpen(1), to(10.5), jump(11.8), jump(14.0), jump(16.8), to(25.5)],
    water: [gateOpen(0), to(19.0), to(20.4), jump(23.6, { at: 20.4 }), to(27.5)],
  },
  '2-3': {
    fire: [to(8.5), heard('she holds B1'), to(14.4), jump(17.6, { at: 14.4 }), to(18.5), say('he holds B2'), heard('she holds C'), to(25.4), jump(26.8), to(27.5)],
    water: [gateOpen(0), to(13.5), say('she holds B1'), heard('he holds B2'), to(14.4), jump(17.4, { at: 14.4 }), gateOpen(1), to(22.5), say('she holds C'),
      until('he is through', (w) => w.body.fire.x > 23.5), jump(25.6, { at: 22.6 }), jump(27.2), to(29.5)],
  },
  '2-4': {
    fire: [jump(21.5), say('he is on'), platAt(0, 1), to(9.4), say('he is up'), heard('she is on'), to(6.6), to(8.0), heard('she is up'), to(6.2), jump(3.5, { at: 6.2 }), to(3.5)],
    water: [heard('he is on'), to(27.8), heard('he is up'), to(26.4), platAt(0, 0), jump(21.5), say('she is on'), platAt(0, 1), to(9.4), say('she is up'), to(1.5)],
  },
  '2-5': {
    fire: [jump(27.6), to(30.3), gateOpen(0), to(22.4), jump(20.5), jump(18.3), say('he is on the ferry'), platAt(0, 1), jump(10.0), say('he is across'),
      heard('she is on the ferry'), to(9.4), to(10.5), jump(7.5), to(7.5), heard('she holds the top'), jump(5.5), to(3.5)],
    water: [jump(26.8), to(30.3), gateOpen(1), to(20.6), heard('he is on the ferry'), to(22.4), heard('he is across'), to(20.6), platAt(0, 0), jump(18.3), say('she is on the ferry'),
      platAt(0, 1), jump(10.0), jump(8.4), gateOpen(2), jump(5.5), to(5.5), say('she holds the top'), until('he is up', (w) => w.body.fire.y < 9.1 && w.body.fire.x < 6.9), to(1.5)],
  },

  // ---- Chapter 3
  '3-1': {
    fire: [to(14.6), say('he is on the lift'), platAt(0, 1), to(17.5), say('he is down'), heard('she is on the lift'), to(18.5),
      until('she is off the lift', (w) => w.body.water.x > 18 && w.body.water.y > 15.9), to(19.4), jump(22.6, { at: 19.4 }), to(26.5)],
    water: [to(6.4), jump(9.6, { at: 6.4 }), heard('he is on the lift'), to(11.5), heard('he is down'), to(9.6), platAt(0, 0), to(14.6), say('she is on the lift'),
      platAt(0, 1), to(22.4), jump(25.6, { at: 22.4 }), to(27.5)],
  },
  '3-2': {
    fire: [heard('she holds the button'), platAt(2, 1), to(9.4), jump(10.8), jump(13.8), jump(16.8), jump(19.8), to(22.4), say('locked'),
      heard('she is up'), jump(25.5, { at: 22.4 }), to(26.5)],
    water: [to(6.5), say('she holds the button'), heard('locked'), to(9.4), jump(10.8), jump(13.8), jump(16.8), jump(19.8), to(22.2), say('she is up'),
      jump(27.5, { at: 22.4 }), to(28.5)],
  },
  '3-3': {
    fire: [to(10.4), jump(13.6, { at: 10.4 }), to(14.4), jump(16.4, { at: 14.4 }), to(17.5), say('he holds the button'), heard('locked'),
      to(23.4), jump(24.6), jump(26.6), to(27.5)],
    water: [to(6.4), jump(9.6, { at: 6.4 }), to(14.4), jump(16.4, { at: 14.4 }), heard('he holds the button'), gateOpen(0), to(21.7), say('locked'),
      to(23.4), jump(24.6), jump(26.6), to(29.5)],
  },
  '3-4': {
    fire: [to(13.9), to(3.4), to(13.5), jump(15.6), gateOpen(0), gateOpen(1), to(20.5), say('he holds the button'), heard('locked'), to(26.5)],
    water: [to(15.4), jump(11.6, { at: 15.4 }), to(3.4), to(12.4), jump(15.6, { at: 12.4 }), gateOpen(0), gateOpen(1), heard('he holds the button'), gateOpen(2),
      to(23.0), say('locked'), to(28.5)],
  },
  '3-5': {
    fire: [to(11.5), say('he is on the lift'), platAt(0, 1), to(9.3), to(5.4), to(9.4), jump(11.5), to(15.3), say('he is down'),
      heard('she is on the lift'), to(14.5), until('she is off the lift', (w) => w.body.water.x > 13.6 && w.body.water.y > 15.9), to(16.5),
      say('stairs up'), heard('locked'), gateOpen(0), to(20.4), jump(21.8), jump(24.8), to(27.5)],
    water: [to(2.4), to(6.6), heard('he is on the lift'), to(9.5), heard('he is down'), to(8.4), platAt(0, 0), to(11.5), say('she is on the lift'),
      platAt(0, 1), to(17.2), heard('stairs up'), platAt(2, 1), gateOpen(0), gateOpen(1), to(20.4), jump(21.8), jump(24.8), to(26.9), say('locked'), to(29.5)],
  },

  // ---- Chapter 4
  '4-1': {
    fire: [to(7.4), jump(10.6, { at: 7.4 }), to(13.2), heard('she holds the button'), gateOpen(0), to(20.5), say('he holds the button'),
      until('she is through her gate', (w) => w.body.water.x > 27.2), to(28.5)],
    water: [to(7.4), jump(10.6, { at: 7.4 }), to(11.4), jump(14.6, { at: 11.4 }), to(15.4), jump(18.6, { at: 15.4 }), to(19.4), jump(22.6, { at: 19.4 }),
      to(24.5), say('she holds the button'), heard('he holds the button'), gateOpen(1), to(30.5)],
  },
  '4-2': {
    fire: [to(8.4), jump(10.5), say('he is on the left lift'), platAt(0, 1), jump(16.0), to(17.5), say('he holds the top button'), heard('she is on the right lift'),
      to(18.3), platAt(1, 0), jump(20.4, { at: 18.3 }), to(25.5)],
    water: [heard('he is on the left lift'), to(5.5), heard('he holds the top button'), to(11.4), jump(13.6, { at: 11.4 }), say('she is on the right lift'),
      platAt(1, 0), to(20.4), jump(22.4, { at: 20.4 }), to(27.5)],
  },
  '4-3': {
    fire: [to(11.5), to(7.5), to(11.5), say('he holds the button'), heard('she holds the button'), gateOpen(0), to(14.5)],
    water: [to(19.5), heard('he holds the button'), gateOpen(1), to(17.5), say('she holds the button'),
      until('he is in', (w) => w.body.fire.x > 14.1 && w.body.fire.y > 15.9), to(16.5)],
  },
  '4-4': {
    fire: [to(18.5), say('he holds 1'), heard('she holds 1 from above'), to(21.4), jump(22.6), jump(20.6), to(18.4), jump(15.4, { at: 18.4 }), to(13.5),
      say('he holds 2'), heard('she holds 2 from above'), to(10.4), jump(9.4), jump(10.6), to(19.4), jump(21.6, { at: 19.4 }), to(25.5)],
    water: [to(10.4), jump(13.6, { at: 10.4 }), heard('he holds 1'), gateOpen(0), to(21.4), jump(22.6), jump(24.6), to(26.5), say('she holds 1 from above'),
      heard('he holds 2'), to(10.4), jump(9.4), jump(7.4), to(5.5), say('she holds 2 from above'),
      until('he is up', (w) => w.body.fire.y < 6.1 && w.body.fire.x > 10.2), to(17.4), jump(19.5, { at: 17.4 }), to(27.5)],
  },
  '4-5': {
    fire: [to(7.4), jump(10.6, { at: 7.4 }), to(11.4), jump(14.6, { at: 11.4 }), to(15.4), jump(18.6, { at: 15.4 }), to(19.4), jump(21.5), say('he is on the left lift'),
      platAt(0, 1), jump(27.4), say('he is up'), heard('she is across'), to(26.5), heard('she is on the right lift'), to(27.5)],
    water: [heard('he is on the left lift'), to(4.5), heard('he is up'), to(5.5), gateShut(0), gateShut(1), to(7.4), jump(10.6, { at: 7.4 }), to(11.4),
      jump(14.6, { at: 11.4 }), to(15.4), jump(18.6, { at: 15.4 }), to(19.4), jump(21.5), to(23.4), say('she is across'), platAt(1, 1), jump(24.6),
      say('she is on the right lift'), platAt(1, 0), to(30.5)],
  },

  // ---- Chapter 5: hidden things are real for both, so the robot plays them like any level
  '5-1': {
    fire: [to(7.5), jump(9.8, { at: 7.5 }), to(10.4), jump(13.6, { at: 10.4 }), to(14.4), jump(18.6, { at: 14.4 }), to(19.4), jump(22.6, { at: 19.4 }), to(29.5), to(24.5)],
    water: [to(7.4), jump(10.6, { at: 7.4 }), to(11.4), jump(15.6, { at: 11.4 }), to(16.4), jump(19.6, { at: 16.4 }), to(20.4), jump(22.6, { at: 20.4 }), to(26.5)],
  },
  '5-2': {
    fire: [to(8.4), jump(11.8, { at: 8.4 }), to(19.4), gateOpen(0), to(23.5), say('he holds the button'), until('she is through her gate', (w) => w.body.water.x > 23.4), to(27.5)],
    water: [to(9.9), to(13.5), until('he is past his gate', (w) => w.body.fire.x > 21.6), heard('he holds the button'), gateOpen(1), to(26.5)],
  },
  '5-3': {
    fire: [to(9.3), jump(13.7, { at: 9.3 }), to(17.3), jump(21.7, { at: 17.3 }), to(29.5), to(24.5)],
    water: [to(9.3), jump(12.7, { at: 9.3 }), to(16.3), jump(20.7, { at: 16.3 }), to(26.5)],
  },
  '5-4': {
    fire: [to(7.4), jump(10.8, { at: 7.4 }), to(11.5), jump(14.8), to(15.5), jump(18.8), to(19.5), jump(22.8), to(24.5), say('he holds the button'),
      until('she is in', (w) => w.body.water.x < 3.4), to(27.5)],
    water: [heard('he holds the button'), gateOpen(0), to(2.5)],
  },
  '5-5': {
    fire: [to(7.4), jump(10.6, { at: 7.4 }), to(11.4), jump(14.6, { at: 11.4 }), to(15.4), jump(18.6, { at: 15.4 }), to(21.3), jump(24.7, { at: 21.3 }),
      to(29.4), say('he is on the trapdoor'), until('he is down', (w) => w.body.fire.y > 13.9), to(26.5), say('he holds the button'),
      until('she is at her door', (w) => w.body.water.x > 29.2), to(27.5)],
    water: [to(7.5), heard('he is on the trapdoor'), until('he is down', (w) => w.body.fire.y > 13.9), to(10.3), jump(13.7, { at: 10.3 }), to(14.4),
      jump(17.6, { at: 14.4 }), to(18.4), jump(20.6, { at: 18.4 }), to(21.4), jump(23.6, { at: 21.4 }), to(24.4), heard('he holds the button'), gateOpen(1), to(29.5)],
  },
};
