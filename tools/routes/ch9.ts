// Solutions for Chapter 9's remade levels (design doc 16.7 "The remake", D14). An entry here replaces the entry
// with the same id in ../routes.ts. A level with timed switches or a tide gives a function (() => Route).
import { enteredAt, gateOpen, gateShut, heard, jump, pause, platAt, say, to, until, type Cmd, type Route } from '../sim.ts';

export const ROUTES_9: Record<string, Route | (() => Route)> = {
};

/** The vault 9-10 for any code (the robot plays it with many codes, route_check.ts). Wins over CODE_ROUTES in ../routes.ts. */
export const CODE_ROUTES_9: Record<string, (code: import('../../src/game/mechanisms.ts').Animal[]) => Route> = {
};
