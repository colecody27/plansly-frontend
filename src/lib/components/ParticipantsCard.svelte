<script lang="ts">
  import type { Participant } from '$lib/types';
  import Avatar from '$lib/components/Avatar.svelte';

  export let participants: Participant[] = [];
  export let showManage = true;
  export let manageTargetId: string | null = null;
</script>

<div class="card bg-base-100 border border-base-200 shadow-sm">
  <div class="card-body gap-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Participants ({participants.length})</h3>
      {#if showManage}
        {#if manageTargetId}
          <label class="btn btn-xs btn-ghost text-primary" for={manageTargetId}>Manage</label>
        {:else}
          <button class="btn btn-xs btn-ghost text-primary">Manage</button>
        {/if}
      {/if}
    </div>
    <div class="space-y-3">
      {#each participants as person}
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Avatar initials={person.name.slice(0, 1)} status="online" />
            <div>
              <p class="font-semibold text-sm">{person.name}</p>
              {#if person.status === 'organizer'}
                <span class="badge badge-success badge-xs">Organizer</span>
              {:else if person.status === 'paid'}
                <span class="text-xs text-primary">Paid</span>
              {:else}
                <span class="text-xs text-warning">Pending</span>
              {/if}
            </div>
          </div>
          {#if person.contribution}
            <span class="text-xs text-primary">Paid ${person.contribution}</span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>
