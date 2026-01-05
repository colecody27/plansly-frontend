<script lang="ts">
  import { page } from '$app/stores';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/plans/create', label: 'Create Plan' },
    { href: '/dashboard#plans', label: 'My Plans' },
    { href: '/explore', label: 'Explore' }
  ];
</script>

<nav class="navbar px-6 lg:px-16 py-4">
  <div class="navbar-start gap-3">
    <div class="h-10 w-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
      <span class="text-lg font-bold">P</span>
    </div>
    <span class="text-lg font-semibold tracking-tight">Plannit</span>
  </div>
  <div class="navbar-center hidden lg:flex gap-8 text-sm font-semibold">
    {#each navLinks as link}
      <a
        class={
          $page.url.pathname.startsWith(link.href)
            ? 'text-primary border-b-2 border-primary pb-1'
            : 'hover:text-primary'
        }
        href={link.href}
      >
        {link.label}
      </a>
    {/each}
  </div>
  <div class="navbar-end gap-3">
    <ThemeToggle />
    <button class="btn btn-sm btn-primary">Create New Plan</button>
    <div class="avatar placeholder">
      <div class="bg-base-200 text-base-content rounded-full w-9">
        <span>AC</span>
      </div>
    </div>
  </div>
</nav>
