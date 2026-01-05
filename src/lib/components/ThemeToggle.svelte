<script lang="ts">
  import { theme } from '$lib/stores/theme';

  const themes = [
    { id: 'plannit', label: 'Plannit' },
    { id: 'mint', label: 'Mint' },
    { id: 'coastal', label: 'Coastal' }
  ];
</script>

<label class="flex items-center gap-2 text-sm font-medium">
  <span class="hidden sm:inline">Theme</span>
  <select class="select select-bordered select-sm" bind:value={$theme}>
    {#each themes as option}
      <option value={option.id}>{option.label}</option>
    {/each}
  </select>
</label>
