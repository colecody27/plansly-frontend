<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { createPlan, requestPlanImageUpload, finalizePlanImageUpload, getPlanStockImages } from '$lib/api/plans';
  import LocationAutocomplete from '$lib/components/LocationAutocomplete.svelte';

  const planTypes = [
    { id: 'trip', label: 'Trip', description: 'Getaways & vacations', disabled: false },
    { id: 'event', label: 'Event', description: 'Parties & meetups', disabled: true },
    { id: 'group', label: 'Group Buy', description: 'Shared purchases', disabled: true }
  ];

  let selectedType = 'trip';
  let allowBuyIn = true;
  let planName = '';
  let planDescription = '';
  let planDeadline = '';
  let deadlineOpen = false;
  let deadlineContainer: HTMLDivElement | null = null;
  let startDay = '';
  let endDay = '';
  let planLocation = '';
  let planCountry = '';
  let planState = '';
  let planCity = '';
  let errorMessage = '';
  let dateError = '';
  let isSubmitting = false;
  export let showBuyIn = false;
  let coverFilter = 'adventure';
  let uploadedCoverPreviewUrl: string | null = null;
  let isUploadingCover = false;
  let uploadError = '';
  let coverUploadToken = 0;
  let selectedCoverImageId: string | null = null;
  let selectedCoverImageKey: string | null = null;
  let coverGallery = [
    { id: 'c1', category: 'all', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80' },
    { id: 'c2', category: 'nature', url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80' },
    { id: 'c3', category: 'party', url: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=1200&q=80' },
    { id: 'c4', category: 'city', url: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80' },
    { id: 'c5', category: 'minimal', url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80' },
    { id: 'c6', category: 'nature', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80' },
    { id: 'c7', category: 'party', url: 'https://images.unsplash.com/photo-1461783436728-0a921771469e?auto=format&fit=crop&w=1200&q=80' },
    { id: 'c8', category: 'city', url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80' },
    { id: 'c9', category: 'minimal', url: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80' }
  ];
  let selectedCover = coverGallery[0]?.url ?? '';
  let selectedCoverValue = selectedCover;
  $: selectedCoverDisplay = uploadedCoverPreviewUrl ?? selectedCover;
  $: coverCategories = Array.from(new Set(coverGallery.map((cover) => cover.category)));
  $: coverFilter = coverFilter || coverCategories[0] || '';
  $: filteredCovers = coverFilter
    ? coverGallery.filter((cover) => cover.category === coverFilter)
    : coverGallery;

  const extractS3Key = (url: string) => {
    const marker = 'stock/';
    const index = url.indexOf(marker);
    if (index === -1) {
      return null;
    }
    return url.slice(index + marker.length);
  };

  const selectCover = (url: string) => {
    coverUploadToken += 1;
    isUploadingCover = false;
    uploadError = '';
    selectedCoverImageId = null;
    selectedCoverImageKey = extractS3Key(url);
    if (uploadedCoverPreviewUrl) {
      URL.revokeObjectURL(uploadedCoverPreviewUrl);
      uploadedCoverPreviewUrl = null;
    }
    selectedCover = url;
    selectedCoverValue = url;
  };

  const handleCoverUpload = async (event: Event) => {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }
    uploadError = '';
    isUploadingCover = true;
    const currentToken = ++coverUploadToken;

    if (uploadedCoverPreviewUrl) {
      URL.revokeObjectURL(uploadedCoverPreviewUrl);
    }
    uploadedCoverPreviewUrl = URL.createObjectURL(file);
    selectedCover = uploadedCoverPreviewUrl;

    try {
      const response = await requestPlanImageUpload({
        filename: file.name,
        filetype: file.type || 'application/octet-stream',
        filesize: file.size
      });

      const data =
        response && typeof response === 'object' && 'data' in response
          ? response.data
          : response;
      if (!data) {
        throw new Error('Upload request failed.');
      }
      const uploadUrl = typeof data === 'string'
        ? data
        : data.upload_url ??
          data.uploadUrl ??
          data.url ??
          data.s3_url ??
          data.s3Url;
      const imageId = typeof data === 'string'
        ? null
        : data.image_id ?? data.imageId ?? null;

      if (!uploadUrl) {
        throw new Error('Unable to start image upload.');
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error('Image upload failed.');
      }

      if (imageId) {
        try {
          await finalizePlanImageUpload(imageId);
        } catch (error) {
          console.warn('Unable to finalize image upload', error);
        }
      }

      const resolvedUrl = typeof data === 'string'
        ? uploadUrl.split('?')[0]
        : data.download_url ??
          data.downloadUrl ??
          data.selected ??
          data.file_url ??
          data.fileUrl ??
          data.public_url ??
          data.publicUrl ??
          data.url ??
          data.s3_url ??
          data.s3Url ??
          uploadUrl.split('?')[0];

      if (currentToken !== coverUploadToken) {
        return;
      }

      selectedCoverImageId = imageId;
      selectedCoverImageKey = null;
      selectedCover = resolvedUrl;
      selectedCoverValue = resolvedUrl;
    } catch (error) {
      if (currentToken !== coverUploadToken) {
        return;
      }
      uploadError = error instanceof Error ? error.message : 'Unable to upload image.';
    } finally {
      if (currentToken === coverUploadToken) {
        isUploadingCover = false;
      }
    }
  };

  onMount(async () => {
    await import('cally');
    const fallbackCover = coverGallery[0]?.url ?? '';
    try {
      const response = await getPlanStockImages();
      const data =
        response && typeof response === 'object' && 'data' in response
          ? response.data
          : response;
      if (data && typeof data === 'object') {
        const nextGallery = Object.entries(data).flatMap(([category, urls]) =>
          (Array.isArray(urls) ? urls : []).map((url, index) => ({
            id: `${category}-${index}`,
            category,
            url
          }))
        );
        if (nextGallery.length > 0) {
          coverGallery = nextGallery;
          const adventureCover = nextGallery.find((cover) => cover.category === 'adventure');
          if (adventureCover) {
            coverFilter = 'adventure';
            selectedCover = adventureCover.url;
            selectedCoverValue = adventureCover.url;
            selectedCoverImageKey = extractS3Key(adventureCover.url);
          } else if (selectedCoverValue === fallbackCover) {
            selectedCover = nextGallery[0].url;
            selectedCoverValue = nextGallery[0].url;
            selectedCoverImageKey = extractS3Key(nextGallery[0].url);
          }
        }
      }
    } catch (error) {
      // Keep fallback stock images if the request fails.
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (!deadlineOpen || !deadlineContainer) {
        return;
      }
      const target = event.target as Node | null;
      if (target && deadlineContainer.contains(target)) {
        return;
      }
      deadlineOpen = false;
    };
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      if (uploadedCoverPreviewUrl) {
        URL.revokeObjectURL(uploadedCoverPreviewUrl);
      }
    };
  });

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
  const minSelectableDate = formatDate(new Date());
  $: deadlineMaxDate = startDay || undefined;

  const handleRangeStart = (event: CustomEvent<Date>) => {
    const today = startOfDay(new Date());
    const selected = startOfDay(normalizeCalendarDate(event.detail));
    if (selected < today) {
      dateError = 'Start date cannot be in the past.';
      return;
    }
    dateError = '';
    startDay = formatDate(selected);
    endDay = '';
  };

  const handleRangeEnd = (event: CustomEvent<Date>) => {
    const selectedEnd = startOfDay(normalizeCalendarDate(event.detail));
    if (startDay) {
      const parsedStart = parseLocalDate(startDay);
      const selectedStart = parsedStart ? startOfDay(parsedStart) : null;
      if (selectedStart && selectedEnd < selectedStart) {
        dateError = 'End date cannot be before the start date.';
        return;
      }
    }
    dateError = '';
    endDay = formatDate(selectedEnd);
  };

  const handleDeadlineSelect = (event: CustomEvent<Date>) => {
    const selected = normalizeCalendarDate(event.detail);
    planDeadline = formatDate(selected);
    deadlineOpen = false;
  };



  const handleSubmit = async () => {
    errorMessage = '';
    const trimmedName = planName.trim();
    if (!trimmedName) {
      errorMessage = 'Plan name is required.';
      return;
    }
    if (dateError) {
      return;
    }
    if (isUploadingCover) {
      errorMessage = 'Please wait for the cover image upload to finish.';
      return;
    }
    if (planDeadline && startDay) {
      const parsedDeadline = parseLocalDate(planDeadline);
      const parsedStart = parseLocalDate(startDay);
      const deadlineDate = parsedDeadline ? startOfDay(parsedDeadline) : null;
      const startDate = parsedStart ? startOfDay(parsedStart) : null;
      if (deadlineDate && startDate && deadlineDate > startDate) {
        dateError = 'Commitment deadline must be on or before the start day.';
        return;
      }
    }
    if (startDay) {
      const today = startOfDay(new Date());
      const parsed = parseLocalDate(startDay);
      const selected = parsed ? startOfDay(parsed) : null;
      if (selected && selected < today) {
        dateError = 'Start date cannot be in the past.';
        return;
      }
    }
    if (startDay && endDay) {
      const parsedStart = parseLocalDate(startDay);
      const parsedEnd = parseLocalDate(endDay);
      const selectedStart = parsedStart ? startOfDay(parsedStart) : null;
      const selectedEnd = parsedEnd ? startOfDay(parsedEnd) : null;
      if (selectedStart && selectedEnd && selectedStart > selectedEnd) {
        dateError = 'End date cannot be before the start date.';
        return;
      }
    }

    isSubmitting = true;
    try {
      const payloadType = selectedType === 'group' ? 'group_purchase' : selectedType;
      const response = await createPlan({
        name: trimmedName,
        description: planDescription.trim() || undefined,
        type: payloadType,
        deadline: planDeadline ? new Date(planDeadline).toISOString() : undefined,
        start_day: startDay ? new Date(startDay).toISOString() : undefined,
        end_day: endDay ? new Date(endDay).toISOString() : undefined,
        country: planCountry || undefined,
        state: planState || undefined,
        city: planCity || undefined,
        image_id: selectedCoverImageId || undefined,
        image_key: selectedCoverImageId ? undefined : selectedCoverImageKey || undefined
      });
      await goto(`/plans/${response.data.id}/organizer`);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unable to create plan.';
    } finally {
      isSubmitting = false;
    }
  };
</script>

<div class="card bg-base-100 border border-base-200 shadow-sm max-w-6xl mx-auto">
  <form class="card-body gap-6" on:submit|preventDefault={handleSubmit}>
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">1. Plan Type</h2>
    </div>
    <div class="grid gap-4 md:grid-cols-3">
      {#each planTypes as type}
        <button
          class={`rounded-2xl border p-4 text-left transition ${
            type.disabled
              ? 'border-base-200 bg-base-100/70 text-base-content/40 cursor-not-allowed'
              : selectedType === type.id
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-base-200 hover:border-primary/60'
          }`}
          disabled={type.disabled}
          type="button"
          on:click={() => {
            if (!type.disabled) {
              selectedType = type.id;
            }
          }}
        >
          <div class="h-10 w-10 rounded-2xl bg-base-200 mb-3"></div>
          <h3 class="font-semibold">{type.label}</h3>
          <p class="text-sm text-base-content/60">{type.description}</p>
        </button>
      {/each}
    </div>

    <div class="space-y-4">
      <h2 class="text-lg font-semibold">2. The Details</h2>
      <label class="form-control">
        <span class="label-text">What are we calling this?</span>
        <input
          class="input input-bordered"
          placeholder="Tahoe Ski Trip 2024"
          bind:value={planName}
        />
      </label>
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="label-text">Cover Image</span>
        </div>
        <div class="grid gap-4 lg:grid-cols-[1.1fr,1.4fr]">
          <div class="space-y-3">
            <div class="rounded-2xl border border-base-200 overflow-hidden plan-glass">
              <img
                class="h-44 w-full object-cover"
                src={selectedCoverDisplay}
                alt="Selected cover"
              />
            </div>
            <label class="rounded-2xl border-2 border-dashed border-primary/40 bg-base-100/60 p-4 flex flex-col items-center justify-center gap-2 text-center cursor-pointer plan-glass">
              <span class="material-symbols-outlined text-2xl text-primary">cloud_upload</span>
              <div class="text-sm font-semibold">
                {#if isUploadingCover}
                  Uploading...
                {:else}
                  Upload custom image
                {/if}
              </div>
              <div class="text-xs text-base-content/60">JPG, PNG, WebP up to 10MB</div>
              <input class="hidden" type="file" accept="image/*" on:change={handleCoverUpload} disabled={isUploadingCover} />
            </label>
            {#if uploadError}
              <p class="text-xs text-error">{uploadError}</p>
            {/if}
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-widest text-base-content/60">Browse gallery</span>
            </div>
            <div class="flex flex-wrap gap-2">
              {#each coverCategories as filter}
                <button
                  class={`btn btn-xs ${coverFilter === filter ? 'btn-primary' : 'btn-outline'}`}
                  type="button"
                  on:click={() => (coverFilter = filter)}
                >
                  {filter === 'all' ? 'All' : filter[0].toUpperCase() + filter.slice(1)}
                </button>
              {/each}
            </div>
            <div class="grid grid-cols-3 gap-3">
              {#each filteredCovers as cover}
                <button
                  class={`relative overflow-hidden rounded-2xl border ${
                    selectedCover === cover.url ? 'border-primary ring-2 ring-primary/40' : 'border-base-200'
                  }`}
                  type="button"
                  on:click={() => selectCover(cover.url)}
                >
                  <img
                    class="h-20 w-full object-cover"
                    src={cover.url}
                    alt="Gallery cover"
                    loading="lazy"
                    decoding="async"
                  />
                  {#if selectedCover === cover.url}
                    <span class="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-content">
                      <span class="material-symbols-outlined text-xs">check</span>
                    </span>
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        </div>
      </div>
      <label class="form-control">
        <span class="label-text">What's the plan?</span>
        <textarea
          class="textarea textarea-bordered h-28"
          placeholder="Add details about the itinerary, what to bring, etc..."
          bind:value={planDescription}
        ></textarea>
      </label>
      <LocationAutocomplete
        label="Location"
        bind:location={planLocation}
        bind:country={planCountry}
        bind:state={planState}
        bind:city={planCity}
        singleInput={true}
        idPrefix="plan-location"
      />
      <label class="form-control">
        <span class="label-text">Dates</span>
        <span class="text-xs text-base-content/60">Pick a start and end date.</span>
        <div class="mt-3 rounded-2xl border border-base-200 p-3 flex justify-center">
          <calendar-range
            months={1}
            min={minSelectableDate}
            page-by="single"
            on:rangestart={handleRangeStart}
            on:rangeend={handleRangeEnd}
          >
            <calendar-month></calendar-month>
          </calendar-range>
        </div>
        {#if dateError}
          <p class="mt-2 text-xs text-error">{dateError}</p>
        {/if}
      </label>
      <div class="grid gap-3 md:grid-cols-2">
        <label class="form-control">
          <span class="label-text">Start day</span>
          <input
            class="input input-bordered"
            type="text"
            placeholder="Select start day"
            bind:value={startDay}
            readonly
          />
        </label>
        <label class="form-control">
          <span class="label-text">End day</span>
          <input
            class="input input-bordered"
            type="text"
            placeholder="Select end day"
            bind:value={endDay}
            readonly
          />
        </label>
      </div>
      <div class="form-control" bind:this={deadlineContainer}>
        <span class="label-text">Commitment deadline</span>
        <span class="text-xs text-base-content/60">When do people need to commit by?</span>
        <div class="relative mt-2">
          <input
            class="input input-bordered w-full"
            type="text"
            placeholder="Select deadline"
            value={planDeadline}
            readonly
            on:click={() => (deadlineOpen = !deadlineOpen)}
          />
          {#if deadlineOpen}
            <div
              class="absolute z-20 mt-2 w-fit max-w-full rounded-2xl border border-base-200 bg-base-100 p-3 shadow-lg"
              on:click|stopPropagation
            >
              <calendar-range
                months={1}
                min={minSelectableDate}
                max={deadlineMaxDate}
                page-by="single"
                on:rangestart={handleDeadlineSelect}
                on:rangeend={handleDeadlineSelect}
              >
                <calendar-month></calendar-month>
              </calendar-range>
              <div class="mt-3 flex items-center justify-between">
                <button
                  class="btn btn-ghost btn-sm"
                  type="button"
                  on:click={() => (planDeadline = '')}
                >
                  Clear
                </button>
                <button
                  class="btn btn-outline btn-sm"
                  type="button"
                  on:click={() => (deadlineOpen = false)}
                >
                  Done
                </button>
              </div>
            </div>
          {/if}
        </div>
      </div>
      {#if showBuyIn}
        <div class="flex items-center justify-between rounded-2xl border border-base-200 p-4">
          <div>
            <p class="font-semibold">Allow buy-in?</p>
            <p class="text-sm text-base-content/60">Participants can chip in toward the total cost.</p>
          </div>
          <input type="checkbox" class="toggle toggle-primary" bind:checked={allowBuyIn} />
        </div>
      {/if}
    </div>

    {#if errorMessage}
      <div class="alert alert-error text-sm">
        {errorMessage}
      </div>
    {/if}

    <div class="flex items-center justify-between">
      <button class="btn btn-outline">Back</button>
      <button class="btn btn-primary" type="submit" disabled={isSubmitting}>
        {#if isSubmitting}
          Creating...
        {:else}
          <span>Create Plan</span>
          <span class="material-symbols-outlined text-sm">arrow_forward</span>
        {/if}
      </button>
    </div>
  </form>
</div>
