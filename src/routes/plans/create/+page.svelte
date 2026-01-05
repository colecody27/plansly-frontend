<script lang="ts">
  import AppNav from '$lib/components/AppNav.svelte';
  import CreatePlanForm from '$lib/components/CreatePlanForm.svelte';
</script>

<div>
  <AppNav />
  <main class="px-6 lg:px-16 pb-20">
    <section class="section-spacing space-y-6">
      <div>
        <p class="text-sm text-primary">Step 2 of 3</p>
        <h1 class="text-3xl lg:text-4xl font-semibold">Let's make it happen</h1>
        <p class="text-base text-base-content/70">
          Tell us about your next adventure. We'll help you organize it.
        </p>
      </div>
      <div class="flex items-center justify-between text-xs text-base-content/60">
        <span>Plan Basics</span>
        <span>Plan Details</span>
      </div>
      <progress class="progress progress-primary" value="62" max="100"></progress>
      <CreatePlanForm />
    </section>
  </main>
</div>
