<script lang="ts">
  import type { Activity } from '$lib/types';
  import type { ApiActivity, ApiPlan, ApiResponse } from '$lib/api/types';
  import type { PlanDetail } from '$lib/types';
  import { formatActivityTime, formatTimeRange, mapActivityFromApi, mapPlanDetailFromApi } from '$lib/models/plan';
  import { apiFetch, getBackendBaseUrl } from '$lib/api/client';
  import { page } from '$app/stores';
  import { invalidate } from '$app/navigation';
  import LocationAutocomplete from '$lib/components/LocationAutocomplete.svelte';
  import { createEventDispatcher } from 'svelte';

  const props = $props();
  const canAddActivities = $derived.by(() => props.planStatus?.toLowerCase() === 'active');
  const dispatch = createEventDispatcher<{ activityUpdate: Activity; planUpdate: Activity[] }>();

  let activities = $state<Activity[]>(props.activities ?? []);
  let activityModalOpen = $state(false);
  let selectedActivity = $state<Activity | null>(null);
  let isVoteSubmitting = $state(false);
  let editActivity = $state(false);
  let isActivitySaving = $state(false);
  let activitySaveError = $state('');
  let isReproposing = $state(false);
  let activityTitle = $state('');
  let activityLocation = $state('');
  let activityDescription = $state('');
  let activityLink = $state('');
  let activityCost = $state('');
  let activityStartDate = $state('');
  let activityEndDate = $state('');
  let activityStartTime = $state('');
  let activityEndTime = $state('');

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
  const isPlanResponse = (value: unknown): value is ApiResponse<ApiPlan> =>
    Boolean(value && typeof value === 'object' && 'data' in value && value.data && typeof value.data === 'object');

  const isActivity = (value: unknown): value is Activity =>
    Boolean(value && typeof value === 'object' && 'id' in value && 'title' in value);
  const isPlanDetail = (value: unknown): value is PlanDetail =>
    Boolean(value && typeof value === 'object' && 'activities' in value);

  const hasVoted = (activity: Activity) => {
    const profileId = $page.data?.profile?.id;
    if (!profileId) {
      return false;
    }
    return Array.isArray(activity.votes) && activity.votes.some((vote) => vote.id === profileId);
  };

  const normalizeActivity = (activity: Activity): Activity => ({
    ...activity,
    hasVoted: hasVoted(activity)
  });

  const voteCache = new Map<string, Activity['votes']>();

  const cacheActivityVotes = (activity: Activity) => {
    if (activity.votes && activity.votes.length > 0) {
      voteCache.set(activity.id, activity.votes);
    }
  };

  const syncActivities = () => {
    activities = (props.activities ?? []).map((activity) => {
      const cachedVotes = voteCache.get(activity.id);
      const resolvedVotes =
        (activity.votes && activity.votes.length > 0) ? activity.votes : cachedVotes;
      const merged = resolvedVotes ? { ...activity, votes: resolvedVotes } : activity;
      const normalized = normalizeActivity(merged);
      cacheActivityVotes(normalized);
      return normalized;
    });
  };

  $effect(syncActivities);

  const updateActivity = (updated: Activity) => {
    const normalized = normalizeActivity(updated);
    activities = activities.map((activity) =>
      activity.id === normalized.id ? normalized : activity
    );
    if (selectedActivity?.id === normalized.id) {
      selectedActivity = normalized;
    }
    cacheActivityVotes(normalized);
    dispatch('activityUpdate', normalized);
  };

  const groupedActivities = $derived.by(() => {
    const groups: Array<
      | { type: 'single'; activity: Activity }
      | { type: 'group'; activities: Activity[]; start: Date | null }
    > = [];

    for (const activity of sortedActivities) {
      if (activity.status?.toLowerCase() === 'rejected') {
        continue;
      }
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

  export function openActivityModal(activity: Activity) {
    selectedActivity = activity;
    activityModalOpen = true;
  }

  const closeActivityModal = () => {
    activityModalOpen = false;
    selectedActivity = null;
    editActivity = false;
    activitySaveError = '';
    isReproposing = false;
  };

  const buildMapsLink = (value?: string | null) => {
    const location = value?.trim();
    if (!location) {
      return null;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  };

  const formatCostInput = () => {
    const parsed = Number(activityCost);
    if (Number.isNaN(parsed)) {
      activityCost = '';
      return;
    }
    activityCost = parsed.toFixed(2);
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
      const response = await apiFetch<ApiResponse<ApiActivity> | ApiResponse<ApiPlan> | Activity | PlanDetail>(
        `/plan/${planId}/activity/${activity.id}/vote`,
        { method: 'POST' }
      );
      if (isPlanResponse(response)) {
        const plan = mapPlanDetailFromApi(response.data);
        const nextActivities = plan.activities.map(normalizeActivity);
        activities = nextActivities;
        dispatch('planUpdate', nextActivities);
      } else if (isPlanDetail(response)) {
        const nextActivities = response.activities.map(normalizeActivity);
        activities = nextActivities;
        dispatch('planUpdate', nextActivities);
      } else {
        const updatedActivity = isApiResponse(response)
          ? mapActivityFromApi(response.data, 0)
          : isActivity(response)
            ? response
            : null;
        if (updatedActivity) {
          updateActivity(updatedActivity);
        }
      }
    } catch (error) {
    } finally {
      isVoteSubmitting = false;
    }
  };

  const formatDateInput = (value?: Date | null) => {
    if (!value) {
      return '';
    }
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeInput = (value?: Date | null) => {
    if (!value) {
      return '';
    }
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const buildDateTime = (date: string, time: string) => {
    if (!date) {
      return undefined;
    }
    const safeTime = time || '00:00';
    return new Date(`${date}T${safeTime}`).toISOString();
  };

  $effect(() => {
    if (!selectedActivity) {
      return;
    }
    activityTitle = selectedActivity.title ?? '';
    activityLocation = selectedActivity.location ?? '';
    activityDescription = selectedActivity.description ?? '';
    activityLink = selectedActivity.link ?? '';
    activityCost =
      typeof selectedActivity.cost === 'number' ? selectedActivity.cost.toFixed(2) : '';
    activityStartDate = formatDateInput(selectedActivity.startTime);
    activityEndDate = formatDateInput(selectedActivity.endTime ?? null);
    activityStartTime = formatTimeInput(selectedActivity.startTime);
    activityEndTime = formatTimeInput(selectedActivity.endTime ?? null);
    editActivity = false;
    activitySaveError = '';
  });

  const isProposer = $derived(
    Boolean(
      selectedActivity?.proposerId &&
        $page.data?.profile?.id &&
        selectedActivity.proposerId === $page.data.profile.id
    )
  );
  const isRejected = $derived(selectedActivity?.status?.toLowerCase() === 'rejected');
  const profileId = $derived($page.data?.profile?.id ?? null);

  const saveActivity = async () => {
    if (!selectedActivity || isActivitySaving) {
      return;
    }
    activitySaveError = '';
    const planId = $page.params.planId;
    if (!planId) {
      activitySaveError = 'Plan is unavailable.';
      return;
    }

    const updates: Record<string, unknown> = {};
    const trimmedTitle = activityTitle.trim();
    if (trimmedTitle && trimmedTitle !== selectedActivity.title) {
      updates.name = trimmedTitle;
    }
    const trimmedLocation = activityLocation.trim();
    if (trimmedLocation && trimmedLocation !== selectedActivity.location) {
      updates.location = trimmedLocation;
    }
    const trimmedDescription = activityDescription.trim();
    if (trimmedDescription !== (selectedActivity.description ?? '')) {
      updates.description = trimmedDescription || undefined;
    }
    const trimmedLink = activityLink.trim();
    if (trimmedLink !== (selectedActivity.link ?? '')) {
      updates.link = trimmedLink || undefined;
    }
    if (activityCost.trim() !== '') {
      const parsedCost = Number(activityCost);
      if (!Number.isNaN(parsedCost) && parsedCost !== (selectedActivity.cost ?? 0)) {
        updates.cost = parsedCost;
      }
    } else if (selectedActivity.cost !== undefined) {
      updates.cost = undefined;
    }

    const startDate = activityStartDate || formatDateInput(selectedActivity.startTime);
    const endDate = activityEndDate || formatDateInput(selectedActivity.endTime ?? null);
    const startTime = activityStartTime || formatTimeInput(selectedActivity.startTime);
    const endTime = activityEndTime || formatTimeInput(selectedActivity.endTime ?? null);

    const nextStart = buildDateTime(startDate, startTime);
    const nextEnd = endDate ? buildDateTime(endDate, endTime) : undefined;

    if (nextStart !== selectedActivity.startTime?.toISOString()) {
      updates.start_time = nextStart;
    }
    if (nextEnd !== selectedActivity.endTime?.toISOString()) {
      updates.end_time = nextEnd;
    }

    if (!Object.keys(updates).length) {
      editActivity = false;
      return;
    }

    isActivitySaving = true;
    try {
      const response = await apiFetch<ApiResponse<ApiActivity> | Activity>(
        `/plan/${planId}/activity/${selectedActivity.id}`,
        { method: 'PUT', body: JSON.stringify(updates) }
      );
      const updatedActivity = isApiResponse(response)
        ? mapActivityFromApi(response.data, 0)
        : isActivity(response)
          ? response
          : null;
      if (updatedActivity) {
        updateActivity(updatedActivity);
      }
      await invalidate(`${getBackendBaseUrl()}/plan/${planId}`);
      editActivity = false;
    } catch (error) {
      activitySaveError = error instanceof Error ? error.message : 'Unable to save activity.';
    } finally {
      isActivitySaving = false;
    }
  };

  const reproposeActivity = async () => {
    if (!selectedActivity || isReproposing) {
      return;
    }
    const planId = $page.params.planId;
    if (!planId) {
      activitySaveError = 'Plan is unavailable.';
      return;
    }

    isReproposing = true;
    activitySaveError = '';
    try {
      const response = await apiFetch<ApiResponse<ApiActivity> | Activity>(
        `/plan/${planId}/activity/${selectedActivity.id}`,
        { method: 'PUT', body: JSON.stringify({ status: 'proposed' }) }
      );
      const updatedActivity = isApiResponse(response)
        ? mapActivityFromApi(response.data, 0)
        : isActivity(response)
          ? response
          : null;
      if (updatedActivity) {
        updateActivity(updatedActivity);
      }
      await invalidate(`${getBackendBaseUrl()}/plan/${planId}`);
    } catch (error) {
      activitySaveError = error instanceof Error ? error.message : 'Unable to repropose activity.';
    } finally {
      isReproposing = false;
    }
  };

  const formatModalDateTime = (start?: Date | null, end?: Date | null) => {
    if (!start) {
      return { start: 'Timeline TBD', end: null, isRange: false };
    }
    const startDate = start.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
    const startTime = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
    if (!end) {
      return { start: `${startDate} · ${startTime}`, end: null, isRange: false };
    }
    const endDate = end.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
    const endTime = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
    if (startDate === endDate) {
      return {
        start: `${startDate} · ${formatTimeRange(start, end) ?? startTime}`,
        end: null,
        isRange: false
      };
    }
    return {
      start: `${startDate} ${startTime}`,
      end: `${endDate} ${endTime}`,
      isRange: true
    };
  };

  let modalTime = $derived(
    formatModalDateTime(selectedActivity?.startTime ?? null, selectedActivity?.endTime ?? null)
  );
</script>

<div class="card plan-glass shadow-sm">
  <div class="card-body space-y-5">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <span class="material-symbols-outlined text-xl">map</span>
        </span>
        <h3 class="text-lg font-semibold text-primary">Plan Timeline</h3>
      </div>
      {#if props.addTargetId && canAddActivities}
        <label
          class={`btn btn-sm ${props.emphasizeAdd ? 'btn-primary' : 'btn-ghost text-primary'}`}
          for={props.addTargetId}
        >
          + Add Activity
        </label>
      {:else if !props.addTargetId}
        <button class={`btn btn-sm ${props.emphasizeAdd ? 'btn-primary' : 'btn-ghost text-primary'}`}>
          + Add Activity
        </button>
      {/if}
    </div>

    <div class="max-h-[520px] space-y-5 overflow-y-auto pr-2">
      {#if groupedActivities.length === 0}
        <div class="card plan-glass border-2 border-dashed border-base-200 text-center">
          <div class="card-body items-center justify-center gap-2">
            <div class="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl">+</div>
            <h3 class="font-semibold">No activities yet</h3>
            <p class="text-sm text-base-content/60">Start building your itinerary with the first activity.</p>
            {#if props.addTargetId && canAddActivities}
              <label class="btn btn-ghost text-primary" for={props.addTargetId}>
                Add Activity
              </label>
            {:else if !props.addTargetId}
              <button class="btn btn-ghost text-primary" type="button">Add Activity</button>
            {/if}
          </div>
        </div>
      {/if}
      {#if groupedActivities.length}
        <ul class="timeline timeline-vertical timeline-compact">
          {#each groupedActivities as group, index}
            <li>
              {#if index > 0}
                <hr class="bg-primary/40" />
              {/if}
              <div class="timeline-middle">
                <div
                  class={`h-4 w-4 rounded-full border-2 border-primary shadow-[0_0_12px_rgba(23,230,142,0.55)] ${
                    group.type === 'group'
                      ? 'bg-transparent'
                      : group.activity.isProposed
                        ? 'bg-transparent'
                        : 'bg-primary'
                  }`}
                ></div>
              </div>
              <div class="timeline-start w-full pb-4">
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
                      <span class="badge badge-outline text-warning">Proposed</span>
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
                              {#if activity.isProposed}
                                <p class="text-xs text-base-content/50">
                                  Proposed by {activity.proposerId && profileId && activity.proposerId === profileId
                                    ? 'You'
                                    : activity.proposerName ?? 'Guest'}
                                </p>
                              {/if}
                            </div>
                          </button>
                          <div class="flex items-center gap-3">
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
                            <div class="flex items-center">
                              <div class="flex -space-x-3">
                                {#each (activity.votes ?? []).slice(0, 3) as voter}
                                  {#if voter.picture}
                                    <img
                                      class="h-10 w-10 rounded-full border border-base-100 object-cover"
                                      src={voter.picture}
                                      alt={voter.name}
                                    />
                                  {:else}
                                    <div class="h-10 w-10 rounded-full border border-base-100 bg-base-100 text-[0.6rem] font-semibold flex items-center justify-center">
                                      {voter.name.slice(0, 1).toUpperCase()}
                                    </div>
                                  {/if}
                                {/each}
                                {#if (activity.votes?.length ?? 0) > 3}
                                  <div class="h-10 w-10 rounded-full border border-base-100 bg-base-100 text-[0.6rem] font-semibold flex items-center justify-center">
                                    +{(activity.votes?.length ?? 0) - 3}
                                  </div>
                                {/if}
                              </div>
                            </div>
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
                        <div class="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h4 class="text-base font-semibold">{group.activity.title}</h4>
                            <p class="text-sm text-base-content/60">{group.activity.location}</p>
                          </div>
                          <div class="flex items-center gap-3">
                            {#if group.activity.status}
                              <div class="flex flex-col items-end">
                                <span
                                  class={`badge badge-outline ${
                                    group.activity.status.toLowerCase() === 'proposed'
                                      ? 'text-warning'
                                      : 'text-primary'
                                  }`}
                                >
                                  {group.activity.status.toLowerCase() === 'confirmed'
                                    ? 'Committed'
                                    : group.activity.status}
                                </span>
                              </div>
                            {/if}
                          </div>
                        </div>
                        <div class="flex flex-wrap items-center gap-3 text-xs text-base-content/70">
                          {#if group.activity.cost !== undefined}
                            <span class="badge badge-outline">
                              ${group.activity.cost} / person
                            </span>
                          {/if}
                          <div class="ml-auto flex items-center">
                            <div class="flex -space-x-3">
                              {#each (group.activity.votes ?? []).slice(0, 3) as voter}
                                {#if voter.picture}
                                  <img
                                    class="h-10 w-10 rounded-full border border-base-100 object-cover"
                                    src={voter.picture}
                                    alt={voter.name}
                                  />
                                {:else}
                                  <div class="h-10 w-10 rounded-full border border-base-100 bg-base-100 text-[0.55rem] font-semibold flex items-center justify-center">
                                    {voter.name.slice(0, 1).toUpperCase()}
                                  </div>
                                {/if}
                              {/each}
                              {#if (group.activity.votes?.length ?? 0) > 3}
                                <div class="h-10 w-10 rounded-full border border-base-100 bg-base-100 text-[0.55rem] font-semibold flex items-center justify-center">
                                  +{(group.activity.votes?.length ?? 0) - 3}
                                </div>
                              {/if}
                            </div>
                          </div>
                            {#if group.activity.isProposed && group.activity.status?.toLowerCase() !== 'confirmed'}
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
              {#if index < groupedActivities.length - 1}
                <hr class="bg-primary/40" />
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
</div>
</div>

<input id="activity-detail-modal" type="checkbox" class="modal-toggle" bind:checked={activityModalOpen} />
<div class="modal" role="dialog" class:modal-open={activityModalOpen}>
  <div class="modal-box max-w-2xl p-0 overflow-hidden plan-glass modal-opaque border border-base-200 bg-base-100">
    <div class="group relative">
      <img
        class="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-105"
        src={selectedActivity?.image ??
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'}
        alt={selectedActivity?.title ?? 'Activity image'}
      />
      <div class="cover-overlay absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <button class="btn btn-sm cover-change-btn shadow-lg" type="button">
          <span class="material-symbols-outlined text-lg">add_a_photo</span>
          Change photo
        </button>
      </div>
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
        <div class="flex-1">
          {#if editActivity}
            <label class="form-control">
              <span class="label-text font-semibold">Name</span>
              <input class="input input-bordered w-full" bind:value={activityTitle} />
            </label>
          {:else}
            <h3 class="text-2xl font-black">{selectedActivity?.title ?? 'Activity'}</h3>
          {/if}
        </div>
        {#if editActivity}
          <label class="form-control">
            <span class="label-text font-semibold">Cost</span>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-base-content/60">
                $
              </span>
              <input
                class="input input-bordered w-full pl-7"
                inputmode="decimal"
                placeholder="25.00"
                bind:value={activityCost}
                on:blur={formatCostInput}
              />
            </div>
          </label>
        {:else if selectedActivity?.cost !== undefined}
          <span class="badge badge-success">Est. ${selectedActivity.cost} / person</span>
        {/if}
        {#if isProposer && (selectedActivity?.isProposed || isRejected)}
          <button
            class={`btn ${editActivity ? 'btn-primary' : 'btn-outline'}`}
            type="button"
            on:click={() => {
              if (editActivity) {
                saveActivity();
              } else {
                editActivity = true;
              }
            }}
            disabled={isActivitySaving}
          >
            {editActivity ? (isActivitySaving ? 'Saving...' : 'Save') : 'Edit'}
          </button>
        {/if}
      </div>
      {#if activitySaveError}
        <div class="alert alert-error text-sm">{activitySaveError}</div>
      {/if}
      <div class="grid gap-4 text-sm text-base-content/70 md:grid-cols-2">
        <div class="flex items-start gap-2">
          <span class="material-symbols-outlined mt-0.5 text-lg text-primary">calendar_month</span>
          <div>
            {#if editActivity}
              <div class="space-y-3">
                <div class="grid gap-3 md:grid-cols-2">
                  <label class="form-control">
                    <span class="label-text font-semibold">Start date</span>
                    <input class="input input-bordered" type="date" bind:value={activityStartDate} />
                  </label>
                  <label class="form-control">
                    <span class="label-text font-semibold">Start time</span>
                    <input class="input input-bordered" type="time" bind:value={activityStartTime} />
                  </label>
                </div>
                <div class="grid gap-3 md:grid-cols-2">
                  <label class="form-control">
                    <span class="label-text font-semibold">End date</span>
                    <input class="input input-bordered" type="date" bind:value={activityEndDate} />
                  </label>
                  <label class="form-control">
                    <span class="label-text font-semibold">End time</span>
                    <input class="input input-bordered" type="time" bind:value={activityEndTime} />
                  </label>
                </div>
              </div>
            {:else if modalTime.isRange && modalTime.end}
              <div class="space-y-3 text-base-content">
                <p class="font-black text-primary uppercase tracking-widest text-xs">When</p>
                <div>
                  <p class="text-xs font-semibold text-base-content/60">Starts</p>
                  <p class="font-black">{modalTime.start}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-base-content/60">Ends</p>
                  <p class="font-black">{modalTime.end}</p>
                </div>
              </div>
            {:else}
              <div>
                <p class="font-black text-primary uppercase tracking-widest text-xs">When</p>
                <p class="font-black text-base-content">{modalTime.start}</p>
              </div>
            {/if}
          </div>
        </div>
        <div class="grid grid-cols-[1rem,1fr] items-start gap-x-2 gap-y-4">
          <span class="material-symbols-outlined mt-0.5 text-lg text-primary">location_on</span>
          <div>
            <p class="font-black text-primary uppercase tracking-widest text-xs">Where</p>
            {#if editActivity}
              <LocationAutocomplete
                label="Location"
                bind:location={activityLocation}
                singleInput={true}
                idPrefix="activity-edit-location"
              />
            {:else}
              <p class="text-xs text-base-content/60">{selectedActivity?.location ?? 'Location TBD'}</p>
            {/if}
          </div>
          <span class="material-symbols-outlined mt-0.5 text-lg text-primary">link</span>
          <div>
            <p class="font-black text-primary uppercase tracking-widest text-xs">Link</p>
            {#if editActivity}
                <input
                  class="input input-bordered mt-2 w-full font-semibold"
                  placeholder="https://maps.google.com"
                  bind:value={activityLink}
                />
            {:else if selectedActivity?.link}
              <a
                class="mt-2 inline-flex items-center gap-2 text-sm text-primary font-semibold"
                href={selectedActivity.link}
                target="_blank"
                rel="noreferrer"
              >
                {selectedActivity.link}
              </a>
            {:else}
              <p class="text-xs text-base-content/60 mt-2">No link provided.</p>
            {/if}
          </div>
        </div>
      </div>
      <div class="md:col-span-2">
        <p class="font-black text-primary uppercase tracking-widest text-xs">Activity details</p>
        {#if editActivity}
          <textarea class="textarea textarea-bordered h-24 mt-2 w-full" bind:value={activityDescription}></textarea>
        {:else}
          <p class="text-sm description-text mt-2">
            {selectedActivity?.description ?? 'Details will appear here once added.'}
          </p>
        {/if}
      </div>
    </div>
    <div class="border-t border-base-200 p-5 space-y-4">
      {#if !isRejected}
        <div class="rounded-2xl plan-glass px-4 py-3 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="text-sm text-base-content/70 font-semibold">
              Who’s in ({selectedActivity?.votes?.length ?? 0})
            </div>
            {#if selectedActivity?.isProposed && selectedActivity?.status?.toLowerCase() !== 'confirmed'}
              <button
                class={`btn ${selectedActivity.hasVoted ? 'btn-outline border-primary text-primary' : 'btn-primary'}`}
                on:click={() => selectedActivity && toggleVote(selectedActivity)}
                disabled={isVoteSubmitting}
                type="button"
              >
                {selectedActivity.hasVoted ? "I'm out!" : "I'm in!"}
              </button>
            {:else if selectedActivity?.status?.toLowerCase() !== 'confirmed'}
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
      {/if}
      {#if isRejected && isProposer}
        <button
          class="btn btn-primary w-full"
          type="button"
          on:click={reproposeActivity}
          disabled={isReproposing}
        >
          {isReproposing ? 'Proposing...' : 'Propose'}
        </button>
      {:else if !isRejected}
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
      {/if}
    </div>
  </div>
  <div class="modal-backdrop" role="presentation" on:click={closeActivityModal}></div>
</div>
