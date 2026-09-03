<script lang="ts">
  import { getLiveAutoHideInDailyScenes } from "$lib/live-daily-scene-setting";
  import {
    resolveLiveDailySceneVisibilityUpdate,
    type LiveDailySceneVisibilityMemory,
  } from "$lib/live-daily-scene-visibility";
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
    const decision = resolveLiveDailySceneVisibilityUpdate(
      visibilityMemory,
      sceneId,
      autoHide,
    );

    visibilityMemory = decision.memory;
    if (decision.shouldShow === null) return;

    void setOverlayWindowVisible("live", decision.shouldShow);
  });
</script>
