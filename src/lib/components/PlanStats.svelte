<script lang="ts">
  export let budget = 2400;
  export let collected = 1200;
  export let perPerson = 200;
  export let countdown = '12 Days';

  $: progressValue = budget > 0 ? (collected / budget) * 100 : 0;
</script>

<div class="grid gap-4 lg:grid-cols-4">
  <div class="card bg-base-100 border border-base-200 shadow-sm">
    <div class="card-body">
      <p class="text-xs uppercase tracking-wide text-base-content/50">Total Budget</p>
      <p class="text-2xl font-semibold">${budget.toLocaleString()}</p>
    </div>
  </div>
  <div class="card bg-base-100 border border-base-200 shadow-sm">
    <div class="card-body">
      <p class="text-xs uppercase tracking-wide text-base-content/50">Collected</p>
      <p class="text-2xl font-semibold text-primary">${collected.toLocaleString()}</p>
      <progress class="progress progress-primary" value={progressValue} max="100"></progress>
    </div>
  </div>
  <div class="card bg-base-100 border border-base-200 shadow-sm">
    <div class="card-body">
      <p class="text-xs uppercase tracking-wide text-base-content/50">Cost per person</p>
      <p class="text-2xl font-semibold">${perPerson.toLocaleString()}</p>
    </div>
  </div>
  <div class="card bg-base-100 border border-base-200 shadow-sm">
    <div class="card-body">
      <p class="text-xs uppercase tracking-wide text-base-content/50">Countdown</p>
      <p class="text-2xl font-semibold">{countdown}</p>
      <p class="text-xs text-base-content/60">Until trip starts</p>
    </div>
  </div>
</div>
