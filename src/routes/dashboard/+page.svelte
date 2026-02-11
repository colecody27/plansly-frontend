<script lang="ts">
  import AppNav from '$lib/components/AppNav.svelte';
  import DashboardHeader from '$lib/components/DashboardHeader.svelte';
  import PlanCard from '$lib/components/PlanCard.svelte';

  const normalizeText = (value: string) => value.trim().toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const props = $props();
  const profileId = props.data.profile?.id ?? null;
  let activeTab = $state<'all' | 'hosting' | 'invited' | 'past'>('all');
  let searchTerm = $state('');
  let dateSort = $state<'asc' | 'desc'>('asc');
  let statusFilter = $state('all');
  let showFilters = $state(false);
  let typeFilters = $state({
    trip: true,
    event: true,
    group: true
  });

  const isPastPlan = (plan: typeof props.data.plans[number]) => {
    const date = plan.endDay ?? plan.startDay ?? null;
    return date ? date.getTime() < today.getTime() : false;
  };

  const isHostingPlan = (plan: typeof props.data.plans[number]) => {
    if (!profileId) {
      return true;
    }
    return plan.participants.some(
      (participant) => participant.id === profileId && participant.status === 'organizer'
    );
  };

  const isInvitedPlan = (plan: typeof props.data.plans[number]) => {
    if (!profileId) {
      return false;
    }
    return plan.participants.some(
      (participant) => participant.id === profileId && participant.status !== 'organizer'
    );
  };

  const statuses = $derived.by(() => {
    const unique = new Set(props.data.plans.map((plan) => plan.status).filter(Boolean));
    return ['all', ...unique];
  });

  const hostingPlans = $derived.by(() =>
    props.data.plans.filter((plan) => isHostingPlan(plan) && !isPastPlan(plan))
  );
  const invitedPlans = $derived.by(() =>
    props.data.plans.filter((plan) => isInvitedPlan(plan) && !isPastPlan(plan))
  );
  const pastPlans = $derived.by(() => props.data.plans.filter((plan) => isPastPlan(plan)));

  const tabPlans = $derived.by(() => {
    if (activeTab === 'invited') {
      return invitedPlans;
    }
    if (activeTab === 'past') {
      return pastPlans;
    }
    if (activeTab === 'hosting') {
      return hostingPlans;
    }
    return props.data.plans;
  });

  const matchesSearch = (plan: typeof props.data.plans[number]) => {
    const term = normalizeText(searchTerm);
    if (!term) {
      return true;
    }
    return (
      normalizeText(plan.title).includes(term) ||
      normalizeText(plan.location ?? '').includes(term)
    );
  };

  const matchesStatus = (plan: typeof props.data.plans[number]) =>
    statusFilter === 'all' || plan.status === statusFilter;

  const matchesType = (plan: typeof props.data.plans[number]) => typeFilters[plan.type];

  const filteredPlans = $derived.by(() =>
    tabPlans
      .filter((plan) => matchesSearch(plan) && matchesStatus(plan) && matchesType(plan))
      .sort((a, b) => {
        const aDate = a.startDay ?? a.deadline ?? a.createdAt ?? new Date(0);
        const bDate = b.startDay ?? b.deadline ?? b.createdAt ?? new Date(0);
        const diff = aDate.getTime() - bDate.getTime();
        return dateSort === 'asc' ? diff : -diff;
      })
  );

  const toggleDateSort = () => {
    dateSort = dateSort === 'asc' ? 'desc' : 'asc';
  };

  const cycleStatusFilter = () => {
    const currentIndex = statuses.indexOf(statusFilter);
    const next = statuses[(currentIndex + 1) % statuses.length];
    statusFilter = next ?? 'all';
  };
</script>

<div>
  <AppNav />
  <main class="px-6 lg:px-16 pb-16">
    <div class="section-spacing space-y-6">
      <DashboardHeader
        name={props.data.profile?.name ?? 'there'}
        planCount={props.data.plans.length}
      />
      {#if props.data.statusMessage}
        <div class="alert alert-info text-sm">
          {props.data.statusMessage}
        </div>
      {/if}
      <div class="flex flex-col gap-6">
        <div class="order-1 lg:order-3 flex flex-col lg:flex-row gap-4">
          <a class="btn btn-primary lg:order-2 gap-3" href="/plans/create">
            <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral">
              <span class="material-symbols-outlined text-[12px] text-primary">add</span>
            </span>
            Create New Plan
          </a>
          <label class="input input-bordered flex items-center gap-2 flex-1 lg:order-1">
            <input
              type="text"
              class="grow"
              placeholder="Search plans by title or location"
              bind:value={searchTerm}
            />
            <span class="text-base-content/40">Search</span>
          </label>
        </div>
        <div class="order-2 lg:order-1 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div class="order-2 lg:order-1 -mx-2 flex gap-2 overflow-x-auto border-b border-base-200/70 px-2 pb-1 lg:mx-0 lg:border-none lg:pb-0">
            <button
              class={`px-3 py-2 text-sm font-semibold ${
                activeTab === 'all' ? 'text-primary border-b-2 border-primary' : 'text-base-content/70'
              }`}
              type="button"
              on:click={() => (activeTab = 'all')}
            >
              All ({props.data.plans.length})
            </button>
            <button
              class={`px-3 py-2 text-sm font-semibold ${
                activeTab === 'hosting' ? 'text-primary border-b-2 border-primary' : 'text-base-content/70'
              }`}
              type="button"
              on:click={() => (activeTab = 'hosting')}
            >
              Hosting ({hostingPlans.length})
            </button>
            <button
              class={`px-3 py-2 text-sm font-semibold ${
                activeTab === 'invited' ? 'text-primary border-b-2 border-primary' : 'text-base-content/70'
              }`}
              type="button"
              on:click={() => (activeTab = 'invited')}
            >
              Invited ({invitedPlans.length})
            </button>
            <button
              class={`px-3 py-2 text-sm font-semibold ${
                activeTab === 'past' ? 'text-primary border-b-2 border-primary' : 'text-base-content/70'
              }`}
              type="button"
              on:click={() => (activeTab = 'past')}
            >
              Past Events ({pastPlans.length})
            </button>
          </div>
          <div class="order-3 lg:order-2 flex flex-wrap gap-2">
            <button class="btn btn-outline btn-sm" type="button" on:click={toggleDateSort}>
              Date {dateSort === 'asc' ? '↑' : '↓'}
            </button>
            <button class="btn btn-outline btn-sm" type="button" on:click={cycleStatusFilter}>
              Status: {statusFilter}
            </button>
            <button
              class="btn btn-primary btn-sm"
              type="button"
              on:click={() => (showFilters = !showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'More Filters'}
            </button>
          </div>
        </div>
        {#if showFilters}
          <div class="order-3 lg:order-2 card border border-base-200 bg-base-100/60">
            <div class="card-body gap-3">
              <div class="text-sm font-semibold">Plan Type</div>
              <div class="flex flex-wrap gap-4 text-sm">
                <label class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm" bind:checked={typeFilters.trip} />
                  Trip
                </label>
                <label class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm" bind:checked={typeFilters.event} />
                  Event
                </label>
                <label class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm" bind:checked={typeFilters.group} />
                  Group Purchase
                </label>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <section id="plans" class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {#each filteredPlans as plan (plan.id)}
        {@const isHost = isHostingPlan(plan)}
        <PlanCard
          {plan}
          ctaHref={`/plans/${plan.id}`}
          ctaLabel={isHost ? 'Manage' : 'View'}
        />
      {/each}
      <div class="card border-2 border-dashed border-base-200 bg-base-100/60 text-center min-h-[360px]">
        <div class="p-6 flex flex-col items-center justify-center gap-2 text-center h-full">
          <div class="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl">+</div>
          <h3 class="font-semibold">Create New Plan</h3>
          <p class="text-sm text-base-content/60">Start organizing your next trip, dinner, or event.</p>
          <a class="btn btn-ghost text-primary" href="/plans/create">Get Started</a>
        </div>
      </div>
    </section>
  </main>
</div>
