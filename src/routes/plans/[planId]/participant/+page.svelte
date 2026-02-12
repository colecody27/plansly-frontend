<script lang="ts">
  import AppNav from '$lib/components/AppNav.svelte';
  import PlanHeader from '$lib/components/PlanHeader.svelte';
  import PlanStats from '$lib/components/PlanStats.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import ChatPanel from '$lib/components/ChatPanel.svelte';
  import ItineraryTimeline from '$lib/components/ItineraryTimeline.svelte';
  import ParticipantsCard from '$lib/components/ParticipantsCard.svelte';
  import AddActivityModal from '$lib/components/AddActivityModal.svelte';
  import ProposedActivities from '$lib/components/ProposedActivities.svelte';
  import PaymentSuccessModal from '$lib/components/PaymentSuccessModal.svelte';
  import { formatShortDate, mapPlanDetailFromApi } from '$lib/models/plan';
  import { onDestroy, onMount } from 'svelte';
  import { joinPlan, leavePlan, onAnnouncement, onMessage, onUsers, sendMessage } from '$lib/socket';
  import { apiFetch, getBackendBaseUrl } from '$lib/api/client';
  import { goto, invalidate } from '$app/navigation';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';

  const props = $props();
  let planOverride = $state<import('$lib/types').PlanDetail | null>(null);
  const plan = $derived(planOverride ?? props.data.plan);
  const viewerRole = $derived(
    (props.data.viewerRole ?? 'participant') as 'viewer' | 'participant' | 'admin'
  );
  const canChat = $derived(viewerRole !== 'viewer');
  const canVote = $derived(viewerRole !== 'viewer');
  const canProposeActivities = $derived(viewerRole === 'admin');
  const canJoinPlan = $derived(viewerRole === 'viewer');
  const statusMessage = props.data.statusMessage ?? '';
  const planLocked = $derived((plan?.status ?? '').toLowerCase() === 'locked');
  let copiedVenmo = $state(false);
  let addActivityOpen = $state(false);
  let paymentSuccessOpen = $state(false);
  let chatOpen = $state(false);
  let lockedActivityNoticeOpen = $state(false);
  let detailsExpanded = $state(false);
  let inviteModalOpen = $state(false);
  let inviteLink = $state('');
  let inviteStatus = $state('');
  let isInviteLoading = $state(false);
  let copiedInvite = $state(false);
  let coverImage = $state(plan?.coverImage ?? '');
  let isJoiningPlan = $state(false);
  let joinPlanError = $state('');

  const host = $derived(
    plan?.organizer ??
      plan?.participants.find((person) => person.status === 'organizer') ??
      plan?.participants[0] ??
      null
  );
  const hostInitials = $derived(
    host?.name
      ? host.name
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase())
          .join('')
      : 'H'
  );

  let activities = $state(plan?.activities ?? []);
  let chatMessages = $state(plan?.chat ?? []);
  let activeUsers = $state<number | null>(null);
  let chatSeeded = $state(false);
  const descriptionText = plan?.description ?? '';
  const descriptionShort = descriptionText.length > 180
    ? `${descriptionText.slice(0, 180).trim()}...`
    : descriptionText;

  $effect(() => {
    if (plan?.coverImage) {
      coverImage = plan.coverImage;
    }
  });

  const updatePlanFromPayload = (payload: unknown) => {
    const data =
      payload && typeof payload === 'object' && 'data' in payload
        ? (payload as { data?: unknown }).data
        : payload;
    if (!data || typeof data !== 'object') {
      return;
    }
    const planData = 'plan' in data ? (data as { plan?: unknown }).plan : data;
    if (!planData || typeof planData !== 'object') {
      return;
    }
    const coverImageOverride =
      'image_urls' in data && typeof (data as { image_urls?: { selected?: string } }).image_urls === 'object'
        ? (data as { image_urls?: { selected?: string } }).image_urls?.selected
        : undefined;
    const nextPlan = mapPlanDetailFromApi(
      planData as import('$lib/api/types').ApiPlan,
      0,
      coverImageOverride
    );
    planOverride = nextPlan;
    activities = nextPlan.activities;
    chatMessages = nextPlan.chat;
    coverImage = nextPlan.coverImage;
  };

  const buildInviteLink = (rawLink: string, planId: string, inviteId: string) => {
    const origin = browser ? window.location.origin : '';
    const fallback = origin
      ? `${origin}/plans/${planId}/invite/${inviteId}`
      : `/plans/${planId}/invite/${inviteId}`;

    if (!rawLink) {
      return fallback;
    }

    try {
      if (rawLink.startsWith('http')) {
        const url = new URL(rawLink);
        const path = url.pathname.startsWith('/plan/')
          ? url.pathname.replace(/^\/plan\//, '/plans/')
          : url.pathname;
        return origin ? `${origin}${path}${url.search}` : `${path}${url.search}`;
      }
    } catch (error) {
      return fallback;
    }

    if (rawLink.startsWith('/plan/')) {
      return origin + rawLink.replace(/^\/plan\//, '/plans/');
    }

    if (rawLink.startsWith('/plans/')) {
      return origin + rawLink;
    }

    return fallback;
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch (error) {
      // ignore clipboard errors
    }
    copiedInvite = true;
    setTimeout(() => {
      copiedInvite = false;
    }, 2000);
  };

  const loadInviteLink = async () => {
    if (isInviteLoading || inviteLink) {
      return;
    }

    inviteStatus = '';
    const planId = plan?.id;
    if (!planId) {
      inviteStatus = 'Invite link unavailable.';
      return;
    }

    isInviteLoading = true;
    try {
      const payload = await apiFetch<{ success: boolean; data?: { link?: string } }>(
        `/plan/${planId}/invite`
      );
      if (payload?.success && payload?.data?.link) {
        const rawLink = payload.data.link;
        const inviteId = payload.data.id ?? rawLink;
        const resolvedPlanId = payload.data.plan_id ?? planId;
        inviteLink = buildInviteLink(rawLink, resolvedPlanId, inviteId);
      } else {
        inviteStatus = 'Invite link unavailable.';
      }
    } catch (error) {
      inviteStatus = 'Unable to load invite link right now.';
    } finally {
      isInviteLoading = false;
    }
  };

  $effect(() => {
    if (inviteModalOpen) {
      loadInviteLink();
    }
  });

  $effect(() => {
    activities = plan?.activities ?? [];
  });

  $effect(() => {
    if (chatSeeded) {
      return;
    }
    const profileId = $page.data?.profile?.id;
    chatMessages = (plan?.chat ?? []).map((message) => ({
      ...message,
      isSelf: profileId ? message.senderId === profileId : message.isSelf
    }));
    chatSeeded = true;
  });

  $effect(() => {
    const profileId = $page.data?.profile?.id;
    if (!profileId) {
      return;
    }
    const needsUpdate = chatMessages.some(
      (message) => message.senderId && message.isSelf !== (message.senderId === profileId)
    );
    if (!needsUpdate) {
      return;
    }
    chatMessages = chatMessages.map((message) => ({
      ...message,
      isSelf: message.senderId === profileId
    }));
  });

  const handleActivityUpdate = (event: CustomEvent<import('$lib/types').Activity>) => {
    const updated = event.detail;
    activities = activities.map((activity) =>
      activity.id === updated.id ? updated : activity
    );
  };

  const handlePlanUpdate = (event: CustomEvent<import('$lib/types').Activity[]>) => {
    activities = event.detail;
  };

  const appendChatMessage = (payload: {
    sender_id: string;
    sender_name?: string;
    text: string;
    date: string;
  }) => {
    const next = {
      id: `${payload.sender_id ?? 'sender'}-${payload.date}`,
      senderId: payload.sender_id ?? undefined,
      name: payload.sender_name ?? 'Participant',
      message: payload.text,
      timestamp: payload.date ? new Date(payload.date) : null,
      isSelf: payload.sender_id === ($page.data?.profile?.id ?? '')
    };
    chatMessages = [...chatMessages, next];
  };

  const appendAnnouncement = (payload: { msg?: string }) => {
    if (!payload?.msg) {
      return;
    }
    const now = new Date().toISOString();
    chatMessages = [
      ...chatMessages,
      {
        id: `announcement-${now}`,
        senderId: 'system',
        name: 'Announcement',
        message: payload.msg,
        timestamp: new Date(now),
        isSelf: false
      }
    ];
  };

  const handleSendMessage = async (text: string) => {
    if (!canChat) {
      return;
    }
    if (!plan?.id) {
      return;
    }
    console.log('Participant chat send', { planId: plan.id, text });
    const response = await sendMessage(plan.id, text);
    console.log('Participant chat response', response);
    if (response) {
      appendChatMessage(response);
    }
  };

  let unsubscribeMessages = () => {};
  let unsubscribeUsers = () => {};
  let unsubscribeAnnouncements = () => {};
  let chatSubscribed = $state(false);
  $effect(() => {
    if (chatSubscribed) {
      return;
    }
    if (!canChat) {
      return;
    }
    const planId = plan?.id;
    if (!planId) {
      return;
    }
    joinPlan(planId);
    unsubscribeMessages = onMessage(appendChatMessage);
    unsubscribeUsers = onUsers((payload) => {
      const count =
        typeof payload?.count === 'number'
          ? payload.count
          : typeof payload?.msg === 'number'
            ? payload.msg
            : payload?.msg?.count;
      if (typeof count === 'number') {
        activeUsers = count;
      }
    });
    unsubscribeAnnouncements = onAnnouncement(appendAnnouncement);
    chatSubscribed = true;
  });

  onDestroy(() => {
    console.log('Participant chat destroy', { planId: plan?.id ?? null });
    if (canChat && plan?.id) {
      leavePlan(plan.id);
    }
    unsubscribeMessages();
    unsubscribeUsers();
    unsubscribeAnnouncements();
  });

  onMount(() => {
    const root = document.querySelector('.people-carousel-root');
    const carousel = root?.querySelector('.people-carousel');
    const dots = root?.querySelectorAll<HTMLButtonElement>('[data-target]');
    if (!root || !carousel || !dots?.length) {
      return;
    }

    const items = root.querySelectorAll<HTMLElement>('.people-snap');
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

  const handleActivityCreated = (event: CustomEvent<import('$lib/types').Activity>) => {
    const created = event.detail;
    activities = [created, ...activities];
  };

  const scrollToTop = () => {
    if (typeof window === 'undefined') {
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddActivityClick = () => {
    if (!canProposeActivities) {
      return;
    }
    if (planLocked) {
      lockedActivityNoticeOpen = true;
      return;
    }
    addActivityOpen = true;
  };

  const handleJoinPlan = async () => {
    if (!plan?.id || !canJoinPlan || isJoiningPlan) {
      return;
    }
    joinPlanError = '';
    isJoiningPlan = true;
    try {
      const response = await apiFetch(`/plan/${plan.id}/join`, { method: 'PUT' });
      updatePlanFromPayload(response);
      await goto(`/plans/${plan.id}`, {
        invalidateAll: true,
        replaceState: true
      });
    } catch (error) {
      joinPlanError = error instanceof Error ? error.message : 'Unable to join this plan right now.';
    } finally {
      isJoiningPlan = false;
    }
  };

  const openCosts = () => {
    const paymentModal = document.getElementById('payment-modal') as HTMLInputElement | null;
    if (paymentModal) {
      paymentModal.checked = true;
    }
  };

  const userTotalCost = $derived.by(() => {
    const profileId = $page.data?.profile?.id;
    if (!profileId) {
      return 0;
    }
    return activities.reduce((sum, activity) => {
      const hasVote = Array.isArray(activity.votes)
        ? activity.votes.some((vote) => vote.id === profileId)
        : false;
      const hasPaid = Array.isArray(activity.payments)
        ? activity.payments.includes(profileId)
        : false;
      return hasVote && !hasPaid ? sum + (activity.cost ?? 0) : sum;
    }, 0);
  });

  const confirmedTotalCost = $derived.by(() =>
    activities.reduce((sum, activity) => {
      const isConfirmed = activity.status?.toLowerCase() === 'confirmed';
      return isConfirmed ? sum + (activity.costTotal ?? 0) : sum;
    }, 0)
  );

  const rejectedActivities = $derived.by(() =>
    activities.filter((activity) => activity.status?.toLowerCase() === 'rejected')
  );

  const venmoHandle = plan?.organizer?.venmo ?? null;
  const amountDue = userTotalCost;
  const venmoLink = venmoHandle
    ? (() => {
        const url = new URL('https://account.venmo.com/pay');
        url.searchParams.set('audience', 'private');
        url.searchParams.set('amount', amountDue.toFixed(2));
        url.searchParams.set('note', `Plansly plan: ${plan?.title ?? 'Plan'}`);
        url.searchParams.set('recipients', venmoHandle);
        url.searchParams.set('txn', 'pay');
        return url.toString();
      })()
    : null;

  const formatTimeline = (start?: Date | null, end?: Date | null) => {
    if (start && end) {
      const startLabel = formatShortDate(start);
      const endLabel = formatShortDate(end);
      return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
    }
    if (start) {
      return formatShortDate(start);
    }
    if (end) {
      return formatShortDate(end);
    }
    return 'Timeline TBD';
  };

  const formatCountdown = (start?: Date | null) => {
    if (!start) {
      return 'TBD';
    }
    const diffMs = start.getTime() - Date.now();
    if (diffMs <= 0) {
      return 'Started';
    }
    const minutes = Math.ceil(diffMs / 60000);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.ceil(diffMs / 3600000);
    if (hours < 24) {
      return `${hours} hr`;
    }
    const days = Math.ceil(diffMs / 86400000);
    return `${days} day${days === 1 ? '' : 's'}`;
  };

  const copyVenmoHandle = async () => {
    try {
      await navigator.clipboard.writeText(venmoHandle);
    } catch (error) {
      // Fallback to still show feedback even if clipboard is blocked.
    }
    copiedVenmo = true;
    setTimeout(() => {
      copiedVenmo = false;
    }, 2000);
  };

  const handleMarkPaid = async () => {
    if (!plan?.id) {
      return;
    }
    try {
      const response = await apiFetch(`/plan/${plan.id}/pay`, { method: 'PUT' });
      updatePlanFromPayload(response);
      console.log('Payment success modal opening');
      paymentSuccessOpen = true;
      setTimeout(async () => {
        console.log('Payment success modal closing');
        paymentSuccessOpen = false;
        const paymentModal = document.getElementById('payment-modal') as HTMLInputElement | null;
        if (paymentModal) {
          paymentModal.checked = false;
        }
        try {
          await invalidate(`${getBackendBaseUrl()}/plan/${plan.id}`);
        } finally {
          planOverride = null;
        }
      }, 1500);
    } catch (error) {
      // TODO: surface error if needed
    }
  };
</script>

<div>
  <AppNav />
  <main class="mx-auto w-full max-w-7xl px-6 lg:px-16 pb-20">
    <section class="section-spacing space-y-8">
      {#if statusMessage}
        <div class="alert alert-info text-sm">{statusMessage}</div>
      {:else if plan}
        <div class="space-y-2 md:space-y-4">
          <PlanHeader
            title={plan.title}
            dateRange={formatTimeline(plan.startDay ?? null, plan.endDay ?? null)}
            location={plan.location}
            planStatus={plan.status}
            showFinalize={false}
            showInvite={canChat}
            showMeta={false}
          />
          <div class="card plan-glass shadow-sm">
            <div class="card-body">
              <div class="group relative overflow-hidden rounded-2xl border border-base-200">
                <img
                  class="h-48 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src={coverImage || plan.coverImage}
                  alt={plan.title}
                />
                <div class="cover-overlay absolute inset-0"></div>
              </div>
              <div class="mt-4 flex items-center gap-3">
                <Avatar
                  initials={hostInitials}
                  size="lg"
                  status="none"
                  imageUrl={plan.organizer?.picture ?? undefined}
                  innerClass="bg-primary/15 text-primary"
                />
                <div class="text-sm">
                  <p class="text-base-content/60">Hosted by</p>
                  <p class="font-semibold">{host?.name ?? 'Plan Organizer'}</p>
                </div>
              </div>
              <div class="mt-4 flex items-center gap-2 text-primary">
                <span class="material-symbols-outlined text-xl">description</span>
                <h3 class="text-sm font-semibold uppercase tracking-widest">Plan description</h3>
              </div>
                <p class="text-sm description-text">
                  {detailsExpanded ? descriptionText : descriptionShort}
                </p>
              {#if descriptionText.length > 180}
                <button
                  class="btn btn-xs btn-ghost text-primary mt-2"
                  type="button"
                  on:click={() => (detailsExpanded = !detailsExpanded)}
                >
                  {detailsExpanded ? 'Read less' : 'Read more'}
                </button>
              {/if}
              <div class="mt-5 grid gap-4 md:grid-cols-2">
                <div class="rounded-2xl border border-base-200 p-4 plan-glass">
                  <div class="flex items-center gap-2 text-xs uppercase tracking-wide text-primary">
                    <span class="material-symbols-outlined text-base">calendar_month</span>
                    <span>When</span>
                  </div>
                  <p class="mt-2 text-2xl font-black text-base-content">
                    {formatTimeline(plan.startDay ?? null, plan.endDay ?? null)}
                  </p>
                </div>
                <div class="rounded-2xl border border-base-200 p-4 plan-glass">
                  <div class="flex items-center gap-2 text-xs uppercase tracking-wide text-primary">
                    <span class="material-symbols-outlined text-base">location_on</span>
                    <span>Where</span>
                  </div>
                  <p class="mt-2 text-2xl font-black text-base-content">
                    {plan.location}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {#if planLocked}
          <div class="card plan-glass shadow-sm">
            <div class="card-body flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                {#if userTotalCost === 0}
                  <h3 class="text-lg font-semibold">You’re all settled!</h3>
                  <p class="text-sm text-base-content/60">No payment is due right now.</p>
                {:else}
                  <h3 class="text-lg font-semibold">Plan locked - payment required</h3>
                  <p class="text-sm text-base-content/60">Complete your buy-in to confirm your spot.</p>
                {/if}
              </div>
              {#if userTotalCost > 0}
                <label class="btn btn-primary" for="payment-modal">Pay Now</label>
              {/if}
            </div>
          </div>
        {/if}
        <div id="plan-stats">
          <PlanStats
            budget={confirmedTotalCost}
            collected={plan.raised}
            perPerson={userTotalCost}
            countdown={formatCountdown(plan.startDay ?? null)}
          />
        </div>
        {#if canJoinPlan}
          <div class="card plan-glass shadow-sm">
            <div class="card-body lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 class="text-lg font-semibold">Join this public plan</h3>
                <p class="text-sm text-base-content/70">
                  Join to unlock chat and voting on proposed activities.
                </p>
                {#if joinPlanError}
                  <p class="mt-2 text-xs text-error">{joinPlanError}</p>
                {/if}
              </div>
              <button class="btn btn-primary" type="button" on:click={handleJoinPlan} disabled={isJoiningPlan}>
                {isJoiningPlan ? 'Joining...' : 'Join Plan'}
              </button>
            </div>
          </div>
        {/if}

        <div class="card plan-glass shadow-sm lg:hidden people-carousel-root">
          <div class="card-body gap-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-primary">People ({plan.participants.length})</h3>
              {#if canChat}
                <label class="btn btn-xs btn-primary" for="invite-modal">Invite friends</label>
              {/if}
            </div>
            <div class="carousel w-full people-carousel">
              {#each plan.participants as person, index}
                <div id={`participant-${index}`} class="carousel-item w-full justify-center people-snap">
                  <div class="flex w-full max-w-sm mx-auto items-center gap-3 rounded-2xl border border-base-200 px-3 py-2 plan-glass">
                    <Avatar
                      initials={person.name.slice(0, 1)}
                      status="online"
                      imageUrl={person.avatar ?? null}
                    />
                    <div>
                      <p class="font-semibold text-sm">{person.name}</p>
                      {#if person.status === 'organizer'}
                        <span class="badge badge-success badge-xs">Organizer</span>
                      {:else}
                        <p class="text-xs text-base-content/60">
                          {person.status === 'admin' ? 'Admin' : 'Participant'}
                        </p>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
            <div class="flex justify-center gap-2 pt-1">
              {#each plan.participants as _, index}
                <button
                  class="h-2 w-2 rounded-full bg-secondary/60"
                  type="button"
                  data-target={`participant-${index}`}
                ></button>
              {/each}
            </div>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div class="space-y-6">
            <ItineraryTimeline
              activities={activities}
              planStatus={plan.status}
              addTargetId={canProposeActivities ? 'add-activity-modal' : undefined}
              allowVote={canVote}
              emphasizeAdd={true}
              on:activityUpdate={handleActivityUpdate}
              on:planUpdate={handlePlanUpdate}
            />
          </div>
          <div class="space-y-6">
            <div class="hidden lg:block">
              <ParticipantsCard participants={plan.participants} showManage={false}>
                <svelte:fragment slot="action">
                  {#if canChat}
                    <label class="btn btn-xs btn-primary" for="invite-modal">Invite friends</label>
                  {/if}
                </svelte:fragment>
              </ParticipantsCard>
            </div>
            {#if canChat}
            <div class="hidden lg:block">
              <ChatPanel
                messages={chatMessages}
                activeUsers={activeUsers}
                on:send={(event) => handleSendMessage(event.detail)}
              />
            </div>
            {/if}
        </div>
      </div>

        <ProposedActivities
          activities={rejectedActivities}
          profileId={$page.data?.profile?.id ?? null}
        />
      {/if}
    </section>

    <input id="payment-modal" type="checkbox" class="modal-toggle" />
    <div class="modal" role="dialog">
      <div class="modal-box">
        <h3 class="text-lg font-semibold mb-4">Payment Details</h3>
        <div class="space-y-3">
          <div class="rounded-2xl border border-base-200 p-4">
            <p class="text-sm text-base-content/60">Organizer</p>
            <p class="font-semibold">{host?.name ?? 'Plan Organizer'}</p>
            {#if venmoHandle}
              <p class="text-sm text-base-content/60">
                Venmo:
                {#if venmoLink}
                  <a class="link link-hover text-primary" href={venmoLink} target="_blank" rel="noreferrer">
                    {venmoHandle}
                  </a>
                {:else}
                  {venmoHandle}
                {/if}
              </p>
              <button class="btn btn-xs btn-outline mt-3" on:click={copyVenmoHandle}>
                {copiedVenmo ? 'Handle copied' : 'Copy Venmo handle'}
              </button>
            {:else}
              <p class="text-sm text-base-content/60">Venmo handle not available.</p>
            {/if}
          </div>
          <div class="rounded-2xl border border-base-200 p-4">
            <p class="text-sm text-base-content/60">Amount due</p>
            <p class="text-2xl font-semibold text-primary">
              ${userTotalCost.toFixed(2)}
            </p>
          </div>
        </div>
        {#if !planLocked}
          <p class="text-xs text-base-content/60 mt-3">
            Mark as paid will be available once the plan is locked.
          </p>
        {/if}
        <div class="modal-action">
          <label for="payment-modal" class="btn btn-outline">Close</label>
          <button
            class={`btn btn-primary ${planLocked ? '' : 'btn-disabled opacity-60'}`}
            type="button"
            disabled={!planLocked}
            on:click={handleMarkPaid}
          >
            Mark as Paid
          </button>
        </div>
      </div>
      <label class="modal-backdrop" for="payment-modal">Close</label>
    </div>

    <PaymentSuccessModal
      open={paymentSuccessOpen}
    />

    {#if canChat}
      <input id="invite-modal" type="checkbox" class="modal-toggle" bind:checked={inviteModalOpen} />
      <div class="modal" role="dialog">
        <div class="modal-box text-center relative">
          <label for="invite-modal" class="btn btn-ghost btn-sm absolute right-3 top-3">✕</label>
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span class="text-xl">+</span>
          </div>
          <h3 class="text-lg font-semibold mt-4">Invite Friends</h3>
          <p class="text-sm text-base-content/70 mt-1">
            Send this link to friends so they can join the plan.
          </p>
          <input
            class="mt-4 input input-bordered w-full text-sm font-medium"
            readonly
            value={
              inviteLink
                ? inviteLink.replace('https://', '')
                : isInviteLoading
                  ? 'Loading invite link...'
                  : 'Invite link unavailable'
            }
          />
          {#if inviteStatus}
            <p class="text-xs text-error mt-2">{inviteStatus}</p>
          {/if}
          <button class="btn btn-primary w-full mt-4" on:click={copyInviteLink} disabled={!inviteLink}>
            {copiedInvite ? 'Copied' : 'Copy link'}
          </button>
        </div>
        <label class="modal-backdrop" for="invite-modal">Close</label>
      </div>
    {/if}

    <!-- Leave plan modal intentionally disabled -->

    {#if canProposeActivities}
      <AddActivityModal
        planId={plan?.id ?? null}
        planStartDay={plan?.startDay ?? null}
        planEndDay={plan?.endDay ?? null}
        modalId="add-activity-modal"
        bind:open={addActivityOpen}
        on:activityCreated={handleActivityCreated}
      />
    {/if}

    {#if lockedActivityNoticeOpen}
      <div class="modal modal-open" role="dialog">
        <div class="modal-box">
          <h3 class="text-lg font-semibold mb-2">Unable to create activity</h3>
          <p class="text-sm text-base-content/70">This plan is locked, so activities can’t be added.</p>
          <div class="modal-action">
            <button class="btn btn-primary" type="button" on:click={() => (lockedActivityNoticeOpen = false)}>
              Okay
            </button>
          </div>
        </div>
        <div class="modal-backdrop" on:click={() => (lockedActivityNoticeOpen = false)}></div>
      </div>
    {/if}
  </main>

  {#if canChat}
    <button
      class="btn btn-circle btn-primary fixed bottom-24 right-6 shadow-lg lg:hidden"
      type="button"
      on:click={() => (chatOpen = true)}
    >
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M7 11h10v2H7v-2Zm0-4h10v2H7V7Zm12-4H5a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h3.5l3.2 2.4a1 1 0 0 0 1.6-.8V19H19a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3Z" />
      </svg>
    </button>
  {/if}

  {#if canChat && chatOpen}
    <div class="modal modal-open" role="dialog">
      <div class="modal-box max-w-sm">
        <ChatPanel
          messages={chatMessages}
          activeUsers={activeUsers}
          on:send={(event) => handleSendMessage(event.detail)}
        />
        <div class="modal-action">
          <button class="btn btn-outline" type="button" on:click={() => (chatOpen = false)}>
            Close
          </button>
        </div>
      </div>
      <div class="modal-backdrop" on:click={() => (chatOpen = false)}></div>
    </div>
  {/if}

  <div class="fixed inset-x-0 bottom-0 z-40 border-t border-base-200 bg-base-100 px-4 py-3 lg:hidden">
    <div class="flex items-center justify-around">
      <button class="btn btn-ghost" type="button" on:click={scrollToTop}>Plan</button>
      {#if canProposeActivities}
        <button
          class="btn btn-circle btn-primary"
          type="button"
          on:click={handleAddActivityClick}
        >
          +
        </button>
      {:else}
        <span class="inline-block w-10"></span>
      {/if}
      <button class="btn btn-ghost" type="button" on:click={openCosts}>Costs</button>
    </div>
  </div>
</div>

<style>
  :global(.people-carousel-root .people-carousel) {
    scroll-snap-type: x mandatory;
  }
  :global(.people-carousel-root .people-snap) {
    scroll-snap-align: center;
  }
</style>
