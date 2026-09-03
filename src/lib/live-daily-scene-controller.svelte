<script lang="ts">
  import { getLiveAutoHideInDailyScenes } from "$lib/live-daily-scene-setting";
  import {
    resolveLiveDailySceneVisibilityUpdate,
    type LiveDailySceneVisibilityMemory,
  } from "$lib/live-daily-scene-visibility";
  import { readHudDomainRules } from "$lib/hud-domain-rules.svelte";
  import {
    domainRequiresSupportedScene,
    resolveSceneVisibility,
  } from "$lib/hud-scene-visibility";
  import { setOverlayWindowVisible } from "$lib/overlay-window-visibility.svelte";
  import { liveSceneStore } from "$lib/stores/live-topics.svelte";

  let visibilityMemory: LiveDailySceneVisibilityMemory = {
    sceneId: undefined,
    autoHide: undefined,
  };

  // Scene transitions establish the default live-meter visibility. We do not
  // react to the window's own visibility state, so a manual toggle remains in
  // effect until the user changes this setting or enters another real scene.
  // Temporary missing scene telemetry is deliberately ignored so reconnecting
  // to the same scene cannot overwrite that manual toggle.
  $effect(() => {
    const sceneId = liveSceneStore.data?.sceneId ?? null;
    const autoHide = getLiveAutoHideInDailyScenes();
    const previousSceneId = visibilityMemory.sceneId;
    const decision = resolveLiveDailySceneVisibilityUpdate(
      visibilityMemory,
      sceneId,
      autoHide,
    );

    visibilityMemory = decision.memory;

    // Resource Monitor uses the shared HUD window. Its Toggle Overlay button
    // is allowed to override scene auto-hide temporarily, just like Live/DPS.
    // Reapply the persisted Resource Monitor rules only when the game really
    // changes scene. This also catches daily -> daily transitions where the
    // resolved boolean would otherwise remain false and not retrigger an effect.
    if (sceneId !== null && decision.memory.sceneId !== previousSceneId) {
      void setOverlayWindowVisible(
        "game",
        resolveSceneVisibility({
          ...readHudDomainRules("game"),
          sceneId,
          requiresSupportedScene: domainRequiresSupportedScene("game"),
        }),
      );
    }

    if (decision.shouldShow === null) return;
    void setOverlayWindowVisible("live", decision.shouldShow);
  });
</script>
