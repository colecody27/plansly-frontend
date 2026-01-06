<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import Avatar from '$lib/components/Avatar.svelte';

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/plans/create', label: 'Create Plan' },
    { href: '/explore', label: 'Explore' }
  ];

  const avatarStyles = [
    'bg-primary/20 text-primary ring-primary/30',
    'bg-secondary/20 text-secondary ring-secondary/30',
    'bg-accent/20 text-accent ring-accent/30',
    'bg-info/20 text-info ring-info/30',
    'bg-success/20 text-success ring-success/30'
  ];

  let avatarClass = avatarStyles[0];

  onMount(() => {
    const index = Math.floor(Math.random() * avatarStyles.length);
    avatarClass = avatarStyles[index];
  });
</script>

<nav class="navbar px-6 lg:px-16 py-4">
  <div class="navbar-start gap-3">
    <a class="flex items-center gap-3" href="/dashboard">
      <div class="h-10 w-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
        <span class="text-lg font-bold">P</span>
      </div>
      <span class="text-lg font-semibold tracking-tight">Plannit</span>
    </a>
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
    <div class="dropdown dropdown-end">
      <label tabindex="0" class="btn btn-ghost btn-circle overflow-visible">
        <Avatar initials="AC" status="online" innerClass={`ring-2 ${avatarClass}`} />
      </label>
      <ul
        tabindex="0"
        class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-48 border border-base-200"
      >
        <li><a href="/profile">Profile</a></li>
        <li><a href="/profile">Settings</a></li>
        <li><a href="/logout">Logout</a></li>
        <li><a href="#">More...</a></li>
      </ul>
    </div>
  </div>
</nav>
