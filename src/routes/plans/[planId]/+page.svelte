<script lang="ts">
  import OrganizerPlanPage from './organizer/+page.svelte';
  import ParticipantPlanPage from './participant/+page.svelte';

  const props = $props();
</script>

{#if props.data.isOrganizer}
  <OrganizerPlanPage data={props.data} />
{:else}
  <ParticipantPlanPage data={props.data} />
{/if}
