<script lang="ts">
  import type { ActivityOption } from '$lib/types';

  export let proposals: ActivityOption[] = [];
</script>

<div class="card bg-base-100 border border-base-200 shadow-sm">
  <div class="card-body gap-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">Activity Proposals</h3>
        <p class="text-sm text-base-content/60">Vote for Saturday night's dinner spot.</p>
      </div>
      <button class="btn btn-sm btn-outline">+ Propose Activity</button>
    </div>
    <div class="space-y-3">
      {#each proposals as proposal}
        <div class="flex items-center justify-between rounded-2xl border border-base-200 p-4">
          <div>
            <p class="font-semibold">{proposal.name}</p>
            <p class="text-xs text-base-content/60">Proposed by Sarah</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="badge badge-outline">{proposal.votes}</span>
            <button class="btn btn-ghost btn-square">-></button>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
