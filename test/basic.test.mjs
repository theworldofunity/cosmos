/**
 * Sanity tests for @theworldofunity/cosmos
 *
 * Run with: node test/basic.test.mjs
 * (no test framework needed -- plain assert)
 */

import assert from "node:assert/strict";
import { computeChart, lonToGate, lonToLine } from "../dist/index.js";

// ── Unit: gate math ───────────────────────────────────────────────────────────

// 0° Aries -> first gate in sequence = 41
assert.equal(lonToGate(0), 41, "0° should map to gate 41");
// 360° wraps back to gate 41
assert.equal(lonToGate(360), 41, "360° should wrap to gate 41");
// 5.625° exactly is the start of the second gate slot (gate 19)
assert.equal(lonToGate(5.625), 19, "5.625° should map to gate 19");
// Every gate must be 1-64
for (let deg = 0; deg < 360; deg += 0.5) {
  const g = lonToGate(deg);
  assert.ok(g >= 1 && g <= 64, `Gate at ${deg}° out of range: ${g}`);
}
// Lines must be 1-6
for (let deg = 0; deg < 360; deg += 0.5) {
  const l = lonToLine(deg);
  assert.ok(l >= 1 && l <= 6, `Line at ${deg}° out of range: ${l}`);
}

console.log("Gate math: PASS");

// ── Integration: known birth date ─────────────────────────────────────────────
// Elon Musk: 1971-06-28, 07:30, Pretoria, SA (lat -25.7479, lng 28.2293)
// Sun in Cancer is well-established (Cancer ~90-120° ecliptic in tropical).

const chart = computeChart({
  date: new Date("1971-06-28"),
  time: "07:30",
  lat: -25.7479,
  lng: 28.2293,
});

// Sun sign
assert.equal(
  chart.astrology.sun.sign,
  "Cancer",
  `Expected Sun in Cancer, got ${chart.astrology.sun.sign}`
);

// Personality gates all in range
const pGates = Object.values(chart.humanDesign.gates.personality);
for (const g of pGates) {
  assert.ok(g >= 1 && g <= 64, `Personality gate out of range: ${g}`);
}

// Design gates all in range
const dGates = Object.values(chart.humanDesign.gates.design);
for (const g of dGates) {
  assert.ok(g >= 1 && g <= 64, `Design gate out of range: ${g}`);
}

// Gene Keys keys present
assert.ok(chart.geneKeys.lifesWork >= 1 && chart.geneKeys.lifesWork <= 64);
assert.ok(chart.geneKeys.evolution >= 1 && chart.geneKeys.evolution <= 64);
assert.ok(chart.geneKeys.radiance  >= 1 && chart.geneKeys.radiance  <= 64);
assert.ok(chart.geneKeys.purpose   >= 1 && chart.geneKeys.purpose   <= 64);

// Profile format "N/N"
assert.match(chart.humanDesign.profile, /^\d\/\d$/, "Profile should be N/N format");

// Houses array (Placidus gives 12)
assert.equal(chart.astrology.houses.length, 12, "Should have 12 houses");

console.log("Integration (Elon Musk birth chart): PASS");
console.log("\nSample output:");
console.log("  Sun sign        :", chart.astrology.sun.sign);
console.log("  Moon sign       :", chart.astrology.moon.sign);
console.log("  Rising sign     :", chart.astrology.rising?.sign ?? "(unknown)");
console.log("  HD Profile      :", chart.humanDesign.profile);
console.log("  HD Type         :", chart.humanDesign.type);
console.log("  Gene Key Life's Work:", chart.geneKeys.lifesWork);
console.log("  Gene Key Evolution  :", chart.geneKeys.evolution);
console.log("  Gene Key Radiance   :", chart.geneKeys.radiance);
console.log("  Gene Key Purpose    :", chart.geneKeys.purpose);
console.log("\nAll tests PASSED.");
