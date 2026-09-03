<script lang="ts">
  import SettingsSwitch from "./settings-switch.svelte";
  import {
    getLiveAutoHideInDailyScenes,
    setLiveAutoHideInDailyScenes,
  } from "$lib/live-daily-scene-setting";

  let autoHide = $state(getLiveAutoHideInDailyScenes());

  $effect(() => {
    autoHide = getLiveAutoHideInDailyScenes();
  });

  function updateAutoHide(enabled: boolean) {
    autoHide = enabled;
    setLiveAutoHideInDailyScenes(enabled);
  }
</script>

<div
  class="bg-card/40 border-border/60 overflow-hidden rounded-lg border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]"
>
  <div class="px-4 py-1">
    <SettingsSwitch
      bind:checked={autoHide}
      onCheckedChange={updateAutoHide}
      label="Hide DPS meter in daily scenes"
      description="Automatically hide the DPS window in open world and Guild social scenes, then show it again when you enter a dungeon or raid. A manual window toggle stays in effect until the next scene change."
    />
  </div>
</div>
