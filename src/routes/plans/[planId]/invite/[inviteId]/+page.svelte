<script lang="ts">
  import AppNav from '$lib/components/AppNav.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import { formatShortDate } from '$lib/models/plan';
  import { apiFetch } from '$lib/api/client';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { getLoginUrl } from '$lib/api/auth';

  const props = $props();
  const plan = props.data.plan;

  const host = plan?.participants.find((person) => person.status === 'organizer') ?? null;
  const hostInitials = host?.name
    ? host.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
    : 'H';

  let isAccepting = $state(false);
  let acceptError = $state('');
  const normalizePlanRedirect = (target: string | undefined, planId: string) => {
    if (!target) {
      return `/plans/${planId}`;
    }
    return target.replace(/(\/plans\/[^/]+)\/(participant|organizer)(?=$|[/?#])/, '$1');
  };

  const handleAccept = async () => {
    if (!plan || isAccepting) {
      return;
    }
    acceptError = '';
    isAccepting = true;
    try {
      const response = await apiFetch<{ redirect?: string }>(
        `/plan/${plan.id}/invite/${$page.params.inviteId}/accept`,
        {
          method: 'POST'
        }
      );
      await goto(normalizePlanRedirect(response?.redirect, plan.id));
    } catch (error) {
      const status = (error as Error & { status?: number })?.status;
      if (browser && (status === 401 || status === 403)) {
        window.location.href = getLoginUrl($page.url.pathname);
        return;
      }
      acceptError = error instanceof Error ? error.message : 'Unable to accept invitation.';
    } finally {
      isAccepting = false;
    }
  };
</script>

<div>
  <AppNav />
  <main class="px-6 lg:px-16 pb-20">
    <section class="section-spacing space-y-6">
      {#if props.data.statusMessage}
        <div class="alert alert-error text-sm">{props.data.statusMessage}</div>
      {:else if plan}
        <div class="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div class="space-y-6">
            <div class="card border border-base-200 shadow-sm overflow-hidden">
              <div class="relative">
                <img
                  class="h-72 w-full object-cover"
                  src={plan.coverImage}
                  alt={plan.title}
                />
                <span class="badge badge-primary absolute left-4 top-4">Confirmed Plan</span>
              </div>
              <div class="card-body gap-4">
                <div>
                  <h1 class="text-3xl font-semibold">{plan.title}</h1>
                  {#if host}
                    <div class="mt-4 flex items-center gap-3">
                      <Avatar
                        initials={hostInitials}
                        size="lg"
                        status="none"
                        imageUrl={host.avatar ?? null}
                        innerClass="bg-primary/15 text-primary ring-2 ring-primary/30"
                      />
                      <div>
                        <p class="text-sm text-base-content/60">Hosted by</p>
                        <p class="font-semibold">{host.name}</p>
                      </div>
                    </div>
                  {/if}
                </div>
                <div class="grid gap-4 md:grid-cols-4">
                  <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
                    <p class="text-xs uppercase tracking-wide text-base-content/50">Deadline</p>
                    <p class="mt-2 text-sm font-semibold">
                      {plan.deadline ? formatShortDate(plan.deadline) : 'TBD'}
                    </p>
                  </div>
                  <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
                    <p class="text-xs uppercase tracking-wide text-base-content/50">Buy-in</p>
                    <p class="mt-2 text-sm font-semibold">${plan.perPerson.toFixed(2)}</p>
                  </div>
                  <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
                    <p class="text-xs uppercase tracking-wide text-base-content/50">Location</p>
                    <p class="mt-2 text-sm font-semibold">{plan.location}</p>
                  </div>
                  <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
                    <p class="text-xs uppercase tracking-wide text-base-content/50">Going</p>
                    <p class="mt-2 text-sm font-semibold">{plan.participants.length} People</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="card border border-base-200 bg-base-100 shadow-sm">
              <div class="card-body gap-4">
                <div class="flex items-center gap-2">
                  <svg class="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M4 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.414a2 2 0 0 0-.586-1.414l-3.414-3.414A2 2 0 0 0 12.586 2H4Z" />
                  </svg>
                  <h3 class="text-lg font-semibold">Plan Details</h3>
                </div>
                <p class="text-sm text-base-content/70">
                  {plan.description || 'No description yet.'}
                </p>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div class="card border border-base-200 bg-base-100 shadow-sm">
              <div class="card-body gap-4">
                <div class="flex items-start justify-between">
                  <div>
                    <p class="text-xs uppercase tracking-wide text-base-content/50">Total per person</p>
                    <p class="mt-2 text-2xl font-semibold">${plan.perPerson.toFixed(2)}</p>
                  </div>
                  <div class="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M6 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v1H2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Z" />
                      <path d="M2 9h16v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9Z" />
                    </svg>
                  </div>
                </div>
                <button class="btn btn-primary w-full" type="button" on:click={handleAccept} disabled={isAccepting}>
                  {isAccepting ? 'Accepting...' : 'Accept Invitation →'}
                </button>
                {#if acceptError}
                  <div class="alert alert-error text-sm">{acceptError}</div>
                {/if}
              </div>
            </div>

            <div class="card border border-base-200 bg-base-100 shadow-sm">
              <div class="card-body gap-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/60">
                    Who’s going ({plan.participants.length})
                  </h3>
                </div>
                <div class="flex flex-wrap gap-3">
                  {#each plan.participants.slice(0, 8) as person}
                    <div class="flex items-center gap-3">
                      <Avatar
                        initials={person.name.slice(0, 1)}
                        status="none"
                        imageUrl={person.avatar ?? null}
                      />
                      <div class="text-sm">
                        <p class="font-semibold">{person.name}</p>
                        {#if person.status}
                          <p class="text-xs text-base-content/60">{person.status}</p>
                        {/if}
                      </div>
                    </div>
                  {/each}
                  {#if plan.participants.length === 0}
                    <p class="text-sm text-base-content/60">Be the first to join.</p>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </section>
  </main>
</div>
