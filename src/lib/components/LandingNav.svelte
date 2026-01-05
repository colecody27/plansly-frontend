<script lang="ts">
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
</script>

<nav class="navbar px-6 lg:px-16 py-4">
  <div class="navbar-start gap-3">
    <div class="h-10 w-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
      <span class="text-lg font-bold">P</span>
    </div>
    <span class="text-lg font-semibold tracking-tight">Plannit</span>
  </div>
  <div class="navbar-center hidden lg:flex gap-8 text-sm font-semibold">
    <a class="hover:text-primary" href="/dashboard">Dashboard</a>
    <a class="hover:text-primary" href="/plans/create">Create Plan</a>
    <a class="hover:text-primary" href="/dashboard#plans">My Plans</a>
    <a class="hover:text-primary" href="/explore">Explore</a>
  </div>
  <div class="navbar-end gap-3">
    <ThemeToggle />
    <a class="btn btn-sm btn-ghost" href="/login">Log In</a>
    <a class="btn btn-sm btn-primary" href="/signup">Sign Up</a>
  </div>
</nav>
