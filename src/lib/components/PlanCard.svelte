<script lang="ts">
  import type { Plan } from '$lib/types';

  export let plan: Plan;

  $: progressValue = plan.goal > 0 ? (plan.raised / plan.goal) * 100 : 0;
</script>

<div class="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
  <div class="relative">
    <img class="h-44 w-full object-cover" src={plan.coverImage} alt={plan.title} />
    <div class="absolute top-3 left-3 badge badge-outline bg-base-100/80">
      {plan.type === 'trip' ? 'Trip' : plan.type === 'event' ? 'Event' : 'Group Buy'}
    </div>
    <div class="absolute top-3 right-3 badge badge-success bg-primary/90 text-primary-content">
      {plan.status}
    </div>
  </div>
  <div class="card-body gap-4">
    <div class="flex items-start justify-between">
      <div>
        <h3 class="text-lg font-semibold">{plan.title}</h3>
        <div class="text-sm text-base-content/60">
          <p>{plan.dateRange}</p>
          <p>{plan.location}</p>
        </div>
      </div>
      <button class="btn btn-ghost btn-xs">...</button>
    </div>

    <div>
      <div class="flex items-center justify-between text-xs text-base-content/60 mb-2">
        <span>${plan.raised.toLocaleString()} raised</span>
        <span>${plan.goal.toLocaleString()} goal</span>
      </div>
      <progress class="progress progress-primary" value={progressValue} max="100"></progress>
    </div>

    <div class="grid grid-cols-2 gap-3 text-center text-sm">
      <div class="rounded-xl border border-base-200 py-2">
        <p class="text-xs text-base-content/60">Per person</p>
        <p class="font-semibold">${plan.perPerson}</p>
      </div>
      <div class="rounded-xl border border-base-200 py-2">
        <p class="text-xs text-base-content/60">Due by</p>
        <p class="font-semibold">{plan.dueBy}</p>
      </div>
    </div>

    <div class="flex items-center justify-between">
      <div class="flex -space-x-2">
        {#each plan.participants as person, index}
          {#if index < 3}
            <div class="avatar placeholder">
              <div class="bg-base-200 rounded-full w-8">
                <span class="text-xs">{person.name.slice(0, 1)}</span>
              </div>
            </div>
          {/if}
        {/each}
        {#if plan.participants.length > 3}
          <div class="avatar placeholder">
            <div class="bg-base-200 rounded-full w-8">
              <span class="text-xs">+{plan.participants.length - 3}</span>
            </div>
          </div>
        {/if}
      </div>
      <a class="text-sm font-semibold text-primary" href={`/plans/${plan.id}/organizer`}>Manage -></a>
    </div>
  </div>
</div>
