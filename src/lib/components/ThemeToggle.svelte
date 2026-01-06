<script lang="ts">
  import { theme } from '$lib/stores/theme';

  $: isDark = $theme === 'plannit-dark';

  const toggleTheme = () => {
    theme.set(isDark ? 'plannit' : 'plannit-dark');
  };
</script>

<button
  class="btn btn-ghost btn-circle swap swap-rotate"
  class:swap-active={isDark}
  aria-label="Toggle theme"
  on:click={toggleTheme}
>
  <svg
    class="swap-off h-5 w-5"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M12 3v2m0 14v2m9-9h-2M5 12H3m14.95 6.95-1.41-1.41M8.46 8.46 7.05 7.05m9.9-1.41-1.41 1.41M8.46 15.54l-1.41 1.41M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"
    />
  </svg>
  <svg
    class="swap-on h-5 w-5"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79z"
    />
  </svg>
</button>
