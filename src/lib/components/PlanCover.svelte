<script lang="ts">
  export let title = 'Annual Ski Trip 2024';
  export let dateRange = 'Feb 14 - Feb 16, 2024';
  export let location = 'Aspen, CO';
  export let image = 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1400&q=80';
</script>

<div class="relative rounded-3xl overflow-hidden shadow-lg">
  <img class="h-64 w-full object-cover" src={image} alt={title} />
  <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
  <div class="absolute bottom-6 left-6 text-white space-y-2">
    <h1 class="text-3xl font-semibold">{title}</h1>
    <div class="flex flex-wrap gap-3 text-sm">
      <span>{dateRange}</span>
      <span>-</span>
      <span>{location}</span>
    </div>
  </div>
</div>
