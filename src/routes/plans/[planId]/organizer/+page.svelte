<script lang="ts">
  import AppNav from '$lib/components/AppNav.svelte';
  import PlanHeader from '$lib/components/PlanHeader.svelte';
  import PlanStats from '$lib/components/PlanStats.svelte';
  import ItineraryTimeline from '$lib/components/ItineraryTimeline.svelte';
  import ParticipantsCard from '$lib/components/ParticipantsCard.svelte';
  import ChatPanel from '$lib/components/ChatPanel.svelte';
  import ActivityProposals from '$lib/components/ActivityProposals.svelte';
  import { samplePlanDetail } from '$lib/data/samplePlans';
</script>

<div>
  <AppNav />
  <main class="px-6 lg:px-16 pb-20">
    <section class="section-spacing space-y-8">
      <PlanHeader
        title="Weekend in Joshua Tree"
        dateRange="June 14-16"
        location="Joshua Tree, CA"
      />
      <PlanStats budget={2400} collected={1200} perPerson={200} countdown="12 Days" />

      <div class="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div class="space-y-6">
          <ItineraryTimeline activities={samplePlanDetail.activities} />
          <div class="card bg-base-100 border border-base-200 shadow-sm">
            <div class="card-body text-center">
              <button class="btn btn-outline">Plan Dinner</button>
              <p class="text-sm text-base-content/60">No events proposed yet.</p>
            </div>
          </div>
        </div>
        <div class="space-y-6">
          <ParticipantsCard participants={samplePlanDetail.participants} />
          <ChatPanel messages={samplePlanDetail.chat} />
        </div>
      </div>

      <ActivityProposals proposals={samplePlanDetail.proposals} />
    </section>
  </main>
</div>
