/**
 * synastry.ts — what happens BETWEEN two charts.
 *
 * A single chart tells you how one person is built. It says nothing about what
 * occurs when they sit across from each other, and that is the only question
 * that matters when you are deciding whether to work with someone.
 *
 * Human Design answers it mechanically. Every channel needs two gates. When two
 * people are compared, each of the 36 channels lands in exactly one of five
 * states, and each state has a known felt quality:
 *
 *   ELECTROMAGNETIC  each holds one gate, neither holds both.
 *                    Attraction and friction in the same wire. The spark.
 *   COMPANIONSHIP    both hold the whole channel.
 *                    Ease, sameness, and a shared blind spot.
 *   DOMINANCE        one holds the whole channel, the other holds neither gate.
 *                    The holder conditions the other completely in that theme.
 *   COMPROMISE       one holds the whole channel, the other holds one of its gates.
 *                    The single-gate person feels overridden and cannot say why.
 *   (absent)         neither completes it. Nothing to report.
 *
 * None of this is interpretation. It is set arithmetic over the gates the
 * ephemeris already produced, which is why it can be tested exactly.
 */

import { CHANNELS, GATE_CENTER, CENTERS } from "./humanDesign.js";
import type { Center } from "./humanDesign.js";
import type { PlanetPosition } from "./index.js";

export type ConnectionKind =
  | "electromagnetic"
  | "companionship"
  | "dominance"
  | "compromise";

export interface Connection {
  kind: ConnectionKind;
  gates: [number, number];
  name: string;
  centers: [Center, Center];
  /** For dominance and compromise: which side holds the whole channel. */
  heldBy?: "a" | "b";
  /** Plain-English reading, written for the person being compared. */
  reading: string;
}

const READING: Record<ConnectionKind, (name: string, who?: string) => string> = {
  electromagnetic: (n) =>
    `${n}: each of you holds one half. This is the classic attraction, and the friction ` +
    `that comes with it is the same wire, not a separate problem. Neither of you can ` +
    `complete this theme alone, which is exactly why it pulls.`,
  companionship: (n) =>
    `${n}: you both already hold the whole thing. It feels effortless and familiar, and ` +
    `it is also a shared blind spot, because neither of you is challenged here.`,
  dominance: (n, who) =>
    `${n}: ${who} holds the entire channel and the other holds neither gate. ${who} sets ` +
    `the terms in this theme completely, usually without either of you noticing it happen.`,
  compromise: (n, who) =>
    `${n}: ${who} holds the whole channel and the other holds a single gate of it. This is ` +
    `the one that quietly costs somebody. The single-gate side keeps getting overridden ` +
    `here and rarely has language for it.`,
};

export interface Synastry {
  connections: Connection[];
  /** Counts by kind, for a fast read. */
  tally: Record<ConnectionKind, number>;
  /** Centres A has open that B defines — where B conditions A. */
  bDefinesForA: Center[];
  /** Centres B has open that A defines — where A conditions B. */
  aDefinesForB: Center[];
  /** Centres neither one defines: the pair's shared blind spot. */
  bothOpen: Center[];
  /** Channels that exist only when the two are together. */
  createdTogether: Array<{ gates: [number, number]; name: string }>;
}

function centersOf(gates: Set<number>): Set<Center> {
  const out = new Set<Center>();
  for (const ch of CHANNELS) {
    if (gates.has(ch.gates[0]) && gates.has(ch.gates[1])) {
      out.add(GATE_CENTER[ch.gates[0]]);
      out.add(GATE_CENTER[ch.gates[1]]);
    }
  }
  return out;
}

/**
 * Compare two sets of activated gates.
 *
 * @param aGates every gate lit in chart A (personality + design)
 * @param bGates every gate lit in chart B
 * @param aName how to refer to A in the readings, e.g. "George"
 * @param bName how to refer to B, e.g. "they"
 */
export function synastry(
  aGates: number[],
  bGates: number[],
  aName = "A",
  bName = "B",
): Synastry {
  const A = new Set(aGates.filter((g) => g >= 1 && g <= 64));
  const B = new Set(bGates.filter((g) => g >= 1 && g <= 64));

  const connections: Connection[] = [];
  const createdTogether: Array<{ gates: [number, number]; name: string }> = [];

  for (const ch of CHANNELS) {
    const [g1, g2] = ch.gates;
    const aWhole = A.has(g1) && A.has(g2);
    const bWhole = B.has(g1) && B.has(g2);
    const aPartial = (A.has(g1) || A.has(g2)) && !aWhole;
    const bPartial = (B.has(g1) || B.has(g2)) && !bWhole;
    const centers: [Center, Center] = [GATE_CENTER[g1], GATE_CENTER[g2]];

    let kind: ConnectionKind | null = null;
    let heldBy: "a" | "b" | undefined;

    if (aWhole && bWhole) {
      kind = "companionship";
    } else if (aWhole && bPartial) {
      kind = "compromise";
      heldBy = "a";
    } else if (bWhole && aPartial) {
      kind = "compromise";
      heldBy = "b";
    } else if (aWhole && !B.has(g1) && !B.has(g2)) {
      kind = "dominance";
      heldBy = "a";
    } else if (bWhole && !A.has(g1) && !A.has(g2)) {
      kind = "dominance";
      heldBy = "b";
    } else if (aPartial && bPartial) {
      // Each holds one, and between them the channel completes.
      const together = (A.has(g1) && B.has(g2)) || (A.has(g2) && B.has(g1));
      if (together) {
        kind = "electromagnetic";
        createdTogether.push({ gates: ch.gates, name: ch.name });
      }
    }

    if (!kind) continue;
    const who = heldBy === "a" ? aName : heldBy === "b" ? bName : undefined;
    connections.push({
      kind,
      gates: ch.gates,
      name: ch.name,
      centers,
      heldBy,
      reading: READING[kind](ch.name, who),
    });
  }

  const tally: Record<ConnectionKind, number> = {
    electromagnetic: 0, companionship: 0, dominance: 0, compromise: 0,
  };
  for (const c of connections) tally[c.kind]++;

  const aCenters = centersOf(A);
  const bCenters = centersOf(B);

  return {
    connections,
    tally,
    bDefinesForA: CENTERS.filter((c) => !aCenters.has(c) && bCenters.has(c)),
    aDefinesForB: CENTERS.filter((c) => !bCenters.has(c) && aCenters.has(c)),
    bothOpen: CENTERS.filter((c) => !aCenters.has(c) && !bCenters.has(c)),
    createdTogether,
  };
}

// ── Astrology synastry ────────────────────────────────────────────────────────

export interface CrossAspect {
  a: string;
  b: string;
  aspect: string;
  glyph: string;
  orb: number;
  /** Softer aspects flow, harder ones grind. Useful for a quick read. */
  quality: "flowing" | "hard" | "uniting";
}

const ASPECTS: Array<[number, string, string, number, CrossAspect["quality"]]> = [
  [0, "conjunction", "☌", 8, "uniting"],
  [60, "sextile", "⚹", 4, "flowing"],
  [90, "square", "□", 6, "hard"],
  [120, "trine", "△", 6, "flowing"],
  [180, "opposition", "☍", 8, "hard"],
];

const norm360 = (x: number) => ((x % 360) + 360) % 360;

/** Every major aspect from A's planets to B's planets. */
export function crossAspects(
  aPlanets: PlanetPosition[],
  bPlanets: PlanetPosition[],
): CrossAspect[] {
  const out: CrossAspect[] = [];
  for (const p of aPlanets) {
    for (const q of bPlanets) {
      let sep = norm360(p.longitude - q.longitude);
      if (sep > 180) sep = 360 - sep;
      for (const [angle, name, glyph, orb, quality] of ASPECTS) {
        const diff = Math.abs(sep - angle);
        if (diff <= orb) {
          out.push({ a: p.name, b: q.name, aspect: name, glyph, orb: diff, quality });
          break;
        }
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}
