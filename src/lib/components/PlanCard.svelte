<script lang="ts">
  import type { Plan } from '$lib/types';
  import { formatShortDate } from '$lib/models/plan';
  import Avatar from '$lib/components/Avatar.svelte';
  import { goto } from '$app/navigation';

  export let plan: Plan;
  export let ctaHref: string | null = null;
  export let ctaLabel = 'Manage';

  $: progressValue = plan.goal > 0 ? (plan.raised / plan.goal) * 100 : 0;
  $: displayLocation =
    plan.city || plan.state
      ? [plan.city, plan.state].filter(Boolean).join(', ')
      : plan.location;

  const formatTimeline = (start?: Date | null, end?: Date | null) => {
    if (start && end) {
      const startLabel = formatShortDate(start);
      const endLabel = formatShortDate(end);
      return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
    }
    if (start) {
      return formatShortDate(start);
    }
    if (end) {
      return formatShortDate(end);
    }
    return 'Timeline TBD';
  };
</script>

<div
  class="card plan-glass border border-base-200 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md overflow-hidden cursor-pointer"
  role="link"
  tabindex="0"
  on:click={() => goto(ctaHref ?? `/plans/${plan.id}/organizer`)}
  on:keydown={(event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goto(ctaHref ?? `/plans/${plan.id}/organizer`);
    }
  }}
>
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
          <div class="text-sm text-base-content/60 space-y-1">
            <div class="flex items-center gap-2">
              <svg
                class="h-4 w-4 text-primary"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M6 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm10 7H4v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9Z"
                  clip-rule="evenodd"
                />
              </svg>
              <span class="text-primary">{formatTimeline(plan.startDay, plan.endDay)}</span>
            </div>
            <div class="flex items-center gap-2">
              <svg
                class="h-4 w-4 text-base-content/50"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M9.69 18.933a1 1 0 0 1-1.38 0C5.425 16.31 3 13.469 3 10.5A7 7 0 1 1 17 10.5c0 2.969-2.425 5.81-5.31 8.433ZM10 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>{displayLocation}</span>
            </div>
          </div>
        </div>
        <button class="btn btn-ghost btn-xs">...</button>
      </div>

      <div>
        <div class="flex items-center justify-between text-xs text-base-content/60 mb-2">
          <span>${plan.raised.toLocaleString()} collected</span>
          <span>${plan.goal.toLocaleString()} total cost</span>
        </div>
        <progress class="progress progress-primary" value={progressValue} max="100"></progress>
      </div>

      <div class="grid grid-cols-2 gap-3 text-center text-sm">
        <div class="rounded-xl border border-primary/20 bg-primary/10 py-2">
          <p class="text-xs text-primary/80">Per person</p>
          <p class="font-semibold">${plan.perPerson}</p>
        </div>
        <div class="rounded-xl border border-primary/20 bg-primary/10 py-2">
          <p class="text-xs text-primary/80">Due by</p>
          <p class="font-semibold">{formatShortDate(plan.deadline)}</p>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div class="flex -space-x-2">
          {#each plan.participants as person, index}
            {#if index < 3}
              <Avatar
                initials={person.name.slice(0, 1)}
                size="sm"
                status="online"
                textClass="text-xs"
                imageUrl={person.avatar ?? null}
              />
            {/if}
          {/each}
          {#if plan.participants.length > 3}
            <Avatar
              initials={`+${plan.participants.length - 3}`}
              size="sm"
              status="none"
              textClass="text-xs"
            />
          {/if}
        </div>
      <a
        class="btn btn-outline btn-xs text-primary border-primary"
        href={ctaHref ?? `/plans/${plan.id}/organizer`}
        on:click|stopPropagation
      >
        <span>{ctaLabel}</span>
        <span class="material-symbols-outlined text-sm">arrow_forward</span>
      </a>
      </div>
    </div>
</div>
