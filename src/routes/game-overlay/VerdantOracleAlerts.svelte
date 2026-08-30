<script lang="ts">
  import { resolveVerdantOracleAlerts } from "$lib/verdant-oracle-alerts";
  import {
    activeBuffIds,
    buffMap,
    displayMap,
    fightResMap,
    getResourceValue,
  } from "./overlay-state.svelte.js";

  const VERDANT_ENERGY_ID = 15001;
  const VERDANT_PETAL_ID = 15011;
  const WARD_SKILL_ID = 1531;
  const PULSE_SKILL_ID = 1523;
  const ENHANCED_INFUSION_BUFF_ID = 2202131;
  const STAG_BUILDUP_BUFF_ID = 2202251;
  const STAG_READY_BUFF_ID = 2202252;
  const STAG_READY_COUNT = 10;

  const resources = $derived(fightResMap());
  const liveResourcesObserved = $derived(
    resources.has(VERDANT_ENERGY_ID) && resources.has(VERDANT_PETAL_ID),
  );
  const energy = $derived(getResourceValue(VERDANT_ENERGY_ID));
  const petals = $derived(getResourceValue(VERDANT_PETAL_ID));
  const activeIds = $derived(activeBuffIds());
  const buffs = $derived(buffMap());
  const skillDisplays = $derived(displayMap());

  const alerts = $derived.by(() => {
    if (!liveResourcesObserved) return [];

    const stagBuildup = activeIds.has(STAG_BUILDUP_BUFF_ID)
      ? Math.max(0, buffs.get(STAG_BUILDUP_BUFF_ID)?.layer ?? 0)
      : 0;

    return resolveVerdantOracleAlerts({
      energy,
      petals,
      // Match the existing skill HUD's readiness semantics: no active CD
      // display means usable, while charge skills can remain usable as they
      // recharge when the backend reports an available charge.
      wardUsable: skillDisplays.get(WARD_SKILL_ID)?.usable ?? true,
      pulseUsable: skillDisplays.get(PULSE_SKILL_ID)?.usable ?? true,
      enhancedInfusionReady: activeIds.has(ENHANCED_INFUSION_BUFF_ID),
      stagReady:
        activeIds.has(STAG_READY_BUFF_ID) || stagBuildup >= STAG_READY_COUNT,
    });
  });
</script>

{#if alerts.length > 0}
  <div class="verdant-alerts" aria-live="polite">
    {#each alerts as alert (alert.id)}
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
    display: flex;
    max-width: 290px;
    flex-wrap: wrap;
    gap: 4px;
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
