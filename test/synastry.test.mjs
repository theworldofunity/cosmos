/**
 * Synastry tests — every case hand-checkable from the five states.
 * Run: node test/synastry.test.mjs
 */
import assert from "node:assert/strict";
import { synastry, crossAspects } from "../dist/synastry.js";

let n = 0;
const eq = (a, b, m) => { assert.equal(a, b, m); n++; };
const ok = (c, m) => { assert.ok(c, m); n++; };

// Channel 20-34 "Charisma" (Throat 20 / Sacral 34) is the test bed throughout.

// ELECTROMAGNETIC — each holds one gate, neither holds both.
{
  const s = synastry([20], [34]);
  eq(s.connections.length, 1, "one connection");
  eq(s.connections[0].kind, "electromagnetic", "each holding one half is electromagnetic");
  eq(s.connections[0].name, "Charisma", "named correctly");
  eq(s.createdTogether.length, 1, "the channel exists only together");
  eq(s.tally.electromagnetic, 1, "tallied");
}

// COMPANIONSHIP — both hold the whole channel.
{
  const s = synastry([20, 34], [20, 34]);
  eq(s.connections[0].kind, "companionship", "both holding the whole channel");
  eq(s.createdTogether.length, 0, "nothing is created, both already had it");
}

// DOMINANCE — one holds it all, the other holds neither gate.
{
  const s = synastry([20, 34], [], "George", "they");
  eq(s.connections[0].kind, "dominance", "whole vs neither is dominance");
  eq(s.connections[0].heldBy, "a", "held by A");
  ok(s.connections[0].reading.includes("George"), "the reading names the holder");
}

// COMPROMISE — one holds it all, the other holds exactly one gate.
{
  const s = synastry([20, 34], [34], "George", "they");
  eq(s.connections[0].kind, "compromise", "whole vs one gate is compromise");
  eq(s.connections[0].heldBy, "a", "George holds it");
}
{
  const s = synastry([34], [20, 34], "George", "they");
  eq(s.connections[0].kind, "compromise", "mirrored");
  eq(s.connections[0].heldBy, "b", "they hold it");
}

// NOTHING — one gate each, but not the two halves of one channel.
{
  const s = synastry([20], [20]);
  eq(s.connections.length, 0, "the same single gate twice completes nothing");
}

// Centre conditioning: B defines a centre A leaves open.
{
  const s = synastry([], [20, 34]);
  ok(s.bDefinesForA.includes("Sacral"), "B defines the Sacral for A");
  ok(s.bDefinesForA.includes("Throat"), "B defines the Throat for A");
  eq(s.aDefinesForB.length, 0, "A defines nothing");
  ok(!s.bothOpen.includes("Sacral"), "the Sacral is not a shared blind spot");
  ok(s.bothOpen.includes("Head"), "the Head is open in both");
}

// Symmetry: swapping the two sides mirrors dominance, never loses it.
{
  const ab = synastry([20, 34], []);
  const ba = synastry([], [20, 34]);
  eq(ab.connections[0].kind, ba.connections[0].kind, "same kind either way round");
  eq(ab.connections[0].heldBy, "a", "held by A");
  eq(ba.connections[0].heldBy, "b", "held by B when swapped");
}

console.log("Human Design synastry: PASS");

// Cross-aspects.
{
  const A = [{ name: "Sun", longitude: 10, sign: "Aries", degree: 10, retrograde: false }];
  const B = [{ name: "Moon", longitude: 130, sign: "Leo", degree: 10, retrograde: false }];
  const x = crossAspects(A, B);
  eq(x.length, 1, "one aspect");
  eq(x[0].aspect, "trine", "120 degrees apart is a trine");
  eq(x[0].quality, "flowing", "a trine flows");
  eq(x[0].orb, 0, "exact");
}
{
  const A = [{ name: "Sun", longitude: 0, sign: "Aries", degree: 0, retrograde: false }];
  const B = [{ name: "Mars", longitude: 90, sign: "Cancer", degree: 0, retrograde: false }];
  eq(crossAspects(A, B)[0].quality, "hard", "a square grinds");
}
{
  // 30 degrees is not a major aspect; nothing should be reported.
  const A = [{ name: "Sun", longitude: 0, sign: "Aries", degree: 0, retrograde: false }];
  const B = [{ name: "Venus", longitude: 30, sign: "Taurus", degree: 0, retrograde: false }];
  eq(crossAspects(A, B).length, 0, "a semi-sextile is not a major aspect");
}

console.log("Astrology cross-aspects: PASS");
console.log(`\nSynastry tests PASSED (${n} assertions).`);
