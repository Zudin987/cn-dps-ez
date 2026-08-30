<script lang="ts">
  import { t } from "$lib/i18n/index.svelte";
  import {
    activeBuffIds,
    buffDurationPercents,
    buffMap,
    getGroupPosition,
    getGroupScale,
    getResourcePreciseValue,
    getResourceValue,
    isEditing,
    selectedClassKey,
    startDrag,
    startResize,
  } from "./overlay-state.svelte.js";
  import { findResourcesByClass } from "$lib/skill-mappings";
  import VerdantOracleAlerts from "./VerdantOracleAlerts.svelte";

  const VERDANT_SEED_TRIGGER_BUFF_ID = 2202251;

  const editing = $derived(isEditing());
  const groupPos = $derived(getGroupPosition("resourceGroup"));
  const groupScale = $derived(getGroupScale("resourceGroupScale"));
  const classKey = $derived(selectedClassKey());
  const durationPercents = $derived(buffDurationPercents());
  const activeIds = $derived(activeBuffIds());
  const buffs = $derived(buffMap());
  const resources = $derived(findResourcesByClass(classKey));
  const barResources = $derived(resources.filter((res) => res.type === "bar"));
  const chargeResources = $derived(
    resources.filter((res) => res.type === "charges"),
  );
  const seedTriggerCounter = $derived.by(() => {
    if (
      classKey !== "verdant_oracle" ||
      !activeIds.has(VERDANT_SEED_TRIGGER_BUFF_ID)
    ) {
      return 0;
    }

    return Math.min(
      9,
      Math.max(0, buffs.get(VERDANT_SEED_TRIGGER_BUFF_ID)?.layer ?? 0),
    );
  });
</script>

<div
  class="overlay-group resource-group"
  class:editable={editing}
  style:left={`${groupPos.x}px`}
  style:top={`${groupPos.y}px`}
  style:transform={`scale(${groupScale})`}
  style:transform-origin="top left"
  onpointerdown={(e) =>
    startDrag(e, { kind: "group", key: "resourceGroup" }, groupPos)}
>
  {#if editing}
    <div class="group-tag">{t("gameOverlay.group.resource")}</div>
  {/if}

  <div class="resources-panel" data-class={classKey}>
    <div class="resources-row energy-row">
      {#each barResources as res}
        {@const cur = getResourceValue(res.currentId)}
        {@const max = Math.max(1, getResourceValue(res.maxId))}
        {@const curPrecise = getResourcePreciseValue(res.currentId)}
        {@const maxPrecise = Math.max(1, getResourcePreciseValue(res.maxId))}
        {@const energyPercent = Math.min(
          100,
          Math.max(0, (curPrecise / maxPrecise) * 100),
        )}
        {@const effectiveBuffIds =
          res.buffBaseIds ?? (res.buffBaseId ? [res.buffBaseId] : [])}
        {@const buffPercent = effectiveBuffIds.length
          ? Math.max(
              0,
              ...effectiveBuffIds.map((id) => durationPercents.get(id) ?? 0),
            )
          : energyPercent}
        <div class="res-bar-container">
          <img src={res.imageOff} alt={res.label} class="res-bar-bg" />
          <div
            class="res-bar-fill-mask"
            style:clip-path={`inset(0 ${100 - buffPercent}% 0 0)`}
          >
            <img src={res.imageOn} alt={res.label} class="res-bar-fill" />
          </div>
          <div class="res-energy-overlay">
            <div class="res-energy-track">
              <div
                class="res-energy-fill"
                style:transform={`scaleX(${energyPercent / 100})`}
              ></div>
            </div>
          </div>
          <div class="res-text">
            <span>{cur}/{max}</span>
            {#if classKey === "verdant_oracle"}
              <VerdantOracleAlerts lane="energy" />
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <div class="resources-row sharpness-row">
      {#each chargeResources as res}
        {@const cur = getResourceValue(res.currentId)}
        {@const max = Math.max(1, getResourceValue(res.maxId))}
        <div class="res-charges-container">
          {#if res.compactAbove !== undefined}
            {@const compactCur = Math.max(0, cur)}
            {@const compactMultiplierPrefix =
              res.compactMultiplierPrefix ?? "*"}
            {#if classKey === "verdant_oracle"}
              <img
                src={compactCur > 0 ? res.imageOn : res.imageOff}
                alt={res.label}
                class="res-charge-icon"
              />
              <span class="res-charge-multiplier"
                >{compactMultiplierPrefix}{compactCur}</span
              >
            {:else if compactCur <= 0}
              <img
                src={res.imageOff}
                alt={res.label}
                class="res-charge-icon"
              />
            {:else if compactCur > res.compactAbove}
              <img
                src={res.imageOn}
                alt={res.label}
                class="res-charge-icon"
              />
              <span class="res-charge-multiplier"
                >{compactMultiplierPrefix}{compactCur}</span
              >
            {:else}
              {#each Array(compactCur) as _}
                <img
                  src={res.imageOn}
                  alt={res.label}
                  class="res-charge-icon"
                />
              {/each}
            {/if}
          {:else}
            {#each Array(max) as _, i}
              <img
                src={i < cur ? res.imageOn : res.imageOff}
                alt={res.label}
                class="res-charge-icon"
              />
            {/each}
          {/if}
          {#if classKey === "verdant_oracle"}
            <VerdantOracleAlerts lane="petal" />
          {/if}
        </div>
      {/each}

      {#if classKey === "verdant_oracle"}
        <div class="verdant-secondary-row">
          <div
            class="verdant-seed-counter"
            aria-label={`Seed Trigger Counter ${seedTriggerCounter}`}
            title="Seed Trigger Counter"
          >
            <span class="verdant-seed-dot"></span>
            <span class="verdant-seed-value">{seedTriggerCounter}</span>
          </div>
          <VerdantOracleAlerts lane="combo" />
        </div>
      {/if}
    </div>
  </div>

  {#if editing}
    <div
      class="resize-handle"
      onpointerdown={(e) =>
        startResize(
          e,
          { kind: "group", key: "resourceGroupScale" },
          groupScale,
        )}
    ></div>
  {/if}
</div>

<style>
  .resource-group.editable {
    border: 2px solid var(--overlay-edit-panel-border);
    border-radius: 10px;
    background: var(--overlay-edit-panel-bg);
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.35);
    margin: -10px;
    padding: 8px;
  }

  .resources-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .resources-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .sharpness-row {
    margin-top: -2px;
  }

  .resources-panel[data-class="frost_mage"] {
    transform: scale(1.5);
    transform-origin: center;
  }

  .resources-panel[data-class="flame_berserker"] .res-energy-overlay {
    padding: 17px 62px 0 22px;
  }

  .resources-panel[data-class="verdant_oracle"] {
    align-items: flex-start;
    gap: 0;
  }

  .resources-panel[data-class="verdant_oracle"] .resources-row {
    justify-content: flex-start;
  }

  .resources-panel[data-class="verdant_oracle"] .res-bar-container {
    margin-top: 20px;
  }

  .resources-panel[data-class="verdant_oracle"] .res-energy-overlay {
    padding: 0 29px 1px 43px;
  }

  .resources-panel[data-class="verdant_oracle"] .res-energy-track {
    height: 6px;
    border-radius: 1px;
    background: transparent;
  }

  .resources-panel[data-class="verdant_oracle"] .res-energy-fill {
    border-radius: 1px;
    box-shadow: none;
  }

  .resources-panel[data-class="verdant_oracle"] .res-text {
    top: -19px;
    left: 15px;
  }

  .resources-panel[data-class="verdant_oracle"] .sharpness-row {
    align-self: stretch;
    width: 100%;
    box-sizing: border-box;
    margin-top: -5px;
    margin-left: 0;
    padding: 10px 15px 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    background: rgba(0, 0, 0, 0.95);
  }

  .resources-panel[data-class="verdant_oracle"] .res-charges-container {
    align-items: center;
  }

  .resources-panel[data-class="verdant_oracle"] .res-charge-icon {
    height: 22px;
  }

  .resources-panel[data-class="verdant_oracle"] .res-charge-multiplier {
    margin-left: 4px;
    font-size: 18px;
    line-height: 22px;
  }

  .verdant-secondary-row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 30px;
    white-space: nowrap;
  }

  .verdant-seed-counter {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    min-width: 72px;
  }

  .verdant-seed-dot {
    display: inline-block;
    width: 26px;
    height: 26px;
    flex: 0 0 26px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow:
      0 0 7px rgba(34, 197, 94, 0.85),
      0 0 13px rgba(34, 197, 94, 0.5);
  }

  .verdant-seed-value {
    color: #22c55e;
    font-size: 24px;
    font-weight: 800;
    line-height: 26px;
    text-shadow:
      0 0 6px rgba(34, 197, 94, 0.8),
      1px 1px 2px rgba(0, 0, 0, 0.95);
  }

  .resources-panel[data-class="verdant_oracle"]
    .verdant-secondary-row
    :global(.verdant-alerts.combo) {
    margin: 0;
    max-width: none;
    flex-wrap: nowrap;
  }

  .res-bar-container {
    position: relative;
    margin-top: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .res-bar-bg {
    display: block;
    height: 40px;
    width: auto;
  }

  .res-bar-fill-mask {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .res-bar-fill {
    display: block;
    height: 40px;
    width: auto;
  }

  .res-energy-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    padding: 0 43px 0 29px;
  }

  .res-energy-track {
    width: 100%;
    height: 5px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.18);
    overflow: hidden;
  }

  .res-energy-fill {
    width: 100%;
    height: 100%;
    border-radius: 999px;
    background: #ffffff;
    box-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
    transform-origin: left center;
    transition: transform 100ms linear;
    will-change: transform;
  }

  .res-text {
    position: absolute;
    top: -17px;
    left: 0;
    display: flex;
    align-items: center;
    font-size: 14px;
    font-weight: 700;
    color: #ffffff;
    text-shadow: var(--overlay-text-shadow, 1px 1px 2px rgba(0, 0, 0, 0.9));
    white-space: nowrap;
  }

  .res-charges-container {
    display: flex;
    flex-direction: row;
  }

  .res-charge-icon {
    height: 24px;
    width: auto;
  }

  .res-charge-multiplier {
    margin-left: 2px;
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
    line-height: 24px;
    text-shadow: var(--overlay-text-shadow, 1px 1px 2px rgba(0, 0, 0, 0.9));
  }
</style>
