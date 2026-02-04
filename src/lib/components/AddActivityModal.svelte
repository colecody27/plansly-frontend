<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { apiFetch, getBackendBaseUrl } from '$lib/api/client';
  import { invalidate } from '$app/navigation';
  import LocationAutocomplete from '$lib/components/LocationAutocomplete.svelte';
  import type { Activity } from '$lib/types';
  import type { ApiActivity, ApiResponse } from '$lib/api/types';
  import { mapActivityFromApi } from '$lib/models/plan';

  export let open = false;
  export let planId: string | null = null;
  export let planStartDay: Date | null = null;
  export let planEndDay: Date | null = null;
  export let modalId = 'add-activity-modal';

  const dispatch = createEventDispatcher<{ activityCreated: Activity }>();

  let activityName = '';
  let activityLocation = '';
  let activityLink = '';
  let activityDetails = '';
  let activityCost = '';
  let activityCostIsPerPerson = true;
  let activityStartDay = '';
  let activityEndDay = '';
  let isAllDay = false;
  let activityStartTime = '';
  let activityEndTime = '';
  let activityError = '';
  let activityDateError = '';
  let isActivitySaving = false;

  onMount(async () => {
    await import('cally');
  });

  const formatCost = () => {
    const parsed = Number(activityCost);
    if (Number.isNaN(parsed)) {
      activityCost = '';
      return;
    }
    activityCost = parsed.toFixed(2);
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const parseLocalDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
      return null;
    }
    return new Date(year, month - 1, day);
  };
  const normalizeCalendarDate = (value: Date) =>
    new Date(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
  const todayMinDate = formatDate(new Date());
  $: minSelectableDate = planStartDay ? formatDate(planStartDay) : todayMinDate;
  $: maxSelectableDate = planEndDay ? formatDate(planEndDay) : undefined;

  const handleActivityRangeStart = (event: CustomEvent<Date>) => {
    const today = startOfDay(new Date());
    const selected = startOfDay(normalizeCalendarDate(event.detail));
    if (selected < today) {
      activityDateError = 'Start date cannot be in the past.';
      return;
    }
    if (planStartDay && selected < startOfDay(planStartDay)) {
      activityDateError = 'Start date must be within the plan dates.';
      return;
    }
    if (planEndDay && selected > startOfDay(planEndDay)) {
      activityDateError = 'Start date must be within the plan dates.';
      return;
    }
    activityDateError = '';
    activityStartDay = formatDate(selected);
    activityEndDay = '';
  };

  const handleActivityRangeEnd = (event: CustomEvent<Date>) => {
    const selectedEnd = startOfDay(normalizeCalendarDate(event.detail));
    if (activityStartDay) {
      const parsedStart = parseLocalDate(activityStartDay);
      const selectedStart = parsedStart ? startOfDay(parsedStart) : null;
      if (selectedStart && selectedEnd < selectedStart) {
        activityDateError = 'End date cannot be before the start date.';
        return;
      }
    }
    if (planStartDay && selectedEnd < startOfDay(planStartDay)) {
      activityDateError = 'End date must be within the plan dates.';
      return;
    }
    if (planEndDay && selectedEnd > startOfDay(planEndDay)) {
      activityDateError = 'End date must be within the plan dates.';
      return;
    }
    activityDateError = '';
    activityEndDay = formatDate(selectedEnd);
  };

  const buildDateTime = (date: string, time: string) => {
    if (!date) {
      return undefined;
    }
    const safeTime = time || '09:00';
    return new Date(`${date}T${safeTime}`).toISOString();
  };

  const resetActivityForm = () => {
    activityName = '';
    activityLocation = '';
    activityLink = '';
    activityDetails = '';
    activityCost = '';
    activityCostIsPerPerson = true;
    activityStartDay = '';
    activityEndDay = '';
    isAllDay = false;
    activityStartTime = '';
    activityEndTime = '';
    activityError = '';
  };

  const handleSaveActivity = async () => {
    if (isActivitySaving) {
      return;
    }
    activityError = '';
    if (activityDateError) {
      return;
    }

    const trimmedName = activityName.trim();
    if (!trimmedName) {
      activityError = 'Activity name is required.';
      return;
    }

    if (!planId) {
      activityError = 'Plan is unavailable.';
      return;
    }
    if (activityStartDay) {
      const today = startOfDay(new Date());
      const parsed = parseLocalDate(activityStartDay);
      const selected = parsed ? startOfDay(parsed) : null;
      if (selected && selected < today) {
        activityDateError = 'Start date cannot be in the past.';
        return;
      }
    }
    if (activityStartDay && activityEndDay) {
      const parsedStart = parseLocalDate(activityStartDay);
      const parsedEnd = parseLocalDate(activityEndDay);
      const selectedStart = parsedStart ? startOfDay(parsedStart) : null;
      const selectedEnd = parsedEnd ? startOfDay(parsedEnd) : null;
      if (selectedStart && selectedEnd && selectedStart > selectedEnd) {
        activityDateError = 'End date cannot be before the start date.';
        return;
      }
    }

    isActivitySaving = true;
    try {
      const startTime = buildDateTime(
        activityStartDay,
        isAllDay ? '00:00' : activityStartTime
      );
      const endBase = activityEndDay || activityStartDay;
      const endTime = buildDateTime(
        endBase,
        isAllDay ? '23:59' : activityEndTime || '17:00'
      );

      const response = await apiFetch<ApiResponse<ApiActivity> | Activity | null>(
        `/plan/${planId}/activity`,
        {
        method: 'POST',
        body: JSON.stringify({
          name: trimmedName,
          location: activityLocation.trim() || undefined,
          description: activityDetails.trim() || undefined,
          link: activityLink.trim() || undefined,
          cost: activityCost ? Number(activityCost) : undefined,
          cost_is_per_person: activityCostIsPerPerson,
          start_time: startTime,
          end_time: endTime
        })
        }
      );

      const created =
        response && typeof response === 'object' && 'data' in response
          ? mapActivityFromApi((response as ApiResponse<ApiActivity>).data, 0)
          : response && typeof response === 'object' && 'title' in response
            ? (response as Activity)
            : null;
      if (created) {
        dispatch('activityCreated', created);
      }
      open = false;
      const modalInput = document.getElementById(modalId) as HTMLInputElement | null;
      if (modalInput) {
        modalInput.checked = false;
      }
      await invalidate(`${getBackendBaseUrl()}/plan/${planId}`);
      resetActivityForm();
    } catch (error) {
      activityError = error instanceof Error ? error.message : 'Unable to save activity.';
    } finally {
      isActivitySaving = false;
    }
  };
</script>

<input id={modalId} type="checkbox" class="modal-toggle" bind:checked={open} />
<div class="modal" role="dialog">
  <div class="modal-box">
    <h3 class="text-lg font-semibold mb-4">Add Activity</h3>
    <div class="space-y-3">
      <label class="form-control">
        <span class="label-text">Activity name</span>
        <input class="input input-bordered" placeholder="Arrival & Check-in" bind:value={activityName} />
      </label>
      <label class="form-control">
        <span class="label-text">Timeframe</span>
        <div class="rounded-2xl border border-base-200 p-3 flex justify-center">
          <calendar-range
            months={1}
            min={minSelectableDate}
            max={maxSelectableDate}
            page-by="single"
            on:rangestart={handleActivityRangeStart}
            on:rangeend={handleActivityRangeEnd}
          >
            <calendar-month></calendar-month>
          </calendar-range>
        </div>
        {#if activityDateError}
          <p class="text-xs text-error">{activityDateError}</p>
        {/if}
      </label>
      <div class="grid gap-3 md:grid-cols-2">
        <label class="form-control">
          <span class="label-text">Start day</span>
          <input
            class="input input-bordered"
            type="text"
            placeholder="Select start day"
            bind:value={activityStartDay}
            readonly
          />
        </label>
        <label class="form-control">
          <span class="label-text">End day</span>
          <input
            class="input input-bordered"
            type="text"
            placeholder="Select end day"
            bind:value={activityEndDay}
            readonly
          />
        </label>
      </div>
      <div class="flex items-center justify-between rounded-2xl border border-base-200 px-4 py-3 text-sm">
        <div>
          <p class="font-semibold">All-day</p>
          <p class="text-xs text-base-content/60">Hide start and end time.</p>
        </div>
        <input type="checkbox" class="toggle toggle-primary" bind:checked={isAllDay} />
      </div>
      {#if !isAllDay}
        <div class="grid gap-3 md:grid-cols-2">
          <label class="form-control">
            <span class="label-text">Start time</span>
            <input class="input input-bordered" type="time" bind:value={activityStartTime} />
          </label>
          <label class="form-control">
            <span class="label-text">End time</span>
            <input class="input input-bordered" type="time" bind:value={activityEndTime} />
          </label>
        </div>
      {/if}
      <LocationAutocomplete
        label="Location"
        bind:location={activityLocation}
        singleInput={true}
        idPrefix="activity-location"
      />
      <label class="form-control">
        <span class="label-text">Link</span>
        <input class="input input-bordered" placeholder="https://maps.google.com" bind:value={activityLink} />
      </label>
      <label class="form-control">
        <span class="label-text">Cost</span>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-base-content/60">
            $
          </span>
          <input
            class="input input-bordered w-full pl-7"
            placeholder="0.00"
            inputmode="decimal"
            pattern="^\\d*(\\.\\d{0,2})?$"
            min="0"
            step="0.01"
            bind:value={activityCost}
            on:blur={formatCost}
          />
        </div>
      </label>
      <div class="space-y-2">
        <span class="label-text">Cost type</span>
        <div class="flex flex-wrap gap-2">
          <label class="label cursor-pointer justify-start gap-2 rounded-full border border-base-200 px-3 py-1">
            <input
              type="radio"
              class="radio radio-sm"
              name={`${modalId}-cost-type`}
              checked={activityCostIsPerPerson}
              on:change={() => (activityCostIsPerPerson = true)}
            />
            <span class="label-text text-sm">Per person</span>
          </label>
          <label class="label cursor-pointer justify-start gap-2 rounded-full border border-base-200 px-3 py-1">
            <input
              type="radio"
              class="radio radio-sm"
              name={`${modalId}-cost-type`}
              checked={!activityCostIsPerPerson}
              on:change={() => (activityCostIsPerPerson = false)}
            />
            <span class="label-text text-sm">Total cost</span>
          </label>
        </div>
      </div>
      <label class="form-control">
        <span class="label-text">Details</span>
        <textarea
          class="textarea textarea-bordered h-24"
          placeholder="Add activity details."
          bind:value={activityDetails}
        ></textarea>
      </label>
    </div>
    {#if activityError}
      <p class="text-xs text-error mt-3">{activityError}</p>
    {/if}
    <div class="modal-action">
      <label for={modalId} class="btn btn-outline">Cancel</label>
      <button class="btn btn-primary" on:click={handleSaveActivity} disabled={isActivitySaving}>
        {isActivitySaving ? 'Saving...' : 'Save Activity'}
      </button>
    </div>
  </div>
  <label class="modal-backdrop" for={modalId}>Close</label>
</div>
