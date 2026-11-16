// Solutions for Chapter 7's remade levels (design doc 16.7 "The remake", D14). An entry here replaces the entry
// with the same id in ../routes.ts. A level with timed switches or a tide gives a function (() => Route).
import { enteredAt, gateOpen, gateShut, heard, jump, pause, platAt, say, to, until, type Cmd, type Route } from '../sim.ts';

export const ROUTES_7: Record<string, Route | (() => Route)> = {
};
