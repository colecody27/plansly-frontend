<script lang="ts">
  const planTypes = [
    { id: 'trip', label: 'Trip', description: 'Getaways & vacations' },
    { id: 'event', label: 'Event', description: 'Parties & meetups' },
    { id: 'group', label: 'Group Buy', description: 'Shared purchases' }
  ];

  let selectedType = 'trip';
</script>

<div class="card bg-base-100 border border-base-200 shadow-sm">
  <div class="card-body gap-6">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">1. Plan Type</h2>
      <button class="text-sm text-primary">Edit</button>
    </div>
    <div class="grid gap-4 md:grid-cols-3">
      {#each planTypes as type}
        <button
          class={`rounded-2xl border p-4 text-left transition ${
            selectedType === type.id
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-base-200 hover:border-primary/60'
          }`}
          on:click={() => (selectedType = type.id)}
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
        <input class="input input-bordered" placeholder="Tahoe Ski Trip 2024" />
      </label>
      <div>
        <span class="label-text">Cover Image</span>
        <div class="mt-2 rounded-2xl border border-base-200 overflow-hidden">
          <img
            class="h-44 w-full object-cover"
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80"
            alt="Cover"
          />
        </div>
      </div>
      <label class="form-control">
        <span class="label-text">What's the plan?</span>
        <textarea
          class="textarea textarea-bordered h-28"
          placeholder="Add details about the itinerary, what to bring, etc..."
        ></textarea>
      </label>
      <div class="grid gap-4 md:grid-cols-3">
        <label class="form-control">
          <span class="label-text">Start Date</span>
          <input class="input input-bordered" placeholder="Start Date" />
        </label>
        <label class="form-control">
          <span class="label-text">End Date</span>
          <input class="input input-bordered" placeholder="End Date" />
        </label>
        <label class="form-control">
          <span class="label-text">Total Budget Target</span>
          <input class="input input-bordered" placeholder="$0.00" />
        </label>
      </div>
      <div class="flex items-center justify-between rounded-2xl border border-base-200 p-4">
        <div>
          <p class="font-semibold">Allow buy-in?</p>
          <p class="text-sm text-base-content/60">Participants can chip in toward the total cost.</p>
        </div>
        <input type="checkbox" class="toggle toggle-primary" checked />
      </div>
    </div>

    <div class="flex items-center justify-between">
      <button class="btn btn-outline">Back</button>
      <button class="btn btn-primary">Continue -></button>
    </div>
  </div>
</div>
