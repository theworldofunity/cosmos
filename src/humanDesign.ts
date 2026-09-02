/**
 * humanDesign.ts — real BodyGraph mechanics.
 *
 * WHY THIS FILE EXISTS (2026-09-02). Until now `type` and `authority` were
 * placeholders: `HD_TYPES[sunGate % 5]` and `HD_AUTHORITIES[moonGate % 7]`. That
 * is arithmetic wearing Human Design's costume — it returns a plausible-looking
 * type for any input and is wrong for essentially everyone. A package that tells
 * a stranger they are a Projector because a gate number divided evenly is worse
 * than one that says nothing.
 *
 * Type and authority are not guessable from one gate. They fall out of the
 * BodyGraph: 26 planetary activations light up gates, a channel is DEFINED when
 * BOTH of its gates are lit, a centre is DEFINED when a defined channel touches
 * it, and the arrangement of defined centres gives type, authority and
 * definition. That is what this file computes.
 *
 * Everything here is the standard published system (Ra Uru Hu's BodyGraph:
 * 9 centres, 36 channels, 64 gates). No invention, no approximation.
 */

// ── Centres ───────────────────────────────────────────────────────────────────

export type Center =
  | "Head"
  | "Ajna"
  | "Throat"
  | "G"
  | "Heart"
  | "Spleen"
  | "Sacral"
  | "SolarPlexus"
  | "Root";

export const CENTERS: Center[] = [
  "Head", "Ajna", "Throat", "G", "Heart", "Spleen", "Sacral", "SolarPlexus", "Root",
];

/** The four motors. Pressure and energy to act come from these. */
const MOTORS: Center[] = ["Sacral", "Heart", "SolarPlexus", "Root"];

/** Which centre each of the 64 gates belongs to. */
export const GATE_CENTER: Record<number, Center> = {
  // Head (3)
  61: "Head", 63: "Head", 64: "Head",
  // Ajna (6)
  4: "Ajna", 11: "Ajna", 17: "Ajna", 24: "Ajna", 43: "Ajna", 47: "Ajna",
  // Throat (11)
  8: "Throat", 12: "Throat", 16: "Throat", 20: "Throat", 23: "Throat", 31: "Throat",
  33: "Throat", 35: "Throat", 45: "Throat", 56: "Throat", 62: "Throat",
  // G / Identity (8)
  1: "G", 2: "G", 7: "G", 10: "G", 13: "G", 15: "G", 25: "G", 46: "G",
  // Heart / Ego / Will (4)
  21: "Heart", 26: "Heart", 40: "Heart", 51: "Heart",
  // Spleen (7)
  18: "Spleen", 28: "Spleen", 32: "Spleen", 44: "Spleen", 48: "Spleen",
  50: "Spleen", 57: "Spleen",
  // Sacral (9)
  3: "Sacral", 5: "Sacral", 9: "Sacral", 14: "Sacral", 27: "Sacral", 29: "Sacral",
  34: "Sacral", 42: "Sacral", 59: "Sacral",
  // Solar Plexus (7)
  6: "SolarPlexus", 22: "SolarPlexus", 30: "SolarPlexus", 36: "SolarPlexus",
  37: "SolarPlexus", 49: "SolarPlexus", 55: "SolarPlexus",
  // Root (9)
  19: "Root", 38: "Root", 39: "Root", 41: "Root", 52: "Root", 53: "Root",
  54: "Root", 58: "Root", 60: "Root",
};

// ── The 36 channels ───────────────────────────────────────────────────────────

export interface Channel {
  gates: [number, number];
  name: string;
}

/** All 36 channels of the BodyGraph, each named as it is published. */
export const CHANNELS: Channel[] = [
  { gates: [1, 8],   name: "Inspiration" },
  { gates: [2, 14],  name: "The Beat" },
  { gates: [3, 60],  name: "Mutation" },
  { gates: [4, 63],  name: "Logic" },
  { gates: [5, 15],  name: "Rhythm" },
  { gates: [6, 59],  name: "Mating" },
  { gates: [7, 31],  name: "The Alpha" },
  { gates: [9, 52],  name: "Concentration" },
  { gates: [10, 20], name: "Awakening" },
  { gates: [10, 34], name: "Exploration" },
  { gates: [10, 57], name: "Perfected Form" },
  { gates: [11, 56], name: "Curiosity" },
  { gates: [12, 22], name: "Openness" },
  { gates: [13, 33], name: "The Prodigal" },
  { gates: [16, 48], name: "The Wavelength" },
  { gates: [17, 62], name: "Acceptance" },
  { gates: [18, 58], name: "Judgment" },
  { gates: [19, 49], name: "Synthesis" },
  { gates: [20, 34], name: "Charisma" },
  { gates: [20, 57], name: "The Brainwave" },
  { gates: [21, 45], name: "Money" },
  { gates: [23, 43], name: "Structuring" },
  { gates: [24, 61], name: "Awareness" },
  { gates: [25, 51], name: "Initiation" },
  { gates: [26, 44], name: "Surrender" },
  { gates: [27, 50], name: "Preservation" },
  { gates: [28, 38], name: "Struggle" },
  { gates: [29, 46], name: "Discovery" },
  { gates: [30, 41], name: "Recognition" },
  { gates: [32, 54], name: "Transformation" },
  { gates: [34, 57], name: "Power" },
  { gates: [35, 36], name: "Transitoriness" },
  { gates: [37, 40], name: "Community" },
  { gates: [39, 55], name: "Emoting" },
  { gates: [42, 53], name: "Maturation" },
  { gates: [47, 64], name: "Abstraction" },
];

// ── Types, authorities, definition ────────────────────────────────────────────

export type HDType =
  | "Generator"
  | "Manifesting Generator"
  | "Projector"
  | "Manifestor"
  | "Reflector";

export type HDAuthority =
  | "Emotional"
  | "Sacral"
  | "Splenic"
  | "Ego Manifested"
  | "Ego Projected"
  | "Self-Projected"
  | "Mental"
  | "Lunar";

export type HDDefinition =
  | "No Definition"
  | "Single Definition"
  | "Split Definition"
  | "Triple Split Definition"
  | "Quadruple Split Definition";

export interface BodyGraph {
  type: HDType;
  authority: HDAuthority;
  definition: HDDefinition;
  strategy: string;
  signature: string;
  notSelfTheme: string;
  /** Every gate lit by any of the 26 activations, ascending. */
  activeGates: number[];
  /** Channels with BOTH gates lit. */
  definedChannels: Array<{ gates: [number, number]; name: string }>;
  definedCenters: Center[];
  openCenters: Center[];
}

const STRATEGY: Record<HDType, string> = {
  Generator: "Wait to respond",
  "Manifesting Generator": "Wait to respond, then inform",
  Projector: "Wait for the invitation",
  Manifestor: "Inform before you act",
  Reflector: "Wait a lunar cycle",
};

const SIGNATURE: Record<HDType, string> = {
  Generator: "Satisfaction",
  "Manifesting Generator": "Satisfaction",
  Projector: "Success",
  Manifestor: "Peace",
  Reflector: "Surprise",
};

const NOT_SELF: Record<HDType, string> = {
  Generator: "Frustration",
  "Manifesting Generator": "Frustration and anger",
  Projector: "Bitterness",
  Manifestor: "Anger",
  Reflector: "Disappointment",
};

// ── Graph helpers ─────────────────────────────────────────────────────────────

/**
 * Is there a path of DEFINED channels from any motor centre to the Throat?
 * This is the question that separates a Manifestor from a Projector, and a
 * Manifesting Generator from a Generator. It is a reachability question, not a
 * single-channel check: Root → Spleen → Throat counts.
 */
function motorReachesThroat(
  definedCenters: Set<Center>,
  edges: Array<[Center, Center]>,
): boolean {
  const adj = new Map<Center, Center[]>();
  for (const [a, b] of edges) {
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  }
  for (const motor of MOTORS) {
    if (!definedCenters.has(motor)) continue;
    const seen = new Set<Center>([motor]);
    const queue: Center[] = [motor];
    while (queue.length) {
      const cur = queue.shift()!;
      if (cur === "Throat") return true;
      for (const next of adj.get(cur) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
  }
  return false;
}

/** How many separate islands the defined centres form. */
function componentCount(
  definedCenters: Set<Center>,
  edges: Array<[Center, Center]>,
): number {
  const adj = new Map<Center, Center[]>();
  for (const c of definedCenters) adj.set(c, []);
  for (const [a, b] of edges) {
    adj.get(a)?.push(b);
    adj.get(b)?.push(a);
  }
  const seen = new Set<Center>();
  let count = 0;
  for (const c of definedCenters) {
    if (seen.has(c)) continue;
    count++;
    const queue = [c];
    seen.add(c);
    while (queue.length) {
      const cur = queue.shift()!;
      for (const next of adj.get(cur) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
  }
  return count;
}

const DEFINITION_BY_COUNT: HDDefinition[] = [
  "No Definition",
  "Single Definition",
  "Split Definition",
  "Triple Split Definition",
  "Quadruple Split Definition",
];

// ── The one public function ───────────────────────────────────────────────────

/**
 * Compute the BodyGraph from every gate lit by the 26 activations.
 *
 * @param gates every activated gate (personality + design). Duplicates are fine.
 */
export function buildBodyGraph(gates: number[]): BodyGraph {
  const lit = new Set(gates.filter((g) => g >= 1 && g <= 64));

  const definedChannels = CHANNELS.filter(
    (ch) => lit.has(ch.gates[0]) && lit.has(ch.gates[1]),
  ).map((ch) => ({ gates: ch.gates, name: ch.name }));

  const definedCenters = new Set<Center>();
  const edges: Array<[Center, Center]> = [];
  for (const ch of definedChannels) {
    const a = GATE_CENTER[ch.gates[0]];
    const b = GATE_CENTER[ch.gates[1]];
    definedCenters.add(a);
    definedCenters.add(b);
    edges.push([a, b]);
  }

  const has = (c: Center) => definedCenters.has(c);
  const toThroat = motorReachesThroat(definedCenters, edges);

  // ── Type ────────────────────────────────────────────────────────────────
  let type: HDType;
  if (definedCenters.size === 0) {
    type = "Reflector";
  } else if (has("Sacral")) {
    type = toThroat ? "Manifesting Generator" : "Generator";
  } else {
    type = toThroat ? "Manifestor" : "Projector";
  }

  // ── Authority, in the published order of precedence ──────────────────────
  let authority: HDAuthority;
  if (has("SolarPlexus")) {
    authority = "Emotional";
  } else if (has("Sacral")) {
    authority = "Sacral";
  } else if (has("Spleen")) {
    authority = "Splenic";
  } else if (has("Heart")) {
    // Ego authority splits on whether the will can speak directly.
    const heartToThroat = motorReachesThroat(new Set<Center>(["Heart"]), edges);
    authority = heartToThroat ? "Ego Manifested" : "Ego Projected";
  } else if (has("G")) {
    authority = "Self-Projected";
  } else if (definedCenters.size > 0) {
    // Only Head/Ajna/Throat defined: no inner authority at all.
    authority = "Mental";
  } else {
    authority = "Lunar";
  }

  const comps = componentCount(definedCenters, edges);

  return {
    type,
    authority,
    definition: DEFINITION_BY_COUNT[Math.min(comps, 4)],
    strategy: STRATEGY[type],
    signature: SIGNATURE[type],
    notSelfTheme: NOT_SELF[type],
    activeGates: [...lit].sort((a, b) => a - b),
    definedChannels,
    definedCenters: CENTERS.filter((c) => definedCenters.has(c)),
    openCenters: CENTERS.filter((c) => !definedCenters.has(c)),
  };
}
