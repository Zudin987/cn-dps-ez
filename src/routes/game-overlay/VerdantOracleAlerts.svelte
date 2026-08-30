<script lang="ts">
  import { resolveVerdantOracleAlerts } from "$lib/verdant-oracle-alerts";
  import {
    activeBuffIds,
    buffMap,
    fightResMap,
    getResourceValue,
  } from "./overlay-state.svelte.js";

  type AlertLane = "energy" | "petal" | "combo";
  let { lane = "combo" }: { lane?: AlertLane } = $props();

  const VERDANT_ENERGY_ID = 15001;
  const VERDANT_PETAL_ID = 15011;
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

  const alerts = $derived.by(() => {
    if (!liveResourcesObserved) return [];

    const stagBuildup = activeIds.has(STAG_BUILDUP_BUFF_ID)
      ? Math.max(0, buffs.get(STAG_BUILDUP_BUFF_ID)?.layer ?? 0)
      : 0;

    return resolveVerdantOracleAlerts({
      energy,
      petals,
      enhancedInfusionReady: activeIds.has(ENHANCED_INFUSION_BUFF_ID),
      stagReady:
        activeIds.has(STAG_READY_BUFF_ID) || stagBuildup >= STAG_READY_COUNT,
    });
  });

  const visibleAlerts = $derived(
    alerts.filter((alert) => {
      if (lane === "energy") {
        return alert.id === "low-energy" || alert.id === "critical-energy";
      }
      if (lane === "petal") {
        return alert.id === "ok-pulse" || alert.id === "dont-pulse";
      }
      return (
        alert.id === "einf-ready" ||
        alert.id === "stag-ready" ||
        alert.id === "einf-stag"
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

  .verdant-alerts.petal .verdant-alert {
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
