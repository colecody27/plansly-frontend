<script lang="ts">
  import { onMount } from 'svelte';
  import AppNav from '$lib/components/AppNav.svelte';
  import { token, initAuth } from '$lib/stores/auth';
  import { getLoginUrl } from '$lib/api/auth';

  let inputToken = '';

  onMount(() => {
    initAuth();
  });

  const saveToken = () => {
    token.set(inputToken.trim() || null);
    inputToken = '';
  };
</script>

<div>
  <AppNav />
  <main class="px-6 lg:px-16 pb-20">
    <section class="section-spacing max-w-xl space-y-6">
      <h1 class="text-3xl font-semibold">Connect your account</h1>
      <p class="text-base text-base-content/70">
        Plansly uses Auth0 for secure login. Use the backend login button or paste a JWT token here for
        local development.
      </p>
      <div class="card bg-base-100 border border-base-200 shadow-sm">
        <div class="card-body gap-4">
          <a class="btn btn-primary" href={getLoginUrl()} target="_blank" rel="noreferrer">Login via Backend</a>
          <label class="form-control">
            <span class="label-text">Paste JWT token</span>
            <input class="input input-bordered" bind:value={inputToken} placeholder="eyJhbGciOi..." />
          </label>
          <div class="flex items-center gap-3">
            <button class="btn btn-outline" on:click={saveToken}>Save token</button>
            {#if $token}
              <span class="text-sm text-success">Token stored</span>
            {/if}
          </div>
        </div>
      </div>
    </section>
  </main>
</div>
