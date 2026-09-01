export const VERDANT_ORACLE_ALERT_COLORS = {
  lowEnergy: "#FFB020",
  criticalEnergy: "#FF3B30",
  imagineSoon: "#FFB020",
  imagineReady: "#7CFF6B",
  dontPulse: "#FF6A00",
  okPulse: "#3FE0C5",
} as const;

export type VerdantImagineState = "hidden" | "soon" | "ready";

export type VerdantOracleAlertId =
  | "low-energy"
  | "critical-energy"
  | "crab-soon"
  | "crab-ready"
  | "fhorn-soon"
  | "fhorn-ready"
  | "dont-pulse"
  | "ok-pulse";

export type VerdantOracleAlert = {
  id: VerdantOracleAlertId;
  label: string;
  color: string;
  flash: boolean;
};

export type VerdantOracleAlertInput = {
  energy: number;
  petals: number;
  crab: VerdantImagineState;
  flamehorn: VerdantImagineState;
};

const alert = (
  id: VerdantOracleAlertId,
  label: string,
  color: string,
  flash = false,
): VerdantOracleAlert => ({ id, label, color, flash });

/**
 * Resolve the compact Verdant Oracle HUD alerts.
 *
 * Priority is local to each information lane so unrelated alerts can coexist:
 * - CRITICAL ENERGY > LOW ENERGY
 * - Petals <= 2 = OK TO PULSE, petals 3 = neutral, petals >= 4 = DON'T PULSE
 * - Each tracked Imagine is hidden until its final 10 seconds, then READY once
 *   the live cooldown completes.
 */
export function resolveVerdantOracleAlerts(
  input: VerdantOracleAlertInput,
): VerdantOracleAlert[] {
  const alerts: VerdantOracleAlert[] = [];

  if (input.energy < 30) {
    alerts.push(
      alert(
        "critical-energy",
        "CRITICAL ENERGY",
        VERDANT_ORACLE_ALERT_COLORS.criticalEnergy,
        true,
      ),
    );
  } else if (input.energy < 60) {
    alerts.push(
      alert(
        "low-energy",
        "LOW ENERGY",
        VERDANT_ORACLE_ALERT_COLORS.lowEnergy,
      ),
    );
  }

  if (input.petals <= 2) {
    alerts.push(
      alert(
        "ok-pulse",
        "OK TO PULSE",
        VERDANT_ORACLE_ALERT_COLORS.okPulse,
      ),
    );
  } else if (input.petals >= 4) {
    alerts.push(
      alert(
        "dont-pulse",
        "DON'T PULSE",
        VERDANT_ORACLE_ALERT_COLORS.dontPulse,
      ),
    );
  }

  if (input.crab === "soon") {
    alerts.push(
      alert(
        "crab-soon",
        "CRAB READY in 10s",
        VERDANT_ORACLE_ALERT_COLORS.imagineSoon,
      ),
    );
  } else if (input.crab === "ready") {
    alerts.push(
      alert(
        "crab-ready",
        "CRAB READY",
        VERDANT_ORACLE_ALERT_COLORS.imagineReady,
      ),
    );
  }

  if (input.flamehorn === "soon") {
    alerts.push(
      alert(
        "fhorn-soon",
        "FHorn READY in 10s",
        VERDANT_ORACLE_ALERT_COLORS.imagineSoon,
      ),
    );
  } else if (input.flamehorn === "ready") {
    alerts.push(
      alert(
        "fhorn-ready",
        "FHorn READY",
        VERDANT_ORACLE_ALERT_COLORS.imagineReady,
      ),
    );
  }

  return alerts;
}
