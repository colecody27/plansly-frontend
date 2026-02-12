<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import AppNav from '$lib/components/AppNav.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import PlanHeader from '$lib/components/PlanHeader.svelte';
  import CoverImageModal from '$lib/components/CoverImageModal.svelte';
  import PlanStats from '$lib/components/PlanStats.svelte';
  import ItineraryTimeline from '$lib/components/ItineraryTimeline.svelte';
  import ParticipantsCard from '$lib/components/ParticipantsCard.svelte';
  import ChatPanel from '$lib/components/ChatPanel.svelte';
  import AddActivityModal from '$lib/components/AddActivityModal.svelte';
  import ProposedActivities from '$lib/components/ProposedActivities.svelte';
  import { joinPlan, leavePlan, onAnnouncement, onMessage, onUsers, sendMessage } from '$lib/socket';
  import LocationAutocomplete from '$lib/components/LocationAutocomplete.svelte';
  import type { Activity } from '$lib/types';
  import { formatShortDate } from '$lib/models/plan';
  import { apiFetch, getBackendBaseUrl } from '$lib/api/client';
  import { finalizePlanImageUpload } from '$lib/api/plans';
  import { invalidate } from '$app/navigation';
  import { browser } from '$app/environment';

  const props = $props();
  const venmoHandle = props.data.profile?.venmoHandle ?? '';
  const hostName = props.data.profile?.name ?? 'Plan Organizer';
  const hostAvatar = props.data.profile?.avatar ?? null;
  const hostInitials = hostName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'PO';
  const hostId = props.data.profile?.id ?? null;
  const hostParticipant = {
    id: hostId ?? 'host',
    name: hostName,
    avatar: hostAvatar ?? undefined,
    status: 'organizer' as const
  };
  let inviteLink = $state('');
  let inviteStatus = $state('');
  let isInviteLoading = $state(false);
  let inviteModalOpen = $state(false);
  let copiedInvite = $state(false);
  let addActivityOpen = $state(false);
  let chatOpen = $state(false);
  let lockedActivityNoticeOpen = $state(false);
  let detailsExpanded = $state(false);
  let isEditing = $state(false);
  let isPlanSaving = $state(false);
  let isPlanLocking = $state(false);
  let planSaveError = $state('');
  let planLockError = $state('');
  let participantManageError = $state('');
  let promotingParticipantId = $state<string | null>(null);
  let coverSaveError = $state('');
  let planDateError = $state('');
  let planTitle = $state(props.data.plan?.title ?? '');
  let planDescription = $state(props.data.plan?.description ?? '');
  let planLocation = $state(props.data.plan?.location ?? '');
  let planCountry = $state(props.data.plan?.country ?? '');
  let planState = $state(props.data.plan?.state ?? '');
  let planCity = $state(props.data.plan?.city ?? '');
  let planStartDate = $state<Date | null>(props.data.plan?.startDay ?? null);
  let planEndDate = $state<Date | null>(props.data.plan?.endDay ?? null);
  let coverImage = $state(props.data.plan?.coverImage ?? '');
  let coverModalOpen = $state(false);
  $effect(() => {
    if (!coverModalOpen && props.data.plan?.coverImage) {
      coverImage = props.data.plan.coverImage;
    }
  });
  let itineraryTimeline: { openActivityModal: (activity: Activity) => void } | null = null;
  let rejectedCarousel: HTMLDivElement | null = null;
  let activities = $state(props.data.plan?.activities ?? []);
  let chatMessages = $state(props.data.plan?.chat ?? []);
  let activeUsers = $state<number | null>(null);
  let chatSeeded = $state(false);
  const descriptionShort = $derived.by(() =>
    planDescription.length > 180
      ? `${planDescription.slice(0, 180).trim()}...`
      : planDescription
  );
  const descriptionTooLong = $derived.by(() => planDescription.length > 180);
  let originalPlan = $state({
    title: planTitle,
    description: planDescription,
    location: planLocation,
    country: planCountry,
    state: planState,
    city: planCity,
    startDay: planStartDate,
    endDay: planEndDate
  });

  const saveCoverImage = async (detail: { imageId?: string; imageKey?: string; previewUrl?: string }) => {
    const planId = props.data.plan?.id;
    if (!planId) {
      coverSaveError = 'Plan is unavailable.';
      return;
    }
    coverSaveError = '';
    try {
      if (detail.imageId) {
        await finalizePlanImageUpload(detail.imageId, { plan_id: planId });
      } else if (detail.imageKey) {
        await apiFetch(`/plan/${planId}/update`, {
          method: 'PUT',
          body: JSON.stringify({
            image_key: detail.imageKey
          })
        });
      } else {
        coverSaveError = 'Select an image before saving.';
        return;
      }
      coverImage = detail.previewUrl || coverImage;
      coverModalOpen = false;
      await invalidate(`${getBackendBaseUrl()}/plan/${planId}`);
    } catch (error) {
      coverSaveError = error instanceof Error ? error.message : 'Unable to update cover.';
    }
  };

  const formatTimeline = () => {
    const start = planStartDate ?? null;
    const end = planEndDate ?? null;
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

  const openRejectedActivity = (activity: Activity) => {
    if (!hostId || activity.proposerId !== hostId || !itineraryTimeline) {
      return;
    }
    itineraryTimeline.openActivityModal(activity);
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

  onMount(async () => {
    await import('cally');
  });

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const parseLocalDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
      return null;
    }
    return new Date(year, month - 1, day);
  };
  const normalizeCalendarDate = (value: Date) =>
    new Date(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
  const minSelectableDate = formatDate(new Date());

  const handlePlanRangeStart = (event: CustomEvent<Date>) => {
    const today = startOfDay(new Date());
    const selected = startOfDay(normalizeCalendarDate(event.detail));
    if (selected < today) {
      planDateError = 'Start date cannot be in the past.';
      return;
    }
    planDateError = '';
    planStartDate = selected;
    planEndDate = null;
  };

  const handlePlanRangeEnd = (event: CustomEvent<Date>) => {
    const selectedEnd = startOfDay(normalizeCalendarDate(event.detail));
    if (planStartDate) {
      const selectedStart = startOfDay(planStartDate);
      if (selectedEnd < selectedStart) {
        planDateError = 'End date cannot be before the start date.';
        return;
      }
    }
    planDateError = '';
    planEndDate = selectedEnd;
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch (error) {
      // Fallback to still show feedback even if clipboard is blocked.
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
    const planId = props.data.plan?.id;
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

  const syncPlanFromProps = () => {
    if (!props.data.plan || isEditing) {
      return;
    }
    planTitle = props.data.plan.title ?? '';
    planDescription = props.data.plan.description ?? '';
    planLocation = props.data.plan.location ?? '';
    planCountry = props.data.plan.country ?? '';
    planState = props.data.plan.state ?? '';
    planCity = props.data.plan.city ?? '';
    planStartDate = props.data.plan.startDay ?? null;
    planEndDate = props.data.plan.endDay ?? null;
    originalPlan = {
      title: planTitle,
      description: planDescription,
      location: planLocation,
      country: planCountry,
      state: planState,
      city: planCity,
      startDay: planStartDate,
      endDay: planEndDate
    };
  };

  $effect(syncPlanFromProps);
  $effect(() => {
    activities = props.data.plan?.activities ?? [];
  });

  $effect(() => {
    if (chatSeeded) {
      return;
    }
    const profileId = props.data.profile?.id;
    chatMessages = (props.data.plan?.chat ?? []).map((message) => ({
      ...message,
      isSelf: profileId ? message.senderId === profileId : message.isSelf
    }));
    chatSeeded = true;
  });

  $effect(() => {
    const profileId = props.data.profile?.id;
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

  const handleActivityUpdate = (event: CustomEvent<Activity>) => {
    const updated = event.detail;
    activities = activities.map((activity) =>
      activity.id === updated.id ? updated : activity
    );
  };

  const handlePlanUpdate = (event: CustomEvent<Activity[]>) => {
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
      isSelf: payload.sender_id === (props.data.profile?.id ?? '')
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
    const planId = props.data.plan?.id;
    if (!planId) {
      return;
    }
    console.log('Organizer chat send', { planId, text });
    const response = await sendMessage(planId, text);
    console.log('Organizer chat response', response);
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
    const planId = props.data.plan?.id;
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
    console.log('Organizer chat destroy', { planId: props.data.plan?.id ?? null });
    if (props.data.plan?.id) {
      leavePlan(props.data.plan.id);
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

  const handleActivityCreated = (event: CustomEvent<Activity>) => {
    const created = event.detail;
    activities = [created, ...activities];
  };

  const togglePlanLock = async () => {
    const planId = props.data.plan?.id;
    if (!planId || isPlanLocking) {
      return;
    }
    planLockError = '';
    isPlanLocking = true;
    try {
      await apiFetch(`/plan/${planId}/lock-toggle`, { method: 'PUT' });
      await invalidate(`${getBackendBaseUrl()}/plan/${planId}`);
    } catch (error) {
      planLockError = error instanceof Error ? error.message : 'Unable to update plan status.';
    } finally {
      isPlanLocking = false;
    }
  };

  const toDay = (value: Date | null) => (value ? formatDate(value) : null);

  const scrollToTop = () => {
    if (typeof window === 'undefined') {
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddActivityClick = () => {
    if (isPlanLocked) {
      lockedActivityNoticeOpen = true;
      return;
    }
    addActivityOpen = true;
  };

  const setParticipantAdminState = async (participantId: string, isCurrentlyAdmin: boolean) => {
    const planId = props.data.plan?.id;
    if (!planId || !participantId || promotingParticipantId) {
      return;
    }
    participantManageError = '';
    promotingParticipantId = participantId;
    try {
      await apiFetch(`/plan/${planId}/admin/${participantId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_admin: !isCurrentlyAdmin })
      });
      await invalidate(`${getBackendBaseUrl()}/plan/${planId}`);
    } catch (error) {
      participantManageError =
        error instanceof Error ? error.message : 'Unable to update participant role.';
    } finally {
      promotingParticipantId = null;
    }
  };

  const openCosts = () => {
    if (typeof window === 'undefined') {
      return;
    }
    const modalInput = document.getElementById('payment-tracker-modal') as HTMLInputElement | null;
    if (modalInput) {
      modalInput.checked = true;
    }
  };

  const savePlan = async () => {
    if (isPlanSaving) {
      return;
    }
    planSaveError = '';
    if (planDateError) {
      return;
    }
    const planId = props.data.plan?.id;
    if (!planId) {
      planSaveError = 'Plan is unavailable.';
      return;
    }
    if (planStartDate) {
      const today = startOfDay(new Date());
      const selected = startOfDay(planStartDate);
      if (selected < today) {
        planDateError = 'Start date cannot be in the past.';
        return;
      }
    }
    if (planStartDate && planEndDate) {
      const selectedStart = startOfDay(planStartDate);
      const selectedEnd = startOfDay(planEndDate);
      if (selectedStart > selectedEnd) {
        planDateError = 'End date cannot be before the start date.';
        return;
      }
    }

    const updates: Record<string, unknown> = {};
    if (planTitle.trim() !== originalPlan.title) {
      updates.name = planTitle.trim();
    }
    if (planDescription.trim() !== originalPlan.description) {
      updates.description = planDescription.trim();
    }
    if (planLocation.trim() !== originalPlan.location) {
      updates.location = planLocation.trim();
    }
    if (planCountry.trim() !== originalPlan.country) {
      updates.country = planCountry.trim() || undefined;
    }
    if (planState.trim() !== originalPlan.state) {
      updates.state = planState.trim() || undefined;
    }
    if (planCity.trim() !== originalPlan.city) {
      updates.city = planCity.trim() || undefined;
    }
    const nextStart = toDay(planStartDate);
    const nextEnd = toDay(planEndDate);
    if (nextStart !== toDay(originalPlan.startDay)) {
      updates.start_day = nextStart;
    }
    if (nextEnd !== toDay(originalPlan.endDay)) {
      updates.end_day = nextEnd;
    }

    if (!Object.keys(updates).length) {
      isEditing = false;
      return;
    }

    isPlanSaving = true;
    try {
      await apiFetch(`/plan/${planId}/update`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      await invalidate(`${getBackendBaseUrl()}/plan/${planId}`);
      originalPlan = {
        title: planTitle.trim(),
        description: planDescription.trim(),
        location: planLocation.trim(),
        country: planCountry.trim(),
        state: planState.trim(),
        city: planCity.trim(),
        startDay: planStartDate,
        endDay: planEndDate
      };
      isEditing = false;
    } catch (error) {
      planSaveError = error instanceof Error ? error.message : 'Unable to save plan.';
    } finally {
      isPlanSaving = false;
    }
  };

  const participantsWithHost = $derived.by(() => {
    const participants = props.data.plan?.participants ?? [];
    const hasHost = participants.some((participant) => {
      if (hostId && participant.id === hostId) {
        return true;
      }
      if (participant.status === 'organizer') {
        return true;
      }
      return participant.name === hostName;
    });
    return hasHost ? participants : [hostParticipant, ...participants];
  });

  const isPlanLocked = $derived.by(
    () => (props.data.plan?.status ?? '').toLowerCase() === 'locked'
  );

  const userTotalCost = $derived.by(() => {
    const profileId = props.data.profile?.id;
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

  let paymentSearch = $state('');
  const paymentRows = $derived.by(() => {
    const term = paymentSearch.trim().toLowerCase();
    return participantsWithHost
      .map((person) => {
        const participantId = person.id;
        const totals = activities.reduce(
          (sum, activity) => {
            if (!participantId) {
              return sum;
            }
            const hasVote = Array.isArray(activity.votes)
              ? activity.votes.some((vote) => vote.id === participantId)
              : false;
            if (!hasVote) {
              return sum;
            }
            const cost = activity.cost ?? 0;
            const hasPaid = Array.isArray(activity.payments)
              ? activity.payments.includes(participantId)
              : false;
            sum.total += cost;
            if (hasPaid) {
              sum.paid += cost;
            } else {
              sum.due += cost;
            }
            return sum;
          },
          { total: 0, paid: 0, due: 0 }
        );
        return {
          id: participantId ?? person.name,
          name: person.name,
          avatar: person.avatar ?? null,
          role:
            person.status === 'organizer'
              ? 'Organizer'
              : person.status === 'admin'
                ? 'Admin'
                : 'Participant',
          total: totals.total,
          paid: totals.paid,
          due: totals.due
        };
      })
      .filter((row) => (term ? row.name.toLowerCase().includes(term) : true));
  });
  const paymentCollected = $derived.by(() => props.data.plan?.raised ?? 0);
  const paymentGoal = $derived.by(() => confirmedTotalCost);
  const paymentPercent = $derived.by(() =>
    paymentGoal > 0 ? Math.min(100, Math.round((paymentCollected / paymentGoal) * 100)) : 0
  );
</script>

<div>
  <AppNav />
  <main class="mx-auto w-full max-w-7xl px-6 lg:px-16 pb-20">
    <section class="section-spacing space-y-8">
      {#if props.data.statusMessage}
        <div class="alert alert-error text-sm">
          {props.data.statusMessage}
        </div>
      {:else if props.data.plan}
        <PlanHeader
          title={planTitle}
          dateRange={formatTimeline()}
          location={planLocation}
          planStatus={props.data.plan.status}
          extraActionLabel="Track Payments"
          extraActionTargetId="payment-tracker-modal"
          extraActionVariant="outline"
          extraActionClass="hidden lg:inline-flex"
          inviteTargetId="invite-modal"
          showMeta={false}
          onInvite={loadInviteLink}
          finalizeLabel={isPlanLocked ? 'Unlock Plan' : 'Finalize Plan'}
          finalizeDisabled={isPlanLocking}
          onFinalize={togglePlanLock}
        >
          <button
            slot="edit-action"
            class={`btn ${isEditing ? 'btn-primary' : 'btn-outline'}`}
            type="button"
            on:click={() => {
              if (isEditing) {
                savePlan();
              } else {
                isEditing = true;
              }
            }}
            disabled={isPlanSaving}
          >
            {isEditing ? (isPlanSaving ? 'Saving...' : 'Save') : 'Edit Plan'}
          </button>
        </PlanHeader>
        {#if planSaveError}
          <div class="alert alert-error text-sm">{planSaveError}</div>
        {/if}
        {#if planLockError}
          <div class="alert alert-error text-sm">{planLockError}</div>
        {/if}
        {#if isEditing}
          <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
            <label class="form-control">
              <span class="label-text">Plan title</span>
              <input class="input input-bordered" bind:value={planTitle} />
            </label>
          </div>
        {/if}
        <div class="card plan-glass shadow-sm">
          <div class="card-body">
            <div class="group relative overflow-hidden rounded-2xl border border-base-200">
              <img
                class="h-48 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                src={coverImage || props.data.plan.coverImage}
                alt="Plan cover"
              />
              <div class="cover-overlay absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <button
                  class="btn btn-sm cover-change-btn shadow-lg"
                  type="button"
                  on:click={() => (coverModalOpen = true)}
                >
                  <span class="material-symbols-outlined text-lg">add_a_photo</span>
                  Change cover
                </button>
              </div>
            </div>
            {#if coverSaveError}
              <div class="alert alert-error text-sm mt-3">{coverSaveError}</div>
            {/if}
            <div class="mt-4 flex items-center gap-3">
              <Avatar
                initials={hostInitials}
                size="lg"
                status="none"
                imageUrl={hostAvatar}
                innerClass="bg-primary/15 text-primary ring-2 ring-primary/30"
              />
              <div class="text-sm">
                <p class="text-base-content/60">Hosted by</p>
                <p class="font-semibold">{hostName}</p>
              </div>
            </div>
            <div class="mt-4 flex items-center gap-2 text-primary">
              <span class="material-symbols-outlined text-xl">description</span>
              <h3 class="text-sm font-semibold uppercase tracking-widest">Plan description</h3>
            </div>
            {#if isEditing}
              <textarea class="textarea textarea-bordered h-28" bind:value={planDescription}></textarea>
            {:else}
                <p class="text-sm description-text">
                  {detailsExpanded ? planDescription : descriptionShort}
                </p>
              {#if descriptionTooLong}
                <button
                  class="btn btn-xs btn-ghost text-primary mt-2"
                  type="button"
                  on:click={() => (detailsExpanded = !detailsExpanded)}
                >
                  {detailsExpanded ? 'Read less' : 'Read more'}
                </button>
              {/if}
            {/if}
            <div class="mt-5 grid gap-4 md:grid-cols-2">
              <div class="rounded-2xl border border-base-200 p-4 plan-glass">
                <div class="flex items-center gap-2 text-xs uppercase tracking-wide text-primary">
                  <span class="material-symbols-outlined text-base">calendar_month</span>
                  <span>When</span>
                </div>
                {#if isEditing}
                  <div class="mt-3 space-y-3">
                    <div class="rounded-2xl border border-base-200 p-3 flex justify-center">
                      <calendar-range
                        months={1}
                        min={minSelectableDate}
                        page-by="single"
                        on:rangestart={handlePlanRangeStart}
                        on:rangeend={handlePlanRangeEnd}
                      >
                        <calendar-month></calendar-month>
                      </calendar-range>
                    </div>
                    {#if planDateError}
                      <p class="text-xs text-error">{planDateError}</p>
                    {/if}
                    <div class="grid gap-3 md:grid-cols-2">
                      <label class="form-control">
                        <span class="label-text">Start day</span>
                        <input
                          class="input input-bordered"
                          type="text"
                          readonly
                          value={planStartDate ? formatShortDate(planStartDate) : 'Select start day'}
                        />
                      </label>
                      <label class="form-control">
                        <span class="label-text">End day</span>
                        <input
                          class="input input-bordered"
                          type="text"
                          readonly
                          value={planEndDate ? formatShortDate(planEndDate) : 'Select end day'}
                        />
                      </label>
                    </div>
                  </div>
                {:else}
                  <p class="mt-2 text-2xl font-black text-base-content">{formatTimeline()}</p>
                {/if}
              </div>
              <div class="rounded-2xl border border-base-200 p-4 plan-glass">
                <div class="flex items-center gap-2 text-xs uppercase tracking-wide text-primary">
                  <span class="material-symbols-outlined text-base">location_on</span>
                  <span>Where</span>
                </div>
                {#if isEditing}
                  <div class="mt-3">
                    <LocationAutocomplete
                      label="Location"
                      bind:location={planLocation}
                      bind:country={planCountry}
                      bind:state={planState}
                      bind:city={planCity}
                      singleInput={true}
                      idPrefix="plan-edit-location"
                    />
                  </div>
                {:else}
                  <p class="mt-2 text-2xl font-black text-base-content">{planLocation}</p>
                {/if}
              </div>
            </div>
          </div>
        </div>
        {#if !venmoHandle}
          <div class="alert alert-warning">
            <span>
              Add your handle to enable participant payouts.
              <a class="link link-hover ml-1" href="/profile">Update profile</a>
            </span>
          </div>
        {/if}
        <div id="plan-stats">
          <PlanStats
            budget={confirmedTotalCost}
            collected={props.data.plan.raised}
            perPerson={userTotalCost}
            countdown={formatCountdown(planStartDate)}
          />
        </div>

        <div class="card plan-glass shadow-sm lg:hidden people-carousel-root">
          <div class="card-body gap-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="text-lg font-semibold text-primary">People ({participantsWithHost.length})</h3>
              <div class="flex items-center gap-2">
                <label class="btn btn-xs btn-primary" for="invite-modal">Invite friends</label>
                <label class="btn btn-xs btn-ghost text-primary" for="manage-participants-modal">Manage</label>
              </div>
            </div>
            <div class="carousel w-full people-carousel">
              {#each participantsWithHost as person, index}
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
              {#each participantsWithHost as _, index}
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
              planStatus={props.data.plan.status}
              addTargetId="add-activity-modal"
              emphasizeAdd={true}
              showFinalizeActivity={true}
              bind:this={itineraryTimeline}
              on:activityUpdate={handleActivityUpdate}
              on:planUpdate={handlePlanUpdate}
            />
          </div>
          <div class="space-y-6">
            <div class="hidden lg:block">
              <ParticipantsCard
                participants={participantsWithHost}
                manageTargetId="manage-participants-modal"
              />
            </div>
            <div class="hidden lg:block">
              <ChatPanel
                messages={chatMessages}
                activeUsers={activeUsers}
                on:send={(event) => handleSendMessage(event.detail)}
              />
            </div>
          </div>
        </div>

        <ProposedActivities
          activities={rejectedActivities}
          profileId={hostId}
          onSelect={(activity) => {
            if (hostId && activity.proposerId === hostId) {
              openRejectedActivity(activity);
            }
          }}
          showScrollControls={true}
        />
      {/if}
    </section>

    <input id="manage-participants-modal" type="checkbox" class="modal-toggle" />
    <div class="modal" role="dialog">
      <div class="modal-box">
        <h3 class="text-lg font-semibold mb-4">Manage Participants</h3>
        {#if participantManageError}
          <div class="alert alert-error text-sm mb-3">{participantManageError}</div>
        {/if}
        <div class="space-y-3">
          {#if props.data.plan}
            {#each participantsWithHost as person}
            <div class="flex items-center justify-between rounded-2xl border border-base-200 p-3">
              <div class="flex items-center gap-3">
                <Avatar
                  initials={person.name.slice(0, 1)}
                  status="none"
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
              <div class="flex items-center gap-2">
                {#if props.data.plan?.isPublic && person.status !== 'organizer'}
                  <button
                    class="btn btn-xs btn-outline"
                    type="button"
                    on:click={() => setParticipantAdminState(person.id, person.status === 'admin')}
                    disabled={promotingParticipantId === person.id}
                  >
                    {promotingParticipantId === person.id
                      ? 'Updating...'
                      : person.status === 'admin'
                        ? 'Make Participant'
                        : 'Make Admin'}
                  </button>
                {/if}
                {#if person.status !== 'organizer'}
                  <label class="btn btn-xs btn-outline text-error" for="remove-participant-modal">
                    Remove
                  </label>
                {/if}
              </div>
            </div>
            {/each}
          {/if}
        </div>
        <div class="modal-action">
          <label for="manage-participants-modal" class="btn btn-outline">Done</label>
        </div>
      </div>
      <label class="modal-backdrop" for="manage-participants-modal">Close</label>
    </div>

    <AddActivityModal
      planId={props.data.plan?.id ?? null}
      planStartDay={props.data.plan?.startDay ?? null}
      planEndDay={props.data.plan?.endDay ?? null}
      modalId="add-activity-modal"
      bind:open={addActivityOpen}
      on:activityCreated={handleActivityCreated}
    />

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

    {#if chatOpen}
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

    <input id="remove-participant-modal" type="checkbox" class="modal-toggle" />
    <div class="modal" role="dialog">
      <div class="modal-box">
        <h3 class="text-lg font-semibold mb-3">Feature unavailable</h3>
        <p class="text-sm text-base-content/70">
          Removing participants isn’t available right now.
        </p>
        <div class="modal-action">
          <label for="remove-participant-modal" class="btn btn-primary">Okay</label>
        </div>
      </div>
      <label class="modal-backdrop" for="remove-participant-modal">Close</label>
    </div>


    <input id="payment-tracker-modal" type="checkbox" class="modal-toggle" />
    <div class="modal" role="dialog">
      <div class="modal-box max-w-lg">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold">Payment Tracker</h3>
            <p class="text-sm text-base-content/70">
              Track contributions for "{props.data.plan?.title ?? 'Plan'}"
            </p>
          </div>
          <label for="payment-tracker-modal" class="btn btn-ghost btn-sm">✕</label>
        </div>
        <div class="mt-4 flex gap-2">
          <label class="input input-bordered flex items-center gap-2 flex-1">
            <span class="material-symbols-outlined text-base">search</span>
            <input
              type="text"
              class="grow"
              placeholder="Find participant..."
              bind:value={paymentSearch}
            />
          </label>
          <button class="btn btn-outline btn-sm" type="button">Filter</button>
        </div>
        <div class="mt-4 space-y-3">
          {#each paymentRows as row}
            <div class="flex items-center justify-between rounded-2xl border border-base-200 px-3 py-2">
              <div class="flex items-center gap-3">
                <Avatar initials={row.name.slice(0, 2).toUpperCase()} imageUrl={row.avatar} />
                <div>
                  <p class="font-semibold text-sm">{row.name}</p>
                  <p class="text-xs text-base-content/60">{row.role}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                {#if row.due > 0}
                  <span class="badge badge-warning badge-sm">Unpaid</span>
                  <span class="font-semibold text-sm">${row.due.toFixed(2)}</span>
                {:else}
                  <span class="badge badge-success badge-sm">Paid</span>
                  <span class="font-semibold text-sm">${row.paid.toFixed(2)}</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
        <div class="mt-5 rounded-2xl border border-base-200 p-4">
          <div class="flex items-end justify-between gap-4">
            <div>
              <p class="text-xs uppercase tracking-widest text-base-content/60">Total collected</p>
              <p class="text-2xl font-black">${paymentCollected.toFixed(2)}</p>
              <p class="text-xs text-base-content/60">of ${paymentGoal.toFixed(2)} goal</p>
            </div>
            <span class="badge badge-success">{paymentPercent}% Paid</span>
          </div>
          <progress class="progress progress-primary mt-3" value={paymentPercent} max="100"></progress>
        </div>
        <div class="mt-4">
          <label class="btn btn-primary w-full" for="payment-reminder-modal">
            <span class="material-symbols-outlined text-base">mail</span>
            Send Reminder to Unpaid
          </label>
        </div>
      </div>
      <label class="modal-backdrop" for="payment-tracker-modal">Close</label>
    </div>

    <input id="payment-reminder-modal" type="checkbox" class="modal-toggle" />
    <div class="modal" role="dialog">
      <div class="modal-box">
        <h3 class="text-lg font-semibold mb-3">Feature unavailable</h3>
        <p class="text-sm text-base-content/70">
          Sending reminders isn’t available yet.
        </p>
        <div class="modal-action">
          <label for="payment-reminder-modal" class="btn btn-primary">Okay</label>
        </div>
      </div>
      <label class="modal-backdrop" for="payment-reminder-modal">Close</label>
    </div>

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
                : 'Invite link pending'
          }
        />
        {#if inviteStatus}
          <p class="text-xs text-error mt-2">{inviteStatus}</p>
        {/if}
        <button class="btn btn-primary w-full mt-4" on:click={copyInviteLink} disabled={!inviteLink}>
          {copiedInvite ? 'Invite Link Copied' : 'Copy Invite Link'}
        </button>
      </div>
      <label class="modal-backdrop" for="invite-modal">Close</label>
    </div>
  </main>

  <button
    class="btn btn-circle btn-primary fixed bottom-24 right-6 shadow-lg lg:hidden"
    type="button"
    on:click={() => (chatOpen = true)}
  >
    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 11h10v2H7v-2Zm0-4h10v2H7V7Zm12-4H5a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h3.5l3.2 2.4a1 1 0 0 0 1.6-.8V19H19a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3Z" />
    </svg>
  </button>

  <div class="fixed inset-x-0 bottom-0 z-40 border-t border-base-200 bg-base-100 px-4 py-3 lg:hidden">
    <div class="flex items-center justify-around">
      <button class="btn btn-ghost" type="button" on:click={scrollToTop}>Plan</button>
      <button class="btn btn-circle btn-primary" type="button" on:click={handleAddActivityClick}>
        +
      </button>
      <button class="btn btn-ghost" type="button" on:click={openCosts}>Costs</button>
    </div>
  </div>
</div>

<CoverImageModal
  bind:open={coverModalOpen}
  title="Update plan cover"
  currentImage={coverImage || props.data.plan?.coverImage || null}
  on:close={() => (coverModalOpen = false)}
  on:save={(event) => saveCoverImage(event.detail)}
/>

<style>
  :global(.people-carousel-root .people-carousel) {
    scroll-snap-type: x mandatory;
  }
  :global(.people-carousel-root .people-snap) {
    scroll-snap-align: center;
  }
</style>
