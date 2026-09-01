import { describe, expect, it } from "vitest";
import {
  VERDANT_ORACLE_ALERT_COLORS,
  resolveVerdantOracleAlerts,
  type VerdantOracleAlertInput,
} from "./verdant-oracle-alerts";

const baseInput: VerdantOracleAlertInput = {
  energy: 100,
  petals: 3,
  crab: "hidden",
  flamehorn: "hidden",
};

const ids = (input: Partial<VerdantOracleAlertInput>) =>
  resolveVerdantOracleAlerts({ ...baseInput, ...input }).map((item) => item.id);

describe("resolveVerdantOracleAlerts", () => {
  it("lets critical energy override low energy", () => {
    expect(ids({ energy: 29 })).toContain("critical-energy");
    expect(ids({ energy: 29 })).not.toContain("low-energy");
    expect(ids({ energy: 30 })).toContain("low-energy");
    expect(ids({ energy: 59 })).toContain("low-energy");
    expect(ids({ energy: 60 })).not.toContain("low-energy");
  });

  it("keeps the Pulse petal states mutually exclusive", () => {
    expect(ids({ petals: 2 })).toContain("ok-pulse");
    expect(ids({ petals: 3 })).not.toContain("ok-pulse");
    expect(ids({ petals: 3 })).not.toContain("dont-pulse");
    expect(ids({ petals: 4 })).toContain("dont-pulse");
  });

  it("does not emit the removed Ward into Pulse cue", () => {
    const result = resolveVerdantOracleAlerts({
      ...baseInput,
      petals: 2,
    });

    expect(result.map((item) => item.label)).toEqual(["OK TO PULSE"]);
  });

  it("shows Phantom Arachnocrab at ten seconds and when ready", () => {
    expect(ids({ crab: "soon" })).toContain("crab-soon");
    expect(ids({ crab: "soon" })).not.toContain("crab-ready");
    expect(ids({ crab: "ready" })).toContain("crab-ready");
    expect(ids({ crab: "ready" })).not.toContain("crab-soon");
  });

  it("shows Flamehorn at ten seconds and when ready", () => {
    expect(ids({ flamehorn: "soon" })).toContain("fhorn-soon");
    expect(ids({ flamehorn: "soon" })).not.toContain("fhorn-ready");
    expect(ids({ flamehorn: "ready" })).toContain("fhorn-ready");
    expect(ids({ flamehorn: "ready" })).not.toContain("fhorn-soon");
  });

  it("allows both Imagine alerts to coexist", () => {
    const result = resolveVerdantOracleAlerts({
      ...baseInput,
      crab: "ready",
      flamehorn: "soon",
    });
    expect(result.map((item) => item.label)).toEqual([
      "CRAB READY",
      "FHorn READY in 10s",
    ]);
  });

  it("uses the requested palette and flashes only critical energy", () => {
    expect(VERDANT_ORACLE_ALERT_COLORS).toEqual({
      lowEnergy: "#FFB020",
      criticalEnergy: "#FF3B30",
      imagineSoon: "#FFB020",
      imagineReady: "#7CFF6B",
      dontPulse: "#FF6A00",
      okPulse: "#3FE0C5",
    });

    const result = resolveVerdantOracleAlerts({
      ...baseInput,
      energy: 20,
      petals: 2,
      crab: "ready",
      flamehorn: "soon",
    });
    expect(result.find((item) => item.id === "critical-energy")?.flash).toBe(
      true,
    );
    expect(
      result
        .filter((item) => item.id !== "critical-energy")
        .every((item) => item.flash === false),
    ).toBe(true);
  });
});
