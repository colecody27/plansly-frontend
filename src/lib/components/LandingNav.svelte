<script lang="ts">
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import { getLoginUrl } from '$lib/api/auth';
</script>

<nav class="navbar px-6 lg:px-16 py-4">
  <div class="navbar-start gap-3">
    <a class="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3" href="/">
      <img class="h-16 w-16 rounded-2xl" src="/logo.svg" alt="Plansly logo" />
      <span class="hidden sm:inline text-lg font-semibold tracking-tight">Plansly</span>
    </a>
  </div>
  <div class="navbar-end gap-3">
    <ThemeToggle />
    <a class="btn btn-sm btn-ghost hidden sm:inline-flex" href={getLoginUrl()}>Login</a>
    <a class="btn btn-sm btn-primary" href={getLoginUrl()}>
      <span class="sm:hidden">Login</span>
      <span class="hidden sm:inline">Sign Up</span>
    </a>
  </div>
</nav>
