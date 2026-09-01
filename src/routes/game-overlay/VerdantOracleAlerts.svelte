<script lang="ts">
  import type { SkillCdState } from "$lib/api";
  import {
    resolveVerdantImagineCooldownState,
    resolveVerdantOracleAlerts,
    VERDANT_IMAGINE_SKILL_IDS,
    type VerdantImagineState,
  } from "$lib/verdant-oracle-alerts";
  import {
    cdMap,
    displayMap,
    fightResMap,
    getResourceValue,
  } from "./overlay-state.svelte.js";
  import { overlayNow } from "./overlay-clock.svelte.js";
  import { computeDisplay } from "./overlay-utils";

  type AlertLane = "energy" | "petal" | "combo";
  let { lane = "combo" }: { lane?: AlertLane } = $props();

  const VERDANT_ENERGY_ID = 15001;
  const VERDANT_PETAL_ID = 15011;
  const WARD_SKILL_ID = 1531;
  const PULSE_SKILL_ID = 1523;

  const resources = $derived(fightResMap());
  const liveResourcesObserved = $derived(
    resources.has(VERDANT_ENERGY_ID) && resources.has(VERDANT_PETAL_ID),
  );
  const energy = $derived(getResourceValue(VERDANT_ENERGY_ID));
  const petals = $derived(getResourceValue(VERDANT_PETAL_ID));
  const cooldowns = $derived(cdMap());
  const skillDisplays = $derived(displayMap());
  const now = $derived(overlayNow());

  function exactRemainingSeconds(cd: SkillCdState): number {
    const cdAccelerateRate = Math.max(0, cd.cdAccelerateRate ?? 0);
    const elapsed = Math.max(0, now - cd.receivedAt);
    const baseDuration = cd.duration > 0 ? Math.max(1, cd.duration) : 1;
    const reducedDuration =
      cd.duration > 0 ? Math.max(0, cd.calculatedDuration) : 0;
    const validCdScale =
      cd.duration > 0 ? reducedDuration / baseDuration : 1;
    const progressed =
      cd.validCdTime * validCdScale + elapsed * (1 + cdAccelerateRate);
    const remainingMs =
      reducedDuration > 0 ? Math.max(0, reducedDuration - progressed) : 0;
    return remainingMs / 1000;
  }

  function imagineState(skillId: number): VerdantImagineState {
    const cd = cooldowns.get(skillId);
    if (!cd) return "hidden";

    const display = computeDisplay("verdant_oracle", skillId, cd, now);
    if (!display) return "hidden";

    return resolveVerdantImagineCooldownState(
      display.isActive,
      exactRemainingSeconds(cd),
    );
  }

  const alerts = $derived.by(() => {
    if (!liveResourcesObserved) return [];

    return resolveVerdantOracleAlerts({
      energy,
      petals,
      // Reuse the skill HUD's live readiness semantics. Missing active-CD
      // display means usable, matching the original Ward → Pulse detector.
      wardUsable: skillDisplays.get(WARD_SKILL_ID)?.usable ?? true,
      pulseUsable: skillDisplays.get(PULSE_SKILL_ID)?.usable ?? true,
      crab: imagineState(VERDANT_IMAGINE_SKILL_IDS.phantomArachnocrab),
      flamehorn: imagineState(VERDANT_IMAGINE_SKILL_IDS.flamehorn),
    });
  });

  const visibleAlerts = $derived(
    alerts.filter((alert) => {
      if (lane === "energy") {
        return alert.id === "low-energy" || alert.id === "critical-energy";
      }
      if (lane === "petal") {
        return (
          alert.id === "ward-pulse" ||
          alert.id === "ok-pulse" ||
          alert.id === "dont-pulse"
        );
      }
      return (
        alert.id === "crab-soon" ||
        alert.id === "crab-ready" ||
        alert.id === "fhorn-soon" ||
        alert.id === "fhorn-ready"
      );
    }),
  );
</script>

{#if visibleAlerts.length > 0}
  <div
    class="verdant-alerts"
    class:petal={lane === "petal"}
    class:combo={lane === "combo"}
    aria-live="polite"
  >
    {#each visibleAlerts as alert (alert.id)}
      <div
        class="verdant-alert"
        class:critical-flash={alert.flash}
        style:--verdant-alert-color={alert.color}
      >
        {alert.label}
      </div>
    {/each}
  </div>
{/if}

<style>
  .verdant-alerts {
    display: inline-flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 4px;
    margin-left: 8px;
    vertical-align: middle;
  }

  .verdant-alerts.combo {
    max-width: 290px;
    flex-wrap: wrap;
    margin-top: 4px;
    margin-left: 15px;
  }

  .verdant-alert {
    padding: 2px 6px;
    border: 1px solid var(--verdant-alert-color);
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.68);
    color: var(--verdant-alert-color);
    font-size: 12px;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: 0.02em;
    white-space: nowrap;
    text-shadow: 0 0 5px color-mix(in srgb, var(--verdant-alert-color) 55%, transparent);
    box-shadow: 0 0 5px color-mix(in srgb, var(--verdant-alert-color) 32%, transparent);
  }

  /* Normal Pulse guidance stays text-only. WARD → PULSE carries the
     critical-flash class, so it keeps the red warning border/background. */
  .verdant-alerts.petal .verdant-alert:not(.critical-flash) {
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    text-shadow:
      0 0 4px color-mix(in srgb, var(--verdant-alert-color) 80%, transparent),
      0 0 9px color-mix(in srgb, var(--verdant-alert-color) 58%, transparent);
  }

  .verdant-alert.critical-flash {
    animation: verdant-critical-flash 650ms steps(2, end) infinite;
  }

  @keyframes verdant-critical-flash {
    0%,
    45% {
      opacity: 1;
      background: rgba(255, 59, 48, 0.2);
      box-shadow: 0 0 9px rgba(255, 59, 48, 0.75);
    }
    46%,
    100% {
      opacity: 0.42;
      background: rgba(0, 0, 0, 0.68);
      box-shadow: 0 0 3px rgba(255, 59, 48, 0.35);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .verdant-alert.critical-flash {
      animation: none;
      background: rgba(255, 59, 48, 0.2);
      box-shadow: 0 0 9px rgba(255, 59, 48, 0.75);
    }
  }
</style>
