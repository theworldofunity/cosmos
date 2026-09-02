# @theworldofunity/cosmos

**Western Astrology + Human Design + Gene Keys, out of the box, MIT licensed, runs in the browser or Node — no paid API, no server, no AGPL.**

Compute a full natal chart from a single `computeChart()` call: sun sign through rising, the complete BodyGraph with real type and authority, and the four core Gene Keys.

The ephemeris is Moshier, via [circular-natal-horoscope-js](https://github.com/0xStarcat/CircularNatalHoroscopeJS) (Unlicense), so the entire stack is permissively licensed and ships as pure JavaScript with nothing to install on a server.

---

## Why the license matters

Most open astrology libraries depend on the Swiss Ephemeris, which is **AGPL**. That licence is viral: anything you build on it must also be AGPL and its source published. For most teams that quietly rules the library out.

This package deliberately avoids that. Moshier under the Unlicense is effectively public domain, so `@theworldofunity/cosmos` can be honestly MIT, and you can use it in a closed product without obligation.

---

## Quickstart

```bash
npm install @theworldofunity/cosmos
```

```ts
import { computeChart } from "@theworldofunity/cosmos";

const chart = computeChart({
  date: new Date("1990-06-15"),
  time: "14:30",       // 24 h, local time at the birth location
  lat: -8.4095,        // Bali, Indonesia
  lng: 115.1889,
});

chart.astrology.sun.sign;        // "Gemini"
chart.humanDesign.type;          // "Manifesting Generator"
chart.humanDesign.authority;     // "Emotional"
chart.humanDesign.strategy;      // "Wait to respond, then inform"
chart.geneKeys.lifesWork;        // 12
```

Everything runs client-side. No network call is made and no birth data leaves the device.

---

## API

### `computeChart(options): CosmosChart`

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `date` | `Date` | yes | Birth date (local calendar date at the birth place) |
| `time` | `string` | no | `"HH:MM"`, 24 h. Defaults to `"12:00"`. Without a real birth time the rising sign and houses are approximate. |
| `lat` | `number` | yes | Birth latitude, decimal degrees, north positive |
| `lng` | `number` | yes | Birth longitude, decimal degrees, east positive |

### Return shape

```ts
{
  astrology: {
    sun:     { name, longitude, sign, degree },
    moon:    { name, longitude, sign, degree },
    rising:  { sign, degree } | null,
    planets: PlanetPosition[],            // Sun through Pluto
    houses:  { house, sign, degree }[],   // 12 Placidus houses
  },

  humanDesign: {
    type:         "Generator" | "Manifesting Generator" | "Projector"
                | "Manifestor" | "Reflector",
    authority:    "Emotional" | "Sacral" | "Splenic" | "Ego Manifested"
                | "Ego Projected" | "Self-Projected" | "Mental" | "Lunar",
    definition:   "Single Definition" | "Split Definition" | ... ,
    strategy:     string,                 // "Wait to respond"
    signature:    string,                 // "Satisfaction"
    notSelfTheme: string,                 // "Frustration"
    profile:      string,                 // "3/5"
    centers:      { defined: Center[]; open: Center[] },
    definedChannels: { gates: [number, number]; name: string }[],
    activeGates:  number[],               // every gate lit by the 26 activations
    gates: {
      personality: GateSet,               // 13 activations at birth
      design:      GateSet,               // 13 activations 88° of solar arc earlier
    },
  },

  geneKeys: {
    lifesWork: number,   // Personality Sun gate
    evolution: number,   // Personality Earth gate (Sun + 180°)
    radiance:  number,   // Personality Moon gate
    purpose:   number,   // Design Sun gate
  },
}
```

### The BodyGraph, on its own

```ts
import { buildBodyGraph, CHANNELS, GATE_CENTER } from "@theworldofunity/cosmos";

// Gate 20 (Throat) + gate 34 (Sacral) completes the channel of Charisma:
// the sacral is defined and a motor reaches the throat.
buildBodyGraph([20, 34]);
// -> { type: "Manifesting Generator", authority: "Sacral",
//      definition: "Single Definition", definedChannels: [{ gates:[20,34], name:"Charisma" }], ... }
```

`CHANNELS` is all 36 channels with their published names. `GATE_CENTER` maps each of the 64 gates to one of the nine centres.

### Utilities

```ts
import { lonToGate, lonToLine } from "@theworldofunity/cosmos";

lonToGate(95.3);   // ecliptic longitude -> HD gate (1-64)
lonToLine(95.3);   // -> line within the gate (1-6)
```

---

## How the Human Design typing works

Type and authority are **not** derivable from one planet. They come from the whole graph:

1. Twenty-six activations (13 personality, 13 design) light up gates.
2. A **channel** is defined when **both** of its gates are lit.
3. A **centre** is defined when a defined channel touches it.
4. **Type** follows from the arrangement: a defined Sacral makes a Generator, and a path of defined channels from any motor centre to the Throat makes it manifesting. No Sacral with that path is a Manifestor; no Sacral and no path is a Projector; nothing defined at all is a Reflector.
5. **Authority** follows a fixed precedence: Solar Plexus, then Sacral, then Spleen, then Heart, then G, then mental, then lunar.

The motor-to-Throat test is genuine reachability, not a single-hop check — a Root motor connected through the Solar Plexus to the Throat counts.

---

## Accuracy

Planetary positions come from the Moshier ephemeris. Independently cross-checked against a separate implementation of Meeus, *Astronomical Algorithms* (chapters 25 and 47) across dates from 1990 to 2026: **worst disagreement 0.023°**, about one and a half arcminutes.

One thing to know about time: `computeChart` reads `date` and `time` as **wall-clock time at the birth location**, which is what a birth certificate gives you. If you are computing transits for a real instant rather than a birth, pass that instant's UTC components with `lat: 0, lng: 0`.

## Tests

```bash
npm test
```

Runs the gate maths, a full integration chart, and 269 assertions over the BodyGraph — including data integrity on all 64 gates and 36 channels, and eight hand-checked type/authority cases. Plain `node:assert`, no test framework.

---

## Status

`0.1.0`. The astrology, the BodyGraph and the Gene Keys core are real and tested. Not yet included: incarnation cross, variables (arrows), and the full 64 Gene Key spheres beyond the core four.

## License

MIT © The World of Unity. The ephemeris dependency is Unlicense.
