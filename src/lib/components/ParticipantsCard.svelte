<script lang="ts">
  import type { Participant } from '$lib/types';

  export let participants: Participant[] = [];
</script>

<div class="card bg-base-100 border border-base-200 shadow-sm">
  <div class="card-body gap-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Participants ({participants.length})</h3>
      <button class="btn btn-xs btn-ghost text-primary">Manage</button>
    </div>
    <div class="space-y-3">
      {#each participants as person}
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="avatar placeholder">
              <div class="bg-base-200 text-base-content rounded-full w-9">
                <span>{person.name.slice(0, 1)}</span>
              </div>
            </div>
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
