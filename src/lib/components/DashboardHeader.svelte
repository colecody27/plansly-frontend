<script lang="ts">
  export let name = 'Alex';
  export let planCount = 0;
</script>

<div class="space-y-2">
  <h1 class="text-3xl lg:text-4xl font-semibold">
    Welcome back,<span class="text-primary block sm:inline"> {name}!</span>
  </h1>
  <p class="text-base text-base-content/70">You have {planCount} upcoming plans.</p>
</div>
