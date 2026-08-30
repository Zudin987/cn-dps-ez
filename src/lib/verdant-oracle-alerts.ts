export const VERDANT_ORACLE_ALERT_COLORS = {
  lowEnergy: "#FFB020",
  criticalEnergy: "#FF3B30",
  einfReady: "#7CFF6B",
  stagReady: "#FFD84D",
  einfStag: "#FF4DFF",
  dontPulse: "#FF6A00",
  okPulse: "#3FE0C5",
} as const;

export type VerdantOracleAlertId =
  | "low-energy"
  | "critical-energy"
  | "einf-ready"
  | "stag-ready"
  | "einf-stag"
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
  enhancedInfusionReady: boolean;
  stagReady: boolean;
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
 * Priority is intentionally local to each information lane so unrelated useful
 * alerts can coexist while redundant states cannot:
 * - CRITICAL ENERGY > LOW ENERGY
 * - Petals <= 2 = OK TO PULSE, petals 3 = neutral, petals >= 4 = DON'T PULSE
 * - EINF → STAG > EINF READY / STAG READY
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

  if (input.enhancedInfusionReady && input.stagReady) {
    alerts.push(
      alert(
        "einf-stag",
        "EINF → STAG",
        VERDANT_ORACLE_ALERT_COLORS.einfStag,
      ),
    );
  } else {
    if (input.enhancedInfusionReady) {
      alerts.push(
        alert(
          "einf-ready",
          "EINF READY",
          VERDANT_ORACLE_ALERT_COLORS.einfReady,
        ),
      );
    }
    if (input.stagReady) {
      alerts.push(
        alert(
          "stag-ready",
          "STAG READY",
          VERDANT_ORACLE_ALERT_COLORS.stagReady,
        ),
      );
    }
  }

  return alerts;
}
