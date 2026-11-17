// Solutions for Chapter 7's remade levels (design doc 16.7 "The remake", D14). An entry here replaces the entry
// with the same id in ../routes.ts. A level with timed switches or a tide gives a function (() => Route).
import { enteredAt, gateOpen, gateShut, heard, jump, pause, platAt, say, to, until, type Cmd, type Route } from '../sim.ts';

export const ROUTES_7: Record<string, Route | (() => Route)> = {
  // 7-4 The Quiet Lift: he crosses the lava to the steps (gem on the top step) and stands on the button only she
  // sees; she rides up, holds the loft button and brings him up. He walks to the far end to read the carving.
  '7-4': {
    fire: [to(5.4), jump(4.3), jump(2.2), to(1.5), heard('she is on the lift'), to(4.5),
      until('she is up and off the lift', (w) => w.body.water.y < 9.1 && w.body.water.x > 17.4), to(12.5), platAt(0, 0), to(15.5), say('he is on the lift'),
      until('he is up', (w) => w.plat(0) === 1 && w.body.fire.y < 9.1), to(10.5), jump(10.5), to(7.6), jump(6.2), to(3.5), say('he read it'), to(26.5)],
    water: [to(28.5), to(15.5), say('she is on the lift'), platAt(0, 1), to(20.5), jump(20.5), heard('he is on the lift'), to(21.5),
      until('he is up, has been to the far end and is back over the lift', (w) => w.flags.has('he read it') && w.body.fire.y < 9.1 && w.body.fire.x > 17.4), to(28.5)],
  },
  // 7-5 One Bridge, Two Halves: he takes the gem on the tunnel's roof, she walks into the water tunnel and holds
  // the button only he sees. He crosses the four stones (two of them only she sees), goes through the gate and
  // climbs to the lever that locks it open. Then she crosses (two stones only he sees).
  '7-5': {
    fire: [to(5.5), jump(4.2), to(2.5), to(7.6), heard('she holds the button'), gateOpen(0), jump(11.0), jump(13.8), jump(17.0), jump(19.8), jump(22.8),
      to(28.3), jump(29.7), to(30.5), say('locked'), to(26.5)],
    water: [to(1.5), say('she holds the button'), heard('locked'), to(7.6), jump(11.0), jump(13.8), jump(17.0), jump(19.8), jump(22.8), to(28.5)],
  },
  // 7-6 Two Stairs, One Tower: he guides her onto the lever only he sees (it opens his gate), she guides him onto his
  // (it opens hers). On the way up she sends him to the high shelf to read carving 3 for her.
  '7-6': {
    fire: [to(27.2), jump(28.6), to(30.5), say('his lever'), to(28.3), jump(25.0), to(24.6), jump(28.8, { at: 25.4 }), to(29.6), say('he read it'),
      to(28.3), jump(25.0), to(24.4), jump(21.0), to(20.8), gateOpen(1), jump(18.0), to(17.5)],
    water: [to(7.3), jump(9.0), to(8.4), jump(4.5), to(1.5), say('her lever'), jump(9.4, { at: 4.4 }), to(10.8), gateOpen(0), jump(13.0), to(14.5)],
  },
  // 7-7 The Switchback: she calls his jump over the hidden water on the top floor and holds the button that opens
  // his trapdoor; he calls her jump over the hidden lava on the bottom floor and sends her lift up with the lever;
  // then she calls his jump over the hidden water on the middle floor.
  '7-7': {
    fire: [to(9.6), jump(12.0, { at: 9.6 }), to(16.6), jump(19.0, { at: 16.6 }), to(28.5), heard('she holds the button'), gateOpen(0), until('he is down', (w) => w.body.fire.y > 10.9),
      heard('she is on the lift'), to(30.5), to(22.0), jump(16.0, { at: 21.4 }), to(12.5)],
    water: [to(20.5), say('she holds the button'), until('he is down', (w) => w.body.fire.y > 10.9), to(16.4), jump(14.0, { at: 16.4 }), to(12.4), jump(10.0, { at: 12.4 }), to(6.5),
      say('she is on the lift'), platAt(0, 1), to(10.5)],
  },
  // 7-8 The Blind Well: he flips the lever that opens her way into the well and talks her up the ledges only he
  // sees, after a detour up the step to the water shelf to read carving 4 for him; she stands on the button only he sees, and the
  // ferry carries him over the well.
  '7-8': {
    fire: [to(1.5), say('her gate'), to(11.0), heard('she holds the button'), platAt(0, 1), to(24.5)],
    water: [to(4.2), jump(5.6), jump(2.0), to(1.6), say('she read it'), to(5.0), to(4.5), heard('her gate'), gateOpen(0), to(9.4), jump(11.8), to(11.3), jump(16.0, { at: 12.4 }), to(15.3),
      jump(19.8, { at: 16.4 }), to(19.6), jump(23.0), to(29.5), say('she holds the button'), until('he is off the ferry', (w) => w.body.fire.x > 23.5), to(26.5)],
  },
  // 7-9 The Ring of Trust: she talks him onto the hidden button that sends her lift up; then she talks him over the
  // hidden water and up the hidden ledges of his shaft, while he warns her about the hidden lava on top; she holds
  // the gate open for him.
  '7-9': {
    fire: [heard('she is on the lift'), to(10.5), until('she is off the lift', (w) => w.body.water.x > 8.7 && w.body.water.y < 5.3), to(18.0),
      jump(22.5, { at: 19.0 }), to(26.3), jump(28.2), to(27.4), jump(23.8, { at: 27.2 }), to(24.4), jump(26.8), to(26.4), heard('she holds the gate'), gateOpen(0),
      jump(21.4, { at: 26.2 }), to(18.5)],
    water: [to(6.5), say('she is on the lift'), platAt(0, 1), jump(9.6), to(11.4), jump(15.0, { at: 12.2 }), to(20.5), say('she holds the gate'),
      until('he is in', (w) => w.body.fire.x < 21.3 && w.body.fire.y < 5.1), to(16.5)],
  },
};
