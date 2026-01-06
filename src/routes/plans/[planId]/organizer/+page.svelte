<script lang="ts">
  import { onMount } from 'svelte';
  import AppNav from '$lib/components/AppNav.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import PlanHeader from '$lib/components/PlanHeader.svelte';
  import PlanStats from '$lib/components/PlanStats.svelte';
  import ItineraryTimeline from '$lib/components/ItineraryTimeline.svelte';
  import ParticipantsCard from '$lib/components/ParticipantsCard.svelte';
  import ChatPanel from '$lib/components/ChatPanel.svelte';
  import { samplePlanDetail } from '$lib/data/samplePlans';

  const venmoHandle = '';
  const inviteLink = 'https://plannit.app/join/joshua-tree-82x9';
  let copiedInvite = false;
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

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch (error) {
      // Fallback to still show feedback even if clipboard is blocked.
    }
    copiedInvite = true;
    setTimeout(() => {
      copiedInvite = false;
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
        inviteTargetId="invite-modal"
      />
      {#if !venmoHandle}
        <div class="alert alert-warning">
          Add your Venmo handle to enable faster buy-in payouts.
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
          <ParticipantsCard
            participants={samplePlanDetail.participants}
            manageTargetId="manage-participants-modal"
          />
          <ChatPanel messages={samplePlanDetail.chat} />
        </div>
      </div>
    </section>

    <input id="manage-participants-modal" type="checkbox" class="modal-toggle" />
    <div class="modal" role="dialog">
      <div class="modal-box">
        <h3 class="text-lg font-semibold mb-4">Manage Participants</h3>
        <div class="space-y-3">
          {#each samplePlanDetail.participants as person}
            <div class="flex items-center justify-between rounded-2xl border border-base-200 p-3">
              <div class="flex items-center gap-3">
                <Avatar initials={person.name.slice(0, 1)} status="none" />
                <div>
                  <p class="font-semibold text-sm">{person.name}</p>
                  <p class="text-xs text-base-content/60">{person.status ?? 'participant'}</p>
                </div>
              </div>
              <label class="btn btn-xs btn-outline text-error" for="remove-participant-modal">
                Remove
              </label>
            </div>
          {/each}
        </div>
        <div class="modal-action">
          <label for="manage-participants-modal" class="btn btn-outline">Done</label>
        </div>
      </div>
      <label class="modal-backdrop" for="manage-participants-modal">Close</label>
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

    <input id="remove-participant-modal" type="checkbox" class="modal-toggle" />
    <div class="modal" role="dialog">
      <div class="modal-box">
        <h3 class="text-lg font-semibold mb-3 text-error">Remove participant?</h3>
        <p class="text-sm text-base-content/70">
          They will lose access to the itinerary and chat for this plan.
        </p>
        <div class="modal-action">
          <label for="remove-participant-modal" class="btn btn-ghost">Cancel</label>
          <button class="btn btn-error">Remove</button>
        </div>
      </div>
      <label class="modal-backdrop" for="remove-participant-modal">Close</label>
    </div>

    <input id="invite-modal" type="checkbox" class="modal-toggle" />
    <div class="modal" role="dialog">
      <div class="modal-box">
        <div class="flex items-center justify-between">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span class="text-xl">+</span>
          </div>
          <label for="invite-modal" class="btn btn-ghost btn-sm">✕</label>
        </div>
        <h3 class="text-lg font-semibold mt-4">Invite Friends</h3>
        <p class="text-sm text-base-content/70 mt-1">
          Send this link to friends so they can join the plan.
        </p>
        <div class="mt-4 rounded-2xl border border-base-200 bg-base-100 px-4 py-3 text-sm">
          {inviteLink.replace('https://', '')}
        </div>
        <button class="btn btn-primary w-full mt-4" on:click={copyInviteLink}>
          {copiedInvite ? 'Invite Link Copied' : 'Copy Invite Link'}
        </button>
      </div>
      <label class="modal-backdrop" for="invite-modal">Close</label>
    </div>
  </main>
</div>
