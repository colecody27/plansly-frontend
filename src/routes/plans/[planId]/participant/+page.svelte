<script lang="ts">
  import AppNav from '$lib/components/AppNav.svelte';
  import PlanCover from '$lib/components/PlanCover.svelte';
  import PaymentCard from '$lib/components/PaymentCard.svelte';
  import ChatPanel from '$lib/components/ChatPanel.svelte';
  import ActivityProposals from '$lib/components/ActivityProposals.svelte';
  import ItineraryTimeline from '$lib/components/ItineraryTimeline.svelte';
  import { samplePlanDetail } from '$lib/data/samplePlans';
</script>

<div>
  <AppNav />
  <main class="px-6 lg:px-16 pb-20">
    <section class="section-spacing space-y-8">
      <div class="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <PlanCover
          title="Annual Ski Trip 2024"
          dateRange="Feb 14 - Feb 16, 2024"
          location="Aspen, CO"
        />
        <div class="space-y-6">
          <PaymentCard amount={150} note="Covering lodging & food" />
          <div class="card bg-base-100 border border-base-200 shadow-sm">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">Attendees (12)</h3>
                <div class="flex -space-x-2">
                  <div class="avatar placeholder">
                    <div class="bg-base-200 rounded-full w-7"><span>A</span></div>
                  </div>
                  <div class="avatar placeholder">
                    <div class="bg-base-200 rounded-full w-7"><span>M</span></div>
                  </div>
                  <div class="avatar placeholder">
                    <div class="bg-base-200 rounded-full w-7"><span>J</span></div>
                  </div>
                  <div class="avatar placeholder">
                    <div class="bg-base-200 rounded-full w-7"><span>+9</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <ChatPanel messages={samplePlanDetail.chat} />
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div class="space-y-6">
          <div class="card bg-base-100 border border-base-200 shadow-sm">
            <div class="card-body">
              <h3 class="text-lg font-semibold">Trip Funding</h3>
              <p class="text-sm text-base-content/60">Help us cover the Airbnb deposit.</p>
              <progress class="progress progress-primary" value="75" max="100"></progress>
              <div class="flex items-center justify-between text-sm text-base-content/60">
                <span>$3,000 of $4,000 raised</span>
                <span>75%</span>
              </div>
            </div>
          </div>
          <div class="card bg-base-100 border border-base-200 shadow-sm">
            <div class="card-body">
              <h3 class="text-lg font-semibold">About this trip</h3>
              <p class="text-sm text-base-content/70">
                It's finally time for our annual winter getaway. We'll hit the slopes, soak in the hot
                tub, and wrap up with a cozy group dinner.
              </p>
            </div>
          </div>
          <ItineraryTimeline activities={samplePlanDetail.activities} />
        </div>
        <ActivityProposals proposals={samplePlanDetail.proposals} />
      </div>
    </section>
  </main>
</div>
