import { describe, expect, it } from "vitest";
import {
  VERDANT_ORACLE_ALERT_COLORS,
  resolveVerdantOracleAlerts,
  type VerdantOracleAlertInput,
} from "./verdant-oracle-alerts";

const baseInput: VerdantOracleAlertInput = {
  energy: 100,
  petals: 3,
  wardUsable: false,
  pulseUsable: false,
  enhancedInfusionReady: false,
  stagReady: false,
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

  it("lets Ward into Pulse override the generic Pulse-safe cue", () => {
    const result = ids({
      energy: 70,
      petals: 2,
      wardUsable: true,
      pulseUsable: true,
    });

    expect(result).toContain("ward-pulse");
    expect(result).not.toContain("ok-pulse");
  });

  it("keeps the Pulse petal states mutually exclusive", () => {
    expect(ids({ petals: 2 })).toContain("ok-pulse");
    expect(ids({ petals: 3 })).not.toContain("ok-pulse");
    expect(ids({ petals: 3 })).not.toContain("dont-pulse");
    expect(ids({ petals: 4 })).toContain("dont-pulse");
  });

  it("lets the EInf into Stag combo override both ready alerts", () => {
    const result = ids({ enhancedInfusionReady: true, stagReady: true });

    expect(result).toContain("einf-stag");
    expect(result).not.toContain("einf-ready");
    expect(result).not.toContain("stag-ready");
  });

  it("shows individual EInf and Stag readiness when the combo is unavailable", () => {
    expect(ids({ enhancedInfusionReady: true })).toContain("einf-ready");
    expect(ids({ stagReady: true })).toContain("stag-ready");
  });

  it("uses the requested palette and flashes only critical energy", () => {
    expect(VERDANT_ORACLE_ALERT_COLORS).toEqual({
      lowEnergy: "#FFB020",
      criticalEnergy: "#FF3B30",
      wardPulse: "#00D7FF",
      einfReady: "#7CFF6B",
      stagReady: "#FFD84D",
      einfStag: "#FF4DFF",
      dontPulse: "#FF6A00",
      okPulse: "#3FE0C5",
    });

    const result = resolveVerdantOracleAlerts({
      ...baseInput,
      energy: 20,
      petals: 2,
      enhancedInfusionReady: true,
    });
    expect(result.find((item) => item.id === "critical-energy")?.flash).toBe(
      true,
    );
    expect(result.filter((item) => item.id !== "critical-energy"))
      .toSatisfy((items: { flash: boolean }[]) =>
        items.every((item) => item.flash === false),
      );
  });
});
