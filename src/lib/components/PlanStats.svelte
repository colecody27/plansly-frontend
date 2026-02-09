<script lang="ts">
  import { onMount } from 'svelte';

  export let budget = 2400;
  export let collected = 1200;
  export let perPerson = 200;
  export let countdown = '12 Days';

  $: progressValue = budget > 0 ? (collected / budget) * 100 : 0;

  onMount(() => {
    const root = document.querySelector('.stats-carousel-root');
    const carousel = root?.querySelector('.carousel');
    const dots = root?.querySelectorAll<HTMLButtonElement>('[data-target]');
    if (!root || !carousel || !dots?.length) {
      return;
    }

    const items = root.querySelectorAll<HTMLElement>('.carousel-snap');
    const setActive = (index: number) => {
      dots.forEach((dot, i) => {
        dot.classList.toggle('bg-primary', i === index);
        dot.classList.toggle('bg-secondary/60', i !== index);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) {
          return;
        }
        const index = Array.from(items).indexOf(visible.target as HTMLElement);
        if (index >= 0) {
          setActive(index);
        }
      },
      { root: carousel, threshold: [0.6] }
    );

    items.forEach((item) => observer.observe(item));
    setActive(0);

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        items[index]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
    });
  });
</script>

<div class="stats-carousel-root space-y-2">
  <div class="carousel w-full lg:grid lg:grid-cols-3 lg:gap-4">
    <div id="stat-1" class="carousel-item w-full lg:w-auto justify-center carousel-snap">
      <div class="card plan-glass stat-card w-full max-w-sm">
        <div class="card-body gap-3">
          <div class="flex items-center gap-2 text-primary">
            <span class="material-symbols-outlined text-xl">savings</span>
            <p class="text-xs font-semibold uppercase tracking-widest text-primary">Collected</p>
          </div>
          <div class="flex items-end gap-2">
            <p class="text-2xl font-black text-primary">${collected.toLocaleString()}</p>
            <p class="text-sm font-bold text-base-content/50 mb-0.5">/ ${budget.toLocaleString()}</p>
          </div>
          <progress class="progress progress-primary h-1.5" value={progressValue} max="100"></progress>
        </div>
      </div>
    </div>
    <div id="stat-2" class="carousel-item w-full lg:w-auto justify-center carousel-snap">
      <div class="card plan-glass stat-card w-full max-w-sm">
        <div class="card-body gap-3">
          <div class="flex items-center gap-2 text-primary">
            <span class="material-symbols-outlined text-xl">group</span>
            <p class="text-xs font-semibold uppercase tracking-widest text-primary">Your Cost</p>
          </div>
          <p class="text-2xl font-black">${perPerson.toLocaleString()}</p>
        </div>
      </div>
    </div>
    <div id="stat-3" class="carousel-item w-full lg:w-auto justify-center carousel-snap">
      <div class="card plan-glass stat-card w-full max-w-sm">
        <div class="card-body gap-3">
          <div class="flex items-center gap-2 text-primary">
            <span class="material-symbols-outlined text-xl">schedule</span>
            <p class="text-xs font-semibold uppercase tracking-widest text-primary">Countdown</p>
          </div>
          <p class="text-2xl font-black">{countdown}</p>
        </div>
      </div>
    </div>
  </div>
  <div class="flex justify-center gap-2 pt-1 lg:hidden">
    <button class="h-2 w-2 rounded-full bg-secondary/60" type="button" data-target="stat-1"></button>
    <button class="h-2 w-2 rounded-full bg-secondary/60" type="button" data-target="stat-2"></button>
    <button class="h-2 w-2 rounded-full bg-secondary/60" type="button" data-target="stat-3"></button>
  </div>
</div>

<style>
  :global(.stats-carousel-root .carousel) {
    scroll-snap-type: x mandatory;
  }
  :global(.stats-carousel-root .carousel-snap) {
    scroll-snap-align: center;
  }
</style>
