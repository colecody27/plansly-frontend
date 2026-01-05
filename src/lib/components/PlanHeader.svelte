<script lang="ts">
  export let title = 'Weekend in Joshua Tree';
  export let dateRange = 'June 14-16';
  export let location = 'Joshua Tree, CA';
</script>

<div class="space-y-4">
  <div class="flex flex-wrap items-center gap-3">
    <span class="badge badge-success">Planning Phase</span>
    <span class="badge badge-outline">Draft</span>
  </div>
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
    <div>
      <h1 class="text-3xl lg:text-4xl font-semibold">{title}</h1>
      <div class="flex flex-wrap gap-3 text-sm text-base-content/60 mt-2">
        <span>{dateRange}</span>
        <span>-</span>
        <span>{location}</span>
      </div>
    </div>
    <div class="flex flex-wrap gap-3">
      <button class="btn btn-outline">Invite Friends</button>
      <button class="btn btn-primary">Finalize Plan</button>
    </div>
  </div>
</div>
