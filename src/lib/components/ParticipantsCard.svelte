<script lang="ts">
  import type { Participant } from '$lib/types';
  import Avatar from '$lib/components/Avatar.svelte';

  export let participants: Participant[] = [];
  export let showManage = true;
  export let manageTargetId: string | null = null;
</script>

<div class="card plan-glass shadow-sm">
  <div class="card-body gap-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-primary">Participants ({participants.length})</h3>
      <div class="flex items-center gap-2">
        {#if showManage}
          {#if manageTargetId}
            <label class="btn btn-xs btn-ghost text-primary" for={manageTargetId}>Manage</label>
          {:else}
            <button class="btn btn-xs btn-ghost text-primary">Manage</button>
          {/if}
        {/if}
        <slot name="action"></slot>
      </div>
    </div>
    <div class="space-y-3">
      {#each participants as person}
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Avatar
              initials={person.name.slice(0, 1)}
              status="online"
              imageUrl={person.avatar ?? null}
            />
            <div>
              <p class="font-semibold text-sm">{person.name}</p>
              {#if person.status === 'organizer'}
                <span class="badge badge-success badge-xs">Organizer</span>
              {:else}
                <p class="text-xs text-base-content/60">
                  {person.status === 'admin' ? 'Admin' : 'Participant'}
                </p>
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
