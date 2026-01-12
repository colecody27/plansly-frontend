<script lang="ts">
  import type { Activity } from '$lib/types';
  import type { ApiActivity, ApiResponse } from '$lib/api/types';
  import { formatActivityTime, formatTimeRange, mapActivityFromApi } from '$lib/models/plan';
  import { apiFetch } from '$lib/api/client';
  import { page } from '$app/stores';
  import { invalidate } from '$app/navigation';

  const props = $props();

  let activities = $state<Activity[]>(props.activities ?? []);
  let activityModalOpen = $state(false);
  let selectedActivity = $state<Activity | null>(null);
  let isVoteSubmitting = $state(false);

  const getRange = (activity: Activity) => {
    const start = activity.startTime ?? null;
    const end = activity.endTime ?? activity.startTime ?? null;
    return { start, end };
  };

  const rangesOverlap = (left: Activity, right: Activity) => {
    const leftRange = getRange(left);
    const rightRange = getRange(right);
    if (!leftRange.start || !rightRange.start) {
      return false;
    }
    const leftEnd = leftRange.end ?? leftRange.start;
    const rightEnd = rightRange.end ?? rightRange.start;
    return leftRange.start <= rightEnd && rightRange.start <= leftEnd;
  };

  const sortedActivities = $derived(
    [...activities].sort((a, b) => {
      const aTime = a.startTime?.getTime() ?? Number.POSITIVE_INFINITY;
      const bTime = b.startTime?.getTime() ?? Number.POSITIVE_INFINITY;
      if (aTime === bTime) {
        return a.title.localeCompare(b.title);
      }
      return aTime - bTime;
    })
  );

  const isApiResponse = (value: unknown): value is ApiResponse<ApiActivity> =>
    Boolean(value && typeof value === 'object' && 'data' in value);

  const isActivity = (value: unknown): value is Activity =>
    Boolean(value && typeof value === 'object' && 'id' in value && 'title' in value);

  const syncActivities = () => {
    activities = props.activities ?? [];
  };

  $effect(syncActivities);

  const updateActivity = (updated: Activity) => {
    activities = activities.map((activity) =>
      activity.id === updated.id ? updated : activity
    );
    if (selectedActivity?.id === updated.id) {
      selectedActivity = updated;
    }
  };

  const groupedActivities = $derived.by(() => {
    const groups: Array<
      | { type: 'single'; activity: Activity }
      | { type: 'group'; activities: Activity[]; start: Date | null }
    > = [];

    for (const activity of sortedActivities) {
      if (!activity.isProposed) {
        groups.push({ type: 'single', activity });
        continue;
      }

      const lastGroup = groups.at(-1);
      if (
        lastGroup?.type === 'group' &&
        lastGroup.activities.length > 0 &&
        rangesOverlap(lastGroup.activities[lastGroup.activities.length - 1], activity)
      ) {
        lastGroup.activities = [...lastGroup.activities, activity];
        continue;
      }

      groups.push({
        type: 'group',
        activities: [activity],
        start: activity.startTime ?? null
      });
    }

    return groups;
  });

  const getGroupTotals = (group: Activity[]) => {
    const counts = group.map((activity) => activity.votes?.length ?? 0);
    const total = counts.reduce((sum, count) => sum + count, 0);
    const max = counts.length ? Math.max(...counts) : 0;
    return { total, max };
  };

  const getProposalClasses = (votes: number, total: number, maxVotes: number) => {
    if (maxVotes > 0 && votes === maxVotes) {
      return 'border-success/40 bg-success/10';
    }
    if (!total) {
      return 'border-base-200 bg-base-100';
    }
    const ratio = votes / total;
    if (ratio >= 0.6) {
      return 'border-primary/40 bg-primary/15';
    }
    if (ratio >= 0.3) {
      return 'border-primary/30 bg-primary/10';
    }
    return 'border-base-200 bg-base-100';
  };

  const openActivityModal = (activity: Activity) => {
    selectedActivity = activity;
    activityModalOpen = true;
  };

  const closeActivityModal = () => {
    activityModalOpen = false;
    selectedActivity = null;
  };

  const buildMapsLink = (value?: string | null) => {
    const location = value?.trim();
    if (!location) {
      return null;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  };

  const toggleVote = async (activity: Activity) => {
    if (isVoteSubmitting) {
      return;
    }
    const planId = $page.params.planId;
    if (!planId) {
      return;
    }

    isVoteSubmitting = true;
    try {
      const response = await apiFetch<ApiResponse<ApiActivity> | Activity>(
        `/plan/${planId}/activity/${activity.id}/vote`,
        { method: 'POST' }
      );
      const updatedActivity = isApiResponse(response)
        ? mapActivityFromApi(response.data, 0)
        : isActivity(response)
          ? response
          : null;
      if (updatedActivity) {
        updateActivity(updatedActivity);
      }
      await invalidate(`/api/plan/${planId}`);
    } catch (error) {
    } finally {
      isVoteSubmitting = false;
    }
  };
</script>

<div class="space-y-5">
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-semibold">Itinerary</h3>
    {#if props.addTargetId}
      <label
        class={`btn btn-sm ${props.emphasizeAdd ? 'btn-primary' : 'btn-ghost text-primary'}`}
        for={props.addTargetId}
      >
        + Add Activity
      </label>
    {:else}
      <button class={`btn btn-sm ${props.emphasizeAdd ? 'btn-primary' : 'btn-ghost text-primary'}`}>
        + Add Activity
      </button>
    {/if}
  </div>

  <div class="max-h-[520px] space-y-5 overflow-y-auto pr-2">
    {#each groupedActivities as group}
      <div class="flex gap-4">
        <div class="flex flex-col items-center gap-2 pt-2">
          <div
            class={`h-4 w-4 rounded-full border-2 border-primary ${
              group.type === 'group'
                ? 'bg-transparent'
                : group.activity.isProposed
                  ? 'bg-transparent'
                  : 'bg-primary'
            }`}
          ></div>
          <div class="flex-1 w-px bg-base-200"></div>
        </div>
        <div class="flex-1">
          <div class="mb-2 text-sm font-semibold text-base-content">
            {group.type === 'group'
              ? group.start
                ? `${group.start.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}`
                : 'Timeline TBD'
              : group.activity.startTime
                ? `${group.activity.startTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })} · ${group.activity.startTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}`
                : 'Timeline TBD'}
          </div>

          {#if group.type === 'group'}
            {@const totals = getGroupTotals(group.activities)}
            <div class="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p class="text-lg font-semibold">Voting Open</p>
                  <p class="text-sm text-base-content/60">Vote for your preference</p>
                </div>
                <span class="badge badge-outline text-primary">Proposed</span>
              </div>
              <div class="space-y-3">
                {#each group.activities as activity}
                  {@const votes = activity.votes?.length ?? 0}
                  <div
                    class={`flex w-full flex-col gap-3 rounded-2xl border p-3 text-left shadow-sm transition md:flex-row md:items-center ${getProposalClasses(
                      votes,
                      totals.total,
                      totals.max
                    )}`}
                  >
                    <button
                      class="flex flex-1 items-center gap-3 text-left"
                      type="button"
                      on:click={() => openActivityModal(activity)}
                    >
                      <div class="h-14 w-14 overflow-hidden rounded-xl bg-base-200">
                        <img
                          class="h-full w-full object-cover"
                          src={activity.image ??
                            'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80'}
                          alt={activity.title}
                        />
                      </div>
                      <div>
                        <p class="text-base font-semibold">{activity.title}</p>
                        <p class="text-sm text-base-content/60">{activity.location}</p>
                      </div>
                    </button>
                    <div class="ml-auto flex items-center gap-2">
                      <button
                        class={`btn btn-sm ${
                          activity.hasVoted
                            ? 'btn-outline border-primary text-primary'
                            : 'btn-primary'
                        }`}
                        type="button"
                        on:click|stopPropagation={() => toggleVote(activity)}
                        disabled={isVoteSubmitting}
                      >
                        {activity.hasVoted ? "I'm out" : "I'm in"}
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {:else}
            <button
              class="w-full rounded-2xl border border-base-200 bg-base-100 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
              type="button"
              on:click={() => openActivityModal(group.activity)}
            >
              <div class="flex flex-col gap-4 p-4 md:flex-row md:items-center">
                <div class="h-20 w-full overflow-hidden rounded-xl bg-base-200 md:h-16 md:w-24">
                  <img
                    class="h-full w-full object-cover"
                    src={group.activity.image ??
                      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80'}
                    alt={group.activity.title}
                  />
                </div>
                <div class="flex-1 space-y-2">
                  <div class="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h4 class="text-base font-semibold">{group.activity.title}</h4>
                      <p class="text-sm text-base-content/60">{group.activity.location}</p>
                    </div>
                    {#if group.activity.status}
                      <div class="flex flex-col items-end">
                        <span class="badge badge-outline text-primary">{group.activity.status}</span>
                      </div>
                    {/if}
                  </div>
                  <div class="flex flex-wrap items-center gap-3 text-xs text-base-content/70">
                    {#if group.activity.cost !== undefined}
                      <span class="badge badge-outline">${group.activity.cost}</span>
                    {/if}
                    {#if group.activity.isProposed}
                      <button
                        class={`btn btn-xs ml-auto ${
                          group.activity.hasVoted
                            ? 'btn-outline border-primary text-primary'
                            : 'btn-primary'
                        }`}
                        on:click|stopPropagation={() => toggleVote(group.activity)}
                        type="button"
                      >
                        {group.activity.hasVoted ? "I'm out" : "I'm in!"}
                      </button>
                    {/if}
                  </div>
                </div>
              </div>
              {#if group.activity.options}
                <div class="border-t border-base-200 px-4 pb-4">
                  <div class="mt-4 space-y-3">
                    {#each group.activity.options as option}
                      <div class="flex items-center justify-between rounded-xl border border-base-200 p-3">
                        <div class="flex items-center gap-3">
                          {#if option.image}
                            <img class="h-10 w-10 rounded-xl object-cover" src={option.image} alt={option.name} />
                          {/if}
                          <span class="font-semibold">{option.name}</span>
                        </div>
                        <div class="flex items-center gap-3">
                          <button class="btn btn-xs btn-outline">Vote</button>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<input id="activity-detail-modal" type="checkbox" class="modal-toggle" bind:checked={activityModalOpen} />
<div class="modal" role="dialog" class:modal-open={activityModalOpen}>
  <div class="modal-box max-w-2xl p-0 overflow-hidden">
    <div class="relative">
      <img
        class="h-56 w-full object-cover"
        src={selectedActivity?.image ??
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'}
        alt={selectedActivity?.title ?? 'Activity image'}
      />
      <button
        class="btn btn-ghost btn-sm absolute right-4 top-4 rounded-full bg-base-100/80"
        on:click={closeActivityModal}
        type="button"
      >
        ✕
      </button>
    </div>
    <div class="p-6 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h3 class="text-2xl font-semibold">{selectedActivity?.title ?? 'Activity'}</h3>
        {#if selectedActivity?.cost !== undefined}
          <span class="badge badge-success">Est. ${selectedActivity.cost} / person</span>
        {/if}
      </div>
      <div class="grid gap-4 text-sm text-base-content/70 md:grid-cols-2">
        <div class="flex items-start gap-2">
          <svg class="mt-0.5 h-4 w-4 text-base-content/50" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M6 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm10 7H4v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9Z"
              clip-rule="evenodd"
            />
          </svg>
          <div>
            <p class="font-semibold text-base-content">
              {selectedActivity?.startTime
                ? selectedActivity.startTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })
                : 'Timeline TBD'}
            </p>
            <p class="text-xs text-base-content/60">
              {formatTimeRange(selectedActivity?.startTime ?? null, selectedActivity?.endTime ?? null) ??
                'Time TBD'}
            </p>
          </div>
        </div>
        <div class="flex items-start gap-2">
          <svg class="mt-0.5 h-4 w-4 text-base-content/50" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M9.69 18.933a1 1 0 0 1-1.38 0C5.425 16.31 3 13.469 3 10.5A7 7 0 1 1 17 10.5c0 2.969-2.425 5.81-5.31 8.433ZM10 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
              clip-rule="evenodd"
            />
          </svg>
          <div>
            <p class="font-semibold text-base-content">Where</p>
            <p class="text-xs text-base-content/60">{selectedActivity?.location ?? 'Location TBD'}</p>
          </div>
        </div>
      </div>
      <div>
        <p class="text-xs uppercase tracking-wide text-base-content/40">Activity Details</p>
        <p class="text-sm text-base-content/70 mt-2">
          {selectedActivity?.description ?? 'Details will appear here once added.'}
        </p>
      </div>
    </div>
    <div class="border-t border-base-200 p-5 space-y-4">
      <div class="rounded-2xl bg-base-200/40 px-4 py-3 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="text-sm text-base-content/70">
            Who’s in ({selectedActivity?.votes?.length ?? 0})
          </div>
          {#if selectedActivity?.isProposed}
            <button
              class={`btn ${selectedActivity.hasVoted ? 'btn-outline border-primary text-primary' : 'btn-primary'}`}
              on:click={() => selectedActivity && toggleVote(selectedActivity)}
              disabled={isVoteSubmitting}
              type="button"
            >
              {selectedActivity.hasVoted ? "I'm out!" : "I'm in!"}
            </button>
          {:else}
            <button class="btn btn-primary">Join Activity</button>
          {/if}
        </div>
        <div class="flex gap-4 overflow-x-auto pb-2">
          {#each (selectedActivity?.votes ?? []) as voter}
            <div class="flex flex-col items-center text-xs text-base-content/70">
              {#if voter.picture}
                <img
                  class="h-10 w-10 rounded-full object-cover"
                  src={voter.picture}
                  alt={voter.name}
                />
              {:else}
                <div class="h-10 w-10 rounded-full bg-base-100 flex items-center justify-center text-sm font-semibold">
                  {voter.name.slice(0, 1).toUpperCase()}
                </div>
              {/if}
              <span class="mt-1">{voter.name}</span>
            </div>
          {/each}
          {#if !selectedActivity?.votes?.length}
            <p class="text-xs text-base-content/50">No votes yet.</p>
          {/if}
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <button class="btn btn-outline flex-1">
          <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M15 8a3 3 0 1 0-2.977-2.65l-3.4 1.7a3 3 0 1 0 0 6l3.4 1.7A3 3 0 1 0 15 12a2.96 2.96 0 0 0-.977.172l-3.4-1.7a2.99 2.99 0 0 0 0-1.944l3.4-1.7A2.96 2.96 0 0 0 15 8Z" />
          </svg>
          Share
        </button>
        <a
          class="btn btn-outline flex-1"
          href={buildMapsLink(selectedActivity?.location)}
          target="_blank"
          rel="noreferrer"
        >
          <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M9.69 18.933a1 1 0 0 1-1.38 0C5.425 16.31 3 13.469 3 10.5A7 7 0 1 1 17 10.5c0 2.969-2.425 5.81-5.31 8.433ZM10 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
              clip-rule="evenodd"
            />
          </svg>
          Open in Maps
        </a>
      </div>
    </div>
  </div>
  <div class="modal-backdrop" role="presentation" on:click={closeActivityModal}></div>
</div>
