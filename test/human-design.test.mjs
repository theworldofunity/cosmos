/**
 * BodyGraph mechanics tests for @theworldofunity/cosmos
 *
 * Run with: node test/human-design.test.mjs   (plain assert, no framework)
 *
 * Every case below is a hand-checkable consequence of the published rules, not a
 * claim about a particular famous person's chart. A single defined channel has
 * exactly one correct type and authority, and that is what is asserted.
 */

import assert from "node:assert/strict";
import {
  buildBodyGraph,
  CHANNELS,
  GATE_CENTER,
  CENTERS,
} from "../dist/humanDesign.js";

let checks = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); checks++; };
const eq = (a, b, msg) => { assert.equal(a, b, msg); checks++; };

// ── Data integrity: the map must be complete and consistent ──────────────────

eq(CHANNELS.length, 36, "the BodyGraph has exactly 36 channels");

const mapped = Object.keys(GATE_CENTER).map(Number).sort((a, b) => a - b);
eq(mapped.length, 64, "every gate 1-64 is assigned to a centre");
for (let g = 1; g <= 64; g++) {
  ok(GATE_CENTER[g], `gate ${g} has a centre`);
  ok(CENTERS.includes(GATE_CENTER[g]), `gate ${g}'s centre is one of the nine`);
}

const seen = new Set();
for (const ch of CHANNELS) {
  const [a, b] = ch.gates;
  ok(GATE_CENTER[a] && GATE_CENTER[b], `channel ${a}-${b} has both gates mapped`);
  ok(GATE_CENTER[a] !== GATE_CENTER[b], `channel ${a}-${b} spans two centres`);
  const key = [a, b].sort((x, y) => x - y).join("-");
  ok(!seen.has(key), `channel ${key} is not duplicated`);
  seen.add(key);
}

console.log("Data integrity: PASS");

// ── Type + authority, one channel at a time ──────────────────────────────────
// Each case names the channel, the centres it joins, and why the answer follows.

const cases = [
  {
    gates: [],
    why: "nothing defined at all",
    type: "Reflector",
    authority: "Lunar",
    definition: "No Definition",
  },
  {
    gates: [20, 34],
    why: "Charisma joins Sacral to Throat: sacral defined AND a motor reaches the throat",
    type: "Manifesting Generator",
    authority: "Sacral",
    definition: "Single Definition",
  },
  {
    gates: [10, 34],
    why: "Exploration joins G to Sacral: sacral defined, throat is not, so no manifesting",
    type: "Generator",
    authority: "Sacral",
    definition: "Single Definition",
  },
  {
    gates: [21, 45],
    why: "Money joins Heart to Throat: no sacral, but a motor reaches the throat",
    type: "Manifestor",
    authority: "Ego Manifested",
    definition: "Single Definition",
  },
  {
    gates: [12, 22],
    why: "Openness joins Throat to Solar Plexus: emotional motor reaches the throat",
    type: "Manifestor",
    authority: "Emotional",
    definition: "Single Definition",
  },
  {
    gates: [47, 64],
    why: "Abstraction joins Ajna to Head: defined, but no motor and no sacral",
    type: "Projector",
    authority: "Mental",
    definition: "Single Definition",
  },
  {
    gates: [16, 48],
    why: "The Wavelength joins Throat to Spleen: awareness centre, not a motor",
    type: "Projector",
    authority: "Splenic",
    definition: "Single Definition",
  },
  {
    gates: [20, 34, 47, 64],
    why: "two unconnected islands: Sacral-Throat, and Head-Ajna",
    type: "Manifesting Generator",
    authority: "Sacral",
    definition: "Split Definition",
  },
];

for (const c of cases) {
  const g = buildBodyGraph(c.gates);
  eq(g.type, c.type, `[${c.gates.join(",")}] ${c.why} -> ${c.type}, got ${g.type}`);
  eq(g.authority, c.authority, `[${c.gates.join(",")}] authority should be ${c.authority}, got ${g.authority}`);
  eq(g.definition, c.definition, `[${c.gates.join(",")}] definition should be ${c.definition}, got ${g.definition}`);
}

console.log("Type + authority (8 hand-checked cases): PASS");

// ── Authority precedence: emotional outranks everything below it ─────────────

const emotionalOverSacral = buildBodyGraph([20, 34, 12, 22]);
eq(
  emotionalOverSacral.authority,
  "Emotional",
  "a defined Solar Plexus outranks a defined Sacral",
);

const sacralOverSplenic = buildBodyGraph([10, 34, 16, 48]);
eq(
  sacralOverSplenic.authority,
  "Sacral",
  "a defined Sacral outranks a defined Spleen",
);

console.log("Authority precedence: PASS");

// ── Reachability is transitive, not one hop ──────────────────────────────────
// Root(19) - SolarPlexus(49) is Synthesis; SolarPlexus(22) - Throat(12) is
// Openness. A motor at the Root reaches the Throat through two channels.

const twoHop = buildBodyGraph([19, 49, 12, 22]);
eq(twoHop.type, "Manifestor", "a motor two channels away from the Throat still manifests");
eq(twoHop.definition, "Single Definition", "the two channels form one connected island");

console.log("Transitive motor-to-throat: PASS");

// ── An undefined channel defines nothing ─────────────────────────────────────

const halfChannel = buildBodyGraph([34]);
eq(halfChannel.type, "Reflector", "one gate of a channel defines no centre");
eq(halfChannel.definedChannels.length, 0, "half a channel is not a channel");
eq(halfChannel.activeGates.length, 1, "the gate is still reported as active");

console.log("Half-channel handling: PASS");

console.log(`\nAll BodyGraph tests PASSED (${checks} assertions).`);

// ── Time frame: the bug that cost 4.6 degrees ────────────────────────────────
// Origin reads its components as wall-clock time AT THE GIVEN PLACE. Passing a
// real instant's LOCAL components while treating the result as UTC shifts the
// chart by the machine's timezone offset — the Moon moves 0.55 deg/hour, so an
// 8-hour machine puts it 4.4 deg out. frame:"utc" removes the ambiguity, and
// because it forces lat/lng to 0 the PLANET longitudes must then be identical
// no matter what place is passed.

import { computeChart } from "../dist/index.js";

const instant = new Date("1990-06-15T14:30:00Z");
const bali  = computeChart({ date: instant, lat: -8.4095, lng: 115.1889, frame: "utc" });
const quito = computeChart({ date: instant, lat: -0.1807, lng: -78.4678, frame: "utc" });

for (let i = 0; i < bali.astrology.planets.length; i++) {
  const a = bali.astrology.planets[i];
  const b = quito.astrology.planets[i];
  eq(a.name, b.name, "planet order is stable");
  ok(
    Math.abs(a.longitude - b.longitude) < 1e-9,
    `${a.name} must be identical under frame:"utc" regardless of place: ${a.longitude} vs ${b.longitude}`,
  );
}

// Every planet reports retrograde as a real boolean.
for (const p of bali.astrology.planets) {
  ok(typeof p.retrograde === "boolean", `${p.name} reports retrograde as a boolean`);
}

// The Sun is never retrograde; the Moon is never retrograde.
eq(bali.astrology.planets.find((p) => p.name === "Sun").retrograde, false, "the Sun never retrogrades");
eq(bali.astrology.planets.find((p) => p.name === "Moon").retrograde, false, "the Moon never retrogrades");

console.log("Time frame + retrograde: PASS");
console.log(`\nGrand total: ${checks} assertions.`);
