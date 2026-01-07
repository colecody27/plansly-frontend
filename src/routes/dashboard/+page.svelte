<script lang="ts">
  import { onMount } from 'svelte';
  import AppNav from '$lib/components/AppNav.svelte';
  import DashboardHeader from '$lib/components/DashboardHeader.svelte';
  import PlanCard from '$lib/components/PlanCard.svelte';
  import { samplePlans } from '$lib/data/samplePlans';
  import { getPlans } from '$lib/api/plans';
  import type { Plan } from '$lib/types';

  let plans: Plan[] = samplePlans;
  let statusMessage = '';

  onMount(async () => {
    try {
      const response = await getPlans();
      if (response.success && Array.isArray(response.data)) {
        plans = response.data;
      }
    } catch (error) {
      statusMessage = 'Using demo data until you connect the backend.';
    }
  });
</script>

<div>
  <AppNav />
  <main class="px-6 lg:px-16 pb-16">
    <div class="section-spacing space-y-6">
      <DashboardHeader name="Alex" />
      {#if statusMessage}
        <div class="alert alert-info text-sm">
          {statusMessage}
        </div>
      {/if}
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="tabs tabs-bordered">
          <a class="tab tab-active">Hosting (4)</a>
          <a class="tab">Invited (2)</a>
          <a class="tab">Past Events</a>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-outline btn-sm">Date</button>
          <button class="btn btn-outline btn-sm">Status</button>
          <button class="btn btn-primary btn-sm">More Filters</button>
        </div>
      </div>
      <div class="flex flex-col lg:flex-row gap-4">
        <label class="input input-bordered flex items-center gap-2 flex-1">
          <input type="text" class="grow" placeholder="Search plans by title or location" />
          <span class="text-base-content/40">Search</span>
        </label>
        <button class="btn btn-primary">Create New Plan</button>
      </div>
    </div>

    <section id="plans" class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {#each plans as plan}
        <PlanCard {plan} />
      {/each}
      <div class="card border-2 border-dashed border-base-200 bg-base-100/60 text-center">
        <div class="card-body items-center justify-center gap-2">
          <div class="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl">+</div>
          <h3 class="font-semibold">Create New Plan</h3>
          <p class="text-sm text-base-content/60">Start organizing your next trip, dinner, or event.</p>
          <button class="btn btn-ghost text-primary">Get Started</button>
        </div>
      </div>
    </section>
  </main>
</div>
