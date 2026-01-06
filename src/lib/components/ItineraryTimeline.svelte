<script lang="ts">
  import type { Activity } from '$lib/types';

  export let activities: Activity[] = [];
  export let addTargetId: string | null = null;
  export let emphasizeAdd = false;
</script>

<div class="space-y-5">
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-semibold">Itinerary</h3>
    {#if addTargetId}
      <label
        class={`btn btn-sm ${emphasizeAdd ? 'btn-primary' : 'btn-ghost text-primary'}`}
        for={addTargetId}
      >
        + Add Activity
      </label>
    {:else}
      <button class={`btn btn-sm ${emphasizeAdd ? 'btn-primary' : 'btn-ghost text-primary'}`}>
        + Add Activity
      </button>
    {/if}
  </div>

  {#each activities as activity}
    <div class="flex gap-4">
      <div class="flex flex-col items-center">
        <div class="h-3 w-3 rounded-full bg-primary"></div>
        <div class="flex-1 w-px bg-base-200"></div>
      </div>
      <div class="flex-1 card bg-base-100 border border-base-200 shadow-sm">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <div>
              {#if !activity.options?.length}
                <p class="text-xs text-base-content/60">{activity.time}</p>
              {/if}
              <h4 class="text-base font-semibold">{activity.title}</h4>
              <p class="text-sm text-base-content/60">{activity.location}</p>
            </div>
            {#if activity.status}
              <span class="badge badge-outline text-primary">{activity.status}</span>
            {/if}
          </div>
          <div class="mt-3 flex flex-wrap gap-3 text-xs text-base-content/70">
            {#if activity.timeframe}
              <span class="badge badge-outline">{activity.timeframe}</span>
            {/if}
            {#if activity.cost !== undefined}
              <span class="badge badge-outline">${activity.cost}</span>
            {/if}
            {#if activity.link}
              <a class="link link-hover text-primary" href={activity.link} target="_blank" rel="noreferrer">
                View link
              </a>
            {/if}
          </div>
          {#if activity.options}
            <div class="mt-4 space-y-3">
              {#each activity.options as option}
                <div class="flex items-center justify-between rounded-xl border border-base-200 p-3">
                  <div class="flex items-center gap-3">
                    {#if option.image}
                      <img class="h-10 w-10 rounded-xl object-cover" src={option.image} alt={option.name} />
                    {/if}
                    <span class="font-semibold">{option.name}</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-sm text-primary font-semibold">{option.votes} votes</span>
                    <button class="btn btn-xs btn-outline">Vote</button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/each}
</div>
