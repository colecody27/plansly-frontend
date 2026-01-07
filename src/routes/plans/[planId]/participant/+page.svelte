<script lang="ts">
  import { onMount } from 'svelte';
  import AppNav from '$lib/components/AppNav.svelte';
  import PlanHeader from '$lib/components/PlanHeader.svelte';
  import PlanStats from '$lib/components/PlanStats.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import ChatPanel from '$lib/components/ChatPanel.svelte';
  import ItineraryTimeline from '$lib/components/ItineraryTimeline.svelte';
  import ParticipantsCard from '$lib/components/ParticipantsCard.svelte';
  import { samplePlanDetail } from '$lib/data/samplePlans';

  const planLocked = true;
  const venmoHandle = '@sarah-host';
  const venmoLink = 'https://plannit.app/pay/placeholder';
  let copiedVenmo = false;
  let activityCost = '';
  let isAllDay = false;
  let activityStartTime = '';
  let activityEndTime = '';

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

  const copyVenmoHandle = async () => {
    try {
      await navigator.clipboard.writeText(venmoHandle);
    } catch (error) {
      // Fallback to still show feedback even if clipboard is blocked.
    }
    copiedVenmo = true;
    setTimeout(() => {
      copiedVenmo = false;
    }, 2000);
  };
</script>

<div>
  <AppNav />
  <main class="px-6 lg:px-16 pb-20">
    <section class="section-spacing space-y-8">
      <PlanHeader
        title="Weekend in Joshua Tree"
        dateRange="June 14-16"
        location="Joshua Tree, CA"
        showFinalize={false}
        showInvite={false}
        extraActionLabel="Leave Plan"
        extraActionHref="#"
        extraActionVariant="ghost"
        extraActionClass="text-error"
        extraActionTargetId="leave-plan-modal"
      />
      <div class="card bg-base-100 border border-base-200 shadow-sm">
        <div class="card-body">
          <div class="overflow-hidden rounded-2xl border border-base-200">
            <img
              class="h-48 w-full object-cover"
              src="https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80"
              alt="Plan cover"
            />
          </div>
          <div class="mt-4 flex items-center gap-3">
            <Avatar initials="SN" size="lg" status="none" innerClass="bg-primary/15 text-primary" />
            <div class="text-sm">
              <p class="text-base-content/60">Hosted by</p>
              <p class="font-semibold">Sarah Nguyen</p>
            </div>
          </div>
          <h3 class="text-lg font-semibold mt-4">Plan Details</h3>
          <p class="text-sm text-base-content/70">{samplePlanDetail.description}</p>
        </div>
      </div>
      {#if planLocked}
        <div class="card bg-base-100 border border-base-200 shadow-sm">
          <div class="card-body flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 class="text-lg font-semibold">Plan locked - payment required</h3>
              <p class="text-sm text-base-content/60">Complete your buy-in to confirm your spot.</p>
            </div>
            <label class="btn btn-primary" for="payment-modal">Pay Now</label>
          </div>
        </div>
      {/if}
      <PlanStats budget={2400} collected={1200} perPerson={200} countdown="12 Days" />

      <div class="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div class="space-y-6">
          <ItineraryTimeline
            activities={samplePlanDetail.activities}
            addTargetId="add-activity-modal"
            emphasizeAdd={true}
          />
        </div>
        <div class="space-y-6">
          <ParticipantsCard participants={samplePlanDetail.participants} showManage={false} />
          <ChatPanel messages={samplePlanDetail.chat} />
        </div>
      </div>
    </section>

    <input id="payment-modal" type="checkbox" class="modal-toggle" />
    <div class="modal" role="dialog">
      <div class="modal-box">
        <h3 class="text-lg font-semibold mb-4">Payment Details</h3>
        <div class="space-y-3">
          <div class="rounded-2xl border border-base-200 p-4">
            <p class="text-sm text-base-content/60">Organizer</p>
            <p class="font-semibold">Sarah Nguyen</p>
            <p class="text-sm text-base-content/60">Venmo: {venmoHandle}</p>
            <p class="text-sm text-base-content/60">
              Link:
              <a class="link link-hover text-primary" href={venmoLink}>
                {venmoLink}
              </a>
            </p>
            <button class="btn btn-xs btn-outline mt-3" on:click={copyVenmoHandle}>
              {copiedVenmo ? 'Handle copied' : 'Copy Venmo handle'}
            </button>
          </div>
          <div class="rounded-2xl border border-base-200 p-4">
            <p class="text-sm text-base-content/60">Amount due</p>
            <p class="text-2xl font-semibold">$200.00</p>
          </div>
        </div>
        <div class="modal-action">
          <label for="payment-modal" class="btn btn-outline">Close</label>
          <label for="payment-modal" class="btn btn-primary">Mark as Paid</label>
        </div>
      </div>
      <label class="modal-backdrop" for="payment-modal">Close</label>
    </div>

    <input id="leave-plan-modal" type="checkbox" class="modal-toggle" />
    <div class="modal" role="dialog">
      <div class="modal-box">
        <h3 class="text-lg font-semibold mb-3 text-error">Leave this plan?</h3>
        <p class="text-sm text-base-content/70">
          You will lose access to the itinerary and chat unless you are re-invited.
        </p>
        <div class="modal-action">
          <label for="leave-plan-modal" class="btn btn-ghost">Cancel</label>
          <button class="btn btn-error">Leave Plan</button>
        </div>
      </div>
      <label class="modal-backdrop" for="leave-plan-modal">Close</label>
    </div>

    <input id="add-activity-modal" type="checkbox" class="modal-toggle" />
    <div class="modal" role="dialog">
      <div class="modal-box">
        <h3 class="text-lg font-semibold mb-4">Add Activity</h3>
        <div class="space-y-3">
          <label class="form-control">
            <span class="label-text">Activity name</span>
            <input class="input input-bordered" placeholder="Arrival & Check-in" />
          </label>
          <label class="form-control">
            <span class="label-text">Timeframe</span>
            <div class="rounded-2xl border border-base-200 p-3">
              <calendar-range months="1" page-by="single">
                <calendar-month></calendar-month>
              </calendar-range>
            </div>
          </label>
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
          <label class="form-control">
            <span class="label-text">Link</span>
            <input class="input input-bordered" placeholder="https://maps.google.com" />
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
          <label class="form-control">
            <span class="label-text">Details</span>
            <textarea class="textarea textarea-bordered h-24" placeholder="Add activity details."></textarea>
          </label>
        </div>
        <div class="modal-action">
          <label for="add-activity-modal" class="btn btn-outline">Cancel</label>
          <label for="add-activity-modal" class="btn btn-primary">Save Activity</label>
        </div>
      </div>
      <label class="modal-backdrop" for="add-activity-modal">Close</label>
    </div>
  </main>
</div>
