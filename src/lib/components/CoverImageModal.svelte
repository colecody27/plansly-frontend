<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { finalizePlanImageUpload, getPlanStockImages, requestPlanImageUpload } from '$lib/api/plans';

  export let open = false;
  export let title = 'Update cover';
  export let currentImage: string | null = null;

  const dispatch = createEventDispatcher<{
    close: void;
    save: {
      imageId?: string;
      imageKey?: string;
      previewUrl?: string;
      selectedUrl?: string;
    };
  }>();

  let coverFilter = 'adventure';
  let uploadedCoverPreviewUrl: string | null = null;
  let isUploadingCover = false;
  let uploadError = '';
  let coverUploadToken = 0;
  let selectedCoverImageId: string | null = null;
  let selectedCoverImageKey: string | null = null;
  let coverGallery = [
    { id: 'c1', category: 'nature', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80' }
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

  const handleSave = () => {
    if (isUploadingCover) {
      return;
    }
    dispatch('save', {
      imageId: selectedCoverImageId || undefined,
      imageKey: selectedCoverImageId ? undefined : selectedCoverImageKey || undefined,
      previewUrl: selectedCoverDisplay,
      selectedUrl: selectedCoverValue
    });
  };

  const handleClose = () => {
    dispatch('close');
  };

  onMount(async () => {
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
    if (currentImage) {
      selectedCover = currentImage;
      selectedCoverValue = currentImage;
    }
    return () => {
      if (uploadedCoverPreviewUrl) {
        URL.revokeObjectURL(uploadedCoverPreviewUrl);
      }
    };
  });
</script>

<div class="modal" role="dialog" class:modal-open={open}>
  <div class="modal-box max-w-4xl p-0 overflow-hidden plan-glass modal-opaque border border-base-200 bg-base-100">
    <div class="flex items-center justify-between border-b border-base-200 px-6 py-4">
      <h3 class="text-lg font-semibold">{title}</h3>
      <button class="btn btn-ghost btn-sm" type="button" on:click={handleClose}>✕</button>
    </div>
    <div class="p-6 space-y-4">
      <div class="grid gap-4 lg:grid-cols-[1.1fr,1.4fr]">
        <div class="space-y-3">
          <div class="rounded-2xl border border-base-200 overflow-hidden plan-glass">
            <img class="h-44 w-full object-cover" src={selectedCoverDisplay} alt="Selected cover" />
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
                {filter[0].toUpperCase() + filter.slice(1)}
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
    <div class="flex items-center justify-end gap-3 border-t border-base-200 px-6 py-4">
      <button class="btn btn-ghost" type="button" on:click={handleClose}>Cancel</button>
      <button class="btn btn-primary" type="button" on:click={handleSave} disabled={isUploadingCover}>
        {isUploadingCover ? 'Uploading...' : 'Save'}
      </button>
    </div>
  </div>
</div>
