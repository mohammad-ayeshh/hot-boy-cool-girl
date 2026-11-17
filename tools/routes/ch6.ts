// Solutions for Chapter 6's remade levels (design doc 16.7 "The remake", D14). An entry here replaces the entry
// with the same id in ../routes.ts. A level with timed switches or a tide gives a function (() => Route).
import { enteredAt, gateOpen, gateShut, heard, jump, pause, platAt, say, to, until, type Cmd, type Route } from '../sim.ts';

export const ROUTES_6: Record<string, Route | (() => Route)> = {
  // 6-2 The Hanging Tower: he jumps the water onto his lift, on to the lever shelf, and flips it once she stands on
  // her lift; she rides up, takes the button on the tower top, and that brings his lift up.
  '6-2': {
    fire: [jump(7.5, { at: 12.6 }), jump(3.0, { at: 6.4 }), to(2.6), heard('she is on her lift'), to(1.5), to(3.7), to(4.6), jump(7.5), say('he is on his lift'),
      platAt(1, 1), to(8.5), jump(10.6), to(16.5), jump(16.5), to(14.5)],
    water: [jump(24.5, { at: 19.4 }), jump(28.6, { at: 25.6 }), to(29.5), to(27.4), jump(24.5), say('she is on her lift'), platAt(0, 1), to(23.5), jump(21.4),
      to(19.5), jump(19.5), to(12.5), heard('he is on his lift'), until('he is up', (w) => w.body.fire.y < 7.1 && w.body.fire.x > 9.9), to(17.5)],
  },
  // 6-6 The Weighing Room: she rides the low lift while he holds the floor button, reads the carving in the flooded
  // cellar, steps onto the sunk high lift; he lets go (it rises with her, the low lift drops for him); she holds the
  // top button (his low lift rises, the high lift sinks for him); she lets go and it brings him up.
  '6-6': {
    fire: [heard('she is on the low lift'), to(4.5), say('he holds'), heard('she is on the high lift'), to(9.3), platAt(0, 0), jump(11.5),
      say('he is on the low lift'), platAt(0, 1), to(15.5), jump(19.0, { at: 15.6 }), to(21.4), platAt(1, 1), to(23.5), say('he is on the high lift'),
      platAt(1, 0), to(22.4), jump(19.5, { at: 22.4 }), to(5.5)],
    water: [to(9.3), jump(11.5), say('she is on the low lift'), heard('he holds'), platAt(0, 1), to(14.5), to(16.6), to(20.5),
      to(18.4), jump(17.0), jump(18.8), to(21.4), to(23.5), say('she is on the high lift'), platAt(1, 0), heard('he is on the low lift'), to(29.5),
      heard('he is on the high lift'), to(26.5), platAt(1, 0), to(22.4), jump(19.5, { at: 22.4 }), to(3.5)],
  },
  // 6-8 The Twin Wells: he wades the top pool to read the carving, then stands on his trapdoor; she holds its button
  // and he drops into the lava well, walks to his lever (her gate) and drops out to the right. She drops down her
  // open water well to her lever (his gate) and out to the left. They meet at the doors.
  '6-8': {
    fire: [to(29.5), to(22.6), say('he is on the trapdoor'), until('he is down', (w) => w.body.fire.y > 9.5), to(30.4), to(20.7), gateOpen(2), to(16.5)],
    water: [to(17.5), heard('he is on the trapdoor'), until('he is down', (w) => w.body.fire.y > 9.5), to(10.4), jump(9.5), to(4.5), to(1.5), to(8.6),
      gateOpen(1), to(14.5)],
  },
  // 6-9 Steps from the Pit: she holds the button, he climbs the three steps and locks them with the lever at the
  // far end of the rim (a jump on the way for his gem); she climbs. He holds the trapdoor button, she drops and locks
  // it open with the lever in the corner below, and he drops after her.
  '6-9': {
    fire: [heard('she holds'), platAt(2, 1), to(8.4), jump(10.8), jump(13.6), jump(16.6), jump(19.0), to(28.5), jump(28.5), to(30.4), say('locked'),
      to(22.5), say('he holds'), heard('she locked it'), to(26.6), to(22.5)],
    water: [to(2.5), say('she holds'), heard('locked'), to(8.4), jump(10.8), jump(13.6), jump(16.6), jump(19.0), heard('he holds'), gateOpen(0), to(26.6),
      to(19.5), say('she locked it'), to(21.5), jump(21.5), to(24.5)],
  },
};
