/**
 * @theworldofunity/cosmos
 *
 * Western Astrology + Human Design + Gene Keys computed entirely
 * client-side or in Node -- no paid API, no AGPL dependency.
 *
 * Ephemeris: Moshier (via circular-natal-horoscope-js, Unlicense).
 * License: MIT  (c) The World of Unity -- locked 2026-06-19
 */


// circular-natal-horoscope-js ships CJS only. We type the constructors
// structurally to avoid importing class types from a CJS module.
interface HoroscopeInstance {
  CelestialBodies: unknown;
  CelestialPoints: unknown;
  Ascendant: unknown;
  Houses: unknown;
}

interface OriginCtor {
  new(opts: {
    year: number; month: number; date: number;
    hour: number; minute: number; latitude: number; longitude: number;
  }): unknown;
}

interface HoroscopeCtor {
  new(opts: {
    origin: unknown; houseSystem: string; zodiac: string;
    aspectPoints: string[]; aspectWithPoints: string[];
    aspectTypes: string[]; customOrbs: object; language: string;
  }): HoroscopeInstance;
}

// BROWSER COMPATIBILITY (fixed 2026-09-02). This used createRequire from
// "node:module", which does not exist in a browser, so the README's headline
// claim of running in-browser was false and every bundler needed a local shim.
// A default import of a CJS module is the one form that works everywhere: Node
// ESM interop hands back module.exports, and Vite/webpack/rollup do the same.
import circularNatalHoroscope from "circular-natal-horoscope-js";
import { buildBodyGraph } from "./humanDesign.js";
import type { HDType, HDAuthority, HDDefinition, Center } from "./humanDesign.js";
export * from "./humanDesign.js";

const { Origin, Horoscope } = circularNatalHoroscope as unknown as {
  Origin: OriginCtor;
  Horoscope: HoroscopeCtor;
};

// ─── Gate sequence ────────────────────────────────────────────────────────────
// 64 I Ching hexagrams ordered by ecliptic longitude (0° Aries onward),
// each spanning 360/64 = 5.625°. Canonical Ra Uru Hu sequence.
const HD_GATE_SEQ: number[] = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42,  3,
  27, 24,  2, 23,  8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33,  7,  4, 29, 59, 40, 64, 47,  6, 46, 18, 48, 57, 32, 50,
  28, 44,  1, 43, 14, 34,  9,  5, 26, 11, 10, 58, 38, 54, 61, 60,
];

const GATE_SPAN = 360 / 64; // 5.625°

/** Ecliptic longitude (any value) -> Human Design gate number (1-64). */
export function lonToGate(lon: number): number {
  const normalized = ((lon % 360) + 360) % 360;
  const index = Math.floor(normalized / GATE_SPAN) % 64;
  return HD_GATE_SEQ[index];
}

/** Ecliptic longitude -> line within gate (1-6). */
export function lonToLine(lon: number): number {
  const normalized = ((lon % 360) + 360) % 360;
  const posInGate = normalized % GATE_SPAN;
  return Math.floor(posInGate / (GATE_SPAN / 6)) + 1;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanetPosition {
  name: string;
  longitude: number;
  sign: string;
  degree: number;
  /** True when the body appears to move backwards from Earth. */
  retrograde: boolean;
}

export interface AstrologyResult {
  sun: PlanetPosition;
  moon: PlanetPosition;
  rising: { sign: string; degree: number } | null;
  planets: PlanetPosition[];
  houses: Array<{ house: number; sign: string; degree: number }>;
}

export interface GateSet {
  sun: number;
  earth: number;
  northNode: number;
  southNode: number;
  moon: number;
  mercury: number;
  venus: number;
  mars: number;
  jupiter: number;
  saturn: number;
  uranus: number;
  neptune: number;
  pluto: number;
}

export interface HumanDesignResult {
  /** Generator | Manifesting Generator | Projector | Manifestor | Reflector. */
  type: HDType;
  /** Inner authority, by the published order of precedence. */
  authority: HDAuthority;
  /** Single / Split / Triple Split / Quadruple Split / No Definition. */
  definition: HDDefinition;
  /** e.g. "Wait to respond". */
  strategy: string;
  /** e.g. "Satisfaction". */
  signature: string;
  /** e.g. "Frustration". */
  notSelfTheme: string;
  profile: string;
  centers: {
    defined: Center[];
    open: Center[];
  };
  /** Channels with BOTH gates activated. */
  definedChannels: Array<{ gates: [number, number]; name: string }>;
  /** Every gate lit by the 26 activations, ascending. */
  activeGates: number[];
  gates: {
    personality: GateSet;
    design: GateSet;
  };
}

export interface GeneKeysResult {
  lifesWork: number;  // Personality Sun gate
  evolution: number;  // Personality Earth gate (Sun + 180°)
  radiance: number;   // Personality Moon gate
  purpose: number;    // Design Sun gate
}

export interface CosmosChart {
  astrology: AstrologyResult;
  humanDesign: HumanDesignResult;
  geneKeys: GeneKeysResult;
}

export type TimeFrame = "local" | "utc";

export interface ComputeChartOptions {
  /** Birth date (local calendar date). */
  date: Date;
  /**
   * How to read `date` and `time`.
   *
   * "local" (default) treats them as WALL-CLOCK TIME AT `lat`/`lng` — what a
   * birth certificate gives you.
   *
   * "utc" treats `date` as a real instant and reads its UTC components, which
   * is what you want for transits or any "right now" chart. Planetary
   * longitudes are geocentric, so `lat`/`lng` then only affect houses and the
   * ascendant.
   *
   * Getting this wrong is not a rounding error. Verified 2026-09-02: feeding
   * local components while claiming UTC put the Moon 4.6 degrees out — a whole
   * void-of-course window.
   */
  frame?: TimeFrame;
  /** Birth time as "HH:MM" 24 h string, e.g. "14:35". Defaults to "12:00". */
  time?: string;
  /** Birth latitude in decimal degrees (north positive). */
  lat: number;
  /** Birth longitude in decimal degrees (east positive). */
  lng: number;
}

// ─── Internal shape from circular-natal-horoscope-js ─────────────────────────

interface EclipticPosition {
  DecimalDegrees: number;
}

interface ChartPositionBody {
  Ecliptic: EclipticPosition;
}

interface CelestialBody {
  ChartPosition: ChartPositionBody;
}

interface ChartPositionHouse {
  StartPosition: {
    Ecliptic: EclipticPosition;
  };
}

interface HouseEntry {
  id: number;
  ChartPosition: ChartPositionHouse;
}

interface SignEntry {
  label: string;
}

interface AscendantEntry {
  ChartPosition: ChartPositionBody;
  Sign: SignEntry;
}

// CelestialPoints entries are plain objects (not arrays)
interface CelestialPointEntry {
  ChartPosition: ChartPositionBody;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

function lonToSign(lon: number): string {
  const normalized = ((lon % 360) + 360) % 360;
  return SIGN_NAMES[Math.floor(normalized / 30)];
}

function lonToDegInSign(lon: number): number {
  return ((lon % 360) + 360) % 360 % 30;
}

function bodyLon(h: HoroscopeInstance, key: string): number {
  const bodies = h.CelestialBodies as unknown as Record<string, CelestialBody>;
  const body = bodies[key];
  if (!body) throw new Error(`CelestialBody key "${key}" not found`);
  return body.ChartPosition.Ecliptic.DecimalDegrees;
}

function pointLon(h: HoroscopeInstance, key: string): number {
  const points = h.CelestialPoints as unknown as Record<string, CelestialPointEntry>;
  const entry = points[key];
  if (!entry) throw new Error(`CelestialPoint key "${key}" not found`);
  return entry.ChartPosition.Ecliptic.DecimalDegrees;
}

function isRetrograde(h: HoroscopeInstance, key: string): boolean {
  const bodies = h.CelestialBodies as unknown as Record<string, { isRetrograde?: boolean }>;
  return Boolean(bodies[key]?.isRetrograde);
}

function makePlanet(h: HoroscopeInstance, key: string, label: string): PlanetPosition {
  const lon = bodyLon(h, key);
  return {
    name: label,
    longitude: lon,
    sign: lonToSign(lon),
    degree: lonToDegInSign(lon),
    retrograde: isRetrograde(h, key),
  };
}

// ─── Horoscope factory ────────────────────────────────────────────────────────

function buildHoroscope(
  date: Date, time: string, lat: number, lng: number, frame: TimeFrame = "local",
): HoroscopeInstance {
  const utc = frame === "utc";
  const [hour, minute] = time.split(":").map(Number);
  const origin = new Origin({
    year:  utc ? date.getUTCFullYear() : date.getFullYear(),
    month: utc ? date.getUTCMonth() : date.getMonth(),   // 0-indexed
    date:  utc ? date.getUTCDate() : date.getDate(),
    hour:  utc ? date.getUTCHours() : hour,
    minute: utc ? date.getUTCMinutes() : minute,
    latitude:  utc ? 0 : lat,
    longitude: utc ? 0 : lng,
  });
  return new Horoscope({
    origin,
    houseSystem: "placidus",
    zodiac: "tropical",
    aspectPoints: ["bodies", "points"],
    aspectWithPoints: ["bodies", "points"],
    aspectTypes: ["major"],
    customOrbs: {},
    language: "en",
  });
}

// ─── Design date: 88° solar arc before birth ──────────────────────────────────

function designDate(birthDate: Date): Date {
  const MS_PER_DEGREE = (365.25 / 360) * 24 * 60 * 60 * 1000;
  return new Date(birthDate.getTime() - 88 * MS_PER_DEGREE);
}

// ─── Human Design typing ──────────────────────────────────────────────────────
// REPLACED 2026-09-02. What stood here was `HD_TYPES[sunGate % 5]` and
// `HD_AUTHORITIES[moonGate % 7]` — arithmetic that returns a plausible-looking
// answer for any input and is wrong for nearly everyone. Type and authority are
// not derivable from a single gate; they fall out of the whole BodyGraph. The
// real mechanics now live in ./humanDesign.ts.

// ─── Main API ─────────────────────────────────────────────────────────────────

/**
 * Compute a full cosmology chart for a birth moment.
 *
 * @example
 * ```ts
 * import { computeChart } from "@theworldofunity/cosmos";
 *
 * const chart = computeChart({
 *   date: new Date("1990-06-15"),
 *   time: "14:30",
 *   lat: -8.4095,
 *   lng: 115.1889,
 * });
 * console.log(chart.astrology.sun.sign);   // e.g. "Gemini"
 * console.log(chart.humanDesign.profile);  // e.g. "3/5"
 * console.log(chart.geneKeys.lifesWork);   // e.g. 12
 * ```
 */
export function computeChart(options: ComputeChartOptions): CosmosChart {
  const { date, time = "12:00", lat, lng, frame = "local" } = options;

  // ── Personality (birth) horoscope ─────────────────────────────────────────
  const p = buildHoroscope(date, time, lat, lng, frame);

  const PLANET_KEYS: Array<[string, string]> = [
    ["sun",     "Sun"],
    ["moon",    "Moon"],
    ["mercury", "Mercury"],
    ["venus",   "Venus"],
    ["mars",    "Mars"],
    ["jupiter", "Jupiter"],
    ["saturn",  "Saturn"],
    ["uranus",  "Uranus"],
    ["neptune", "Neptune"],
    ["pluto",   "Pluto"],
  ];

  const planets: PlanetPosition[] = PLANET_KEYS.map(([k, label]) => makePlanet(p, k, label));
  const sunPos  = planets.find((pl) => pl.name === "Sun")!;
  const moonPos = planets.find((pl) => pl.name === "Moon")!;

  // Ascendant / Rising
  let rising: AstrologyResult["rising"] = null;
  try {
    const asc = p.Ascendant as unknown as AscendantEntry;
    const ascLon = asc.ChartPosition.Ecliptic.DecimalDegrees;
    rising = { sign: lonToSign(ascLon), degree: lonToDegInSign(ascLon) };
  } catch {
    // Ascendant not available (e.g. exact birth time unknown)
  }

  // Houses (Placidus, 12 houses)
  const rawHouses = (p.Houses as unknown as HouseEntry[]) ?? [];
  const houses = rawHouses.map((h) => {
    const lon = h.ChartPosition.StartPosition.Ecliptic.DecimalDegrees;
    return { house: h.id, sign: lonToSign(lon), degree: lonToDegInSign(lon) };
  });

  // ── Design (88° solar arc prior) horoscope ────────────────────────────────
  const dDate = designDate(date);
  const d = buildHoroscope(dDate, time, lat, lng, frame);

  // ── Gate mappings ─────────────────────────────────────────────────────────
  const pGates: GateSet = {
    sun:       lonToGate(bodyLon(p, "sun")),
    earth:     lonToGate(bodyLon(p, "sun") + 180),
    northNode: lonToGate(pointLon(p, "northnode")),
    southNode: lonToGate(pointLon(p, "southnode")),
    moon:      lonToGate(bodyLon(p, "moon")),
    mercury:   lonToGate(bodyLon(p, "mercury")),
    venus:     lonToGate(bodyLon(p, "venus")),
    mars:      lonToGate(bodyLon(p, "mars")),
    jupiter:   lonToGate(bodyLon(p, "jupiter")),
    saturn:    lonToGate(bodyLon(p, "saturn")),
    uranus:    lonToGate(bodyLon(p, "uranus")),
    neptune:   lonToGate(bodyLon(p, "neptune")),
    pluto:     lonToGate(bodyLon(p, "pluto")),
  };

  const dGates: GateSet = {
    sun:       lonToGate(bodyLon(d, "sun")),
    earth:     lonToGate(bodyLon(d, "sun") + 180),
    northNode: lonToGate(pointLon(d, "northnode")),
    southNode: lonToGate(pointLon(d, "southnode")),
    moon:      lonToGate(bodyLon(d, "moon")),
    mercury:   lonToGate(bodyLon(d, "mercury")),
    venus:     lonToGate(bodyLon(d, "venus")),
    mars:      lonToGate(bodyLon(d, "mars")),
    jupiter:   lonToGate(bodyLon(d, "jupiter")),
    saturn:    lonToGate(bodyLon(d, "saturn")),
    uranus:    lonToGate(bodyLon(d, "uranus")),
    neptune:   lonToGate(bodyLon(d, "neptune")),
    pluto:     lonToGate(bodyLon(d, "pluto")),
  };

  // ── Profile ───────────────────────────────────────────────────────────────
  const profile = `${lonToLine(bodyLon(p, "sun"))}/${lonToLine(bodyLon(d, "sun"))}`;

  // ── Assemble ──────────────────────────────────────────────────────────────
  // The BodyGraph reads EVERY activated gate, both sides. Type, authority and
  // definition come from which channels are complete, never from one planet.
  const body = buildBodyGraph([
    ...Object.values(pGates),
    ...Object.values(dGates),
  ]);

  return {
    astrology: { sun: sunPos, moon: moonPos, rising, planets, houses },
    humanDesign: {
      type:            body.type,
      authority:       body.authority,
      definition:      body.definition,
      strategy:        body.strategy,
      signature:       body.signature,
      notSelfTheme:    body.notSelfTheme,
      profile,
      centers:         { defined: body.definedCenters, open: body.openCenters },
      definedChannels: body.definedChannels,
      activeGates:     body.activeGates,
      gates: { personality: pGates, design: dGates },
    },
    geneKeys: {
      lifesWork: pGates.sun,
      evolution: pGates.earth,
      radiance:  pGates.moon,
      purpose:   dGates.sun,
    },
  };
}

export default computeChart;
