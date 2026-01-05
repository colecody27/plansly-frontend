<script lang="ts">
  import LandingNav from '$lib/components/LandingNav.svelte';
  import HeroLanding from '$lib/components/HeroLanding.svelte';
  import FeatureGrid from '$lib/components/FeatureGrid.svelte';
  import CtaBanner from '$lib/components/CtaBanner.svelte';
  import Footer from '$lib/components/Footer.svelte';

  const trending = [
    'Sarah\'s 25th',
    'Joshua Tree Glamping',
    'Friday Night Dinner',
    'Game Night',
    'Summer BBQ',
    'Road Trip',
    'Karaoke Night'
  ];
</script>

<div class="min-h-screen">
  <LandingNav />
  <HeroLanding />

  <section class="px-6 lg:px-16 pb-12">
    <div class="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-base-content/50">
      <span>Trending events</span>
      <div class="flex flex-wrap gap-2">
        {#each trending as item}
          <span class="badge badge-outline">{item}</span>
        {/each}
      </div>
    </div>
  </section>

  <FeatureGrid />
  <CtaBanner />
  <Footer />
</div>
