import { describe, expect, it } from "vitest";
import {
  VERDANT_IMAGINE_SKILL_IDS,
  VERDANT_ORACLE_ALERT_COLORS,
  resolveVerdantImagineCooldownState,
  resolveVerdantOracleAlerts,
  type VerdantOracleAlertInput,
} from "./verdant-oracle-alerts";

const baseInput: VerdantOracleAlertInput = {
  energy: 100,
  petals: 3,
  wardUsable: false,
  pulseUsable: false,
  crab: "hidden",
  flamehorn: "hidden",
};

const ids = (input: Partial<VerdantOracleAlertInput>) =>
  resolveVerdantOracleAlerts({ ...baseInput, ...input }).map((item) => item.id);

describe("resolveVerdantOracleAlerts", () => {
  it("uses the verified resonance-skill IDs for the tracked Imagines", () => {
    expect(VERDANT_IMAGINE_SKILL_IDS).toEqual({
      phantomArachnocrab: 3938,
      flamehorn: 3956,
    });
  });

  it("maps live cooldown state to hidden, soon, ready, and reset states", () => {
    expect(resolveVerdantImagineCooldownState(true, 10.01)).toBe("hidden");
    expect(resolveVerdantImagineCooldownState(true, 10)).toBe("soon");
    expect(resolveVerdantImagineCooldownState(true, 0.1)).toBe("soon");
    expect(resolveVerdantImagineCooldownState(false, 0)).toBe("ready");

    // A fresh live cooldown after another cast immediately leaves READY and
    // stays hidden until the new cooldown reaches its final ten seconds.
    expect(resolveVerdantImagineCooldownState(true, 80)).toBe("hidden");
  });

  it("lets critical energy override low energy", () => {
    expect(ids({ energy: 29 })).toContain("critical-energy");
    expect(ids({ energy: 29 })).not.toContain("low-energy");
    expect(ids({ energy: 30 })).toContain("low-energy");
    expect(ids({ energy: 59 })).toContain("low-energy");
    expect(ids({ energy: 60 })).not.toContain("low-energy");
  });

  it("keeps the normal Pulse petal states mutually exclusive", () => {
    expect(ids({ petals: 2 })).toContain("ok-pulse");
    expect(ids({ petals: 3 })).not.toContain("ok-pulse");
    expect(ids({ petals: 3 })).not.toContain("dont-pulse");
    expect(ids({ petals: 4 })).toContain("dont-pulse");
  });

  it("gives WARD → PULSE first priority across the whole Pulse lane", () => {
    for (const petals of [2, 3, 4]) {
      const result = resolveVerdantOracleAlerts({
        ...baseInput,
        energy: 70,
        petals,
        wardUsable: true,
        pulseUsable: true,
      });

      expect(result.map((item) => item.label)).toEqual(["WARD → PULSE"]);
      expect(result.map((item) => item.id)).not.toContain("ok-pulse");
      expect(result.map((item) => item.id)).not.toContain("dont-pulse");
    }
  });

  it("requires enough energy and both Ward and Pulse to be usable", () => {
    expect(
      ids({
        energy: 69,
        petals: 2,
        wardUsable: true,
        pulseUsable: true,
      }),
    ).not.toContain("ward-pulse");
    expect(
      ids({
        energy: 100,
        petals: 2,
        wardUsable: false,
        pulseUsable: true,
      }),
    ).not.toContain("ward-pulse");
    expect(
      ids({
        energy: 100,
        petals: 2,
        wardUsable: true,
        pulseUsable: false,
      }),
    ).not.toContain("ward-pulse");
  });

  it("shows Phantom Arachnocrab at ten seconds and when ready", () => {
    expect(ids({ crab: "soon" })).toContain("crab-soon");
    expect(ids({ crab: "soon" })).not.toContain("crab-ready");
    expect(ids({ crab: "ready" })).toContain("crab-ready");
    expect(ids({ crab: "ready" })).not.toContain("crab-soon");

    expect(
      resolveVerdantOracleAlerts({ ...baseInput, crab: "soon" }).map(
        (item) => item.label,
      ),
    ).toEqual(["CRAB READY IN 10s"]);
  });

  it("shows Flamehorn at ten seconds and when ready", () => {
    expect(ids({ flamehorn: "soon" })).toContain("fhorn-soon");
    expect(ids({ flamehorn: "soon" })).not.toContain("fhorn-ready");
    expect(ids({ flamehorn: "ready" })).toContain("fhorn-ready");
    expect(ids({ flamehorn: "ready" })).not.toContain("fhorn-soon");

    expect(
      resolveVerdantOracleAlerts({ ...baseInput, flamehorn: "soon" }).map(
        (item) => item.label,
      ),
    ).toEqual(["FHorn READY IN 10s"]);
  });

  it("allows both Imagine alerts to coexist", () => {
    const result = resolveVerdantOracleAlerts({
      ...baseInput,
      crab: "ready",
      flamehorn: "soon",
    });
    expect(result.map((item) => item.label)).toEqual([
      "CRAB READY",
      "FHorn READY IN 10s",
    ]);
  });

  it("uses the requested palette and flashes critical energy and Ward → Pulse", () => {
    expect(VERDANT_ORACLE_ALERT_COLORS).toEqual({
      lowEnergy: "#FFB020",
      criticalEnergy: "#FF3B30",
      wardPulse: "#FF3B30",
      imagineSoon: "#FFB020",
      imagineReady: "#7CFF6B",
      dontPulse: "#FF6A00",
      okPulse: "#3FE0C5",
    });

    const criticalResult = resolveVerdantOracleAlerts({
      ...baseInput,
      energy: 20,
      petals: 2,
      crab: "ready",
      flamehorn: "soon",
    });
    expect(
      criticalResult.find((item) => item.id === "critical-energy")?.flash,
    ).toBe(true);
    expect(
      criticalResult
        .filter((item) => item.id !== "critical-energy")
        .every((item) => item.flash === false),
    ).toBe(true);

    const wardResult = resolveVerdantOracleAlerts({
      ...baseInput,
      energy: 100,
      petals: 4,
      wardUsable: true,
      pulseUsable: true,
    });
    expect(wardResult).toHaveLength(1);
    expect(wardResult[0]).toMatchObject({
      id: "ward-pulse",
      label: "WARD → PULSE",
      color: "#FF3B30",
      flash: true,
    });
  });
});
