import type { ApiActivity, ApiMessage, ApiPlan } from '$lib/api/types';
import type { Activity, ChatMessage, Participant, Plan, PlanDetail, PlanType } from '$lib/types';

const coverImages = [
  'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80'
];

const normalizePlanType = (value?: string | null): PlanType => {
  const normalized = value === 'group_purchase' ? 'group' : value;
  return normalized === 'trip' || normalized === 'event' || normalized === 'group'
    ? normalized
    : 'event';
};

const parseDate = (value?: string | null): Date | null => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const resolveEntityId = (entry: unknown): string | null => {
  if (typeof entry === 'string') {
    return entry;
  }
  if (entry && typeof entry === 'object') {
    const data = entry as Record<string, unknown>;
    const id = data.id ?? data._id;
    return typeof id === 'string' && id ? id : null;
  }
  return null;
};

const mapParticipant = (person: unknown, index: number): Participant => {
  if (person && typeof person === 'object') {
    const data = person as Record<string, unknown>;
    const isAdmin = typeof data.is_admin === 'boolean' ? data.is_admin : false;
    return {
      id: (data.id as string) || (data._id as string) || `participant-${index}`,
      name: (data.name as string) || 'Guest',
      avatar: (data.picture as string) || (data.avatar as string) || undefined,
      status: isAdmin ? 'admin' : (data.status as Participant['status'])
    };
  }
  return {
    id: `participant-${index}`,
    name: 'Guest',
    status: 'pending'
  };
};

export const formatShortDate = (value?: Date | null): string => {
  if (!value) {
    return 'TBD';
  }
  return value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatTime = (value?: Date | null): string => {
  if (!value) {
    return 'TBD';
  }
  return value.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export const formatActivityTime = (value?: Date | null): string => {
  if (!value) {
    return 'TBD';
  }
  return value.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
};

export const formatTimeRange = (start?: Date | null, end?: Date | null): string | null => {
  if (start && end) {
    const startLabel = formatTime(start);
    const endLabel = formatTime(end);
    if (startLabel === endLabel) {
      return startLabel;
    }
    return `${startLabel} - ${endLabel}`;
  }
  if (start) {
    return formatTime(start);
  }
  return null;
};

export const mapActivityFromApi = (activity: ApiActivity, index = 0): Activity => {
  const rawCost = activity.cost;
  const costData =
    rawCost && typeof rawCost === 'object' ? (rawCost as Record<string, unknown>) : null;
  const perPerson =
    costData && typeof costData.per_person === 'number'
      ? costData.per_person
      : typeof rawCost === 'number'
        ? rawCost
        : undefined;
  const isPerPerson =
    costData && typeof costData.is_per_person === 'boolean'
      ? costData.is_per_person
      : undefined;
  const totalCost =
    costData && typeof costData.total_cost === 'number' ? costData.total_cost : undefined;

  return {
    id: (activity as Record<string, any>).id ?? `activity-${index}`,
    title: activity.name ?? 'Untitled Activity',
    startTime: parseDate(activity.start_time ?? null),
    endTime: parseDate(activity.end_time ?? null),
    location: (activity as Record<string, any>).location ?? 'Location TBD',
    image: (activity as Record<string, any>).image ?? undefined,
    description: activity.description ?? undefined,
    link: activity.link ?? undefined,
    cost: perPerson,
    costIsPerPerson: isPerPerson,
    costTotal: totalCost,
    payments: Array.isArray(activity.payments)
      ? activity.payments
          .map((entry) => {
            if (typeof entry === 'string') {
              return entry;
            }
            if (entry && typeof entry === 'object') {
              const data = entry as Record<string, unknown>;
              return typeof data.id === 'string' ? data.id : null;
            }
            return null;
          })
          .filter((id): id is string => Boolean(id))
      : undefined,
    status:
      activity.status?.toLowerCase() === 'accepted'
        ? 'Confirmed'
        : activity.status ?? undefined,
    options: undefined,
    isProposed: activity.status?.toLowerCase() === 'proposed',
    hasVoted: Array.isArray(activity.votes) && activity.votes.length > 0,
    proposerId:
      (activity as Record<string, any>).proposer?.id ??
      (activity as Record<string, any>).proposer_id ??
      undefined,
    proposerName:
      (activity as Record<string, any>).proposer?.name ??
      (activity as Record<string, any>).proposer_name ??
      (activity as Record<string, any>).proposer ??
      undefined,
    votes: Array.isArray(activity.votes)
      ? activity.votes
          .map((vote) => {
            if (typeof vote === 'string') {
              return { name: vote };
            }
            if (vote && typeof vote === 'object') {
              const data = vote as Record<string, unknown>;
              const name = typeof data.name === 'string' ? data.name : 'Guest';
              const picture = typeof data.picture === 'string' ? data.picture : undefined;
              const id = typeof data.id === 'string' ? data.id : undefined;
              return { id, name, picture };
            }
            return null;
          })
          .filter((vote): vote is { name: string; picture?: string } => Boolean(vote))
      : []
  };
};

export const mapMessageFromApi = (message: ApiMessage, index = 0): ChatMessage => ({
  id:
    (message as Record<string, any>).id ??
    `${message.sender_id ?? 'sender'}-${message.date ?? message.timestamp ?? index}`,
  senderId: message.sender_id ?? undefined,
  name: message.sender_name ?? 'Participant',
  message: message.text,
  timestamp: parseDate(message.date ?? message.timestamp ?? null),
  isSelf: false
});

export const mapPlanFromApi = (
  plan: ApiPlan,
  index = 0,
  coverImageOverride?: string | null
): Plan => {
  const goal = plan.costs?.total ?? 0;
  const perPerson = plan.costs?.per_person ?? 0;
  const raised = plan.costs?.collected ?? (plan as Record<string, any>)?.costs?.raised ?? 0;
  const locationParts = [plan.city, plan.state, plan.country].filter(Boolean);
  const resolvedLocation =
    locationParts.length > 0 ? locationParts.join(', ') : plan.location ?? 'Location TBD';
  const participants = Array.isArray(plan.participants)
    ? plan.participants.map(mapParticipant)
    : Array.isArray(plan.participant_ids)
      ? plan.participant_ids.map(mapParticipant)
      : [];
  const adminEntries = Array.isArray(plan.admins)
    ? plan.admins
    : Array.isArray(plan.admin_ids)
      ? plan.admin_ids
      : [];
  const adminIds = new Set(
    adminEntries
      .map((entry) => resolveEntityId(entry))
      .filter((id): id is string => Boolean(id))
  );

  if (plan.organizer?.id) {
    const hasOrganizer = participants.some((person) => person.id === plan.organizer?.id);
    if (!hasOrganizer) {
      participants.unshift({
        id: plan.organizer.id ?? 'organizer',
        name: plan.organizer.name ?? 'Organizer',
        avatar: plan.organizer.picture ?? undefined,
        status: 'organizer'
      });
    }
  }

  const participantById = new Map(participants.map((participant) => [participant.id, participant]));
  for (const adminEntry of adminEntries) {
    const adminId = resolveEntityId(adminEntry);
    if (!adminId || participantById.has(adminId)) {
      continue;
    }
    if (adminEntry && typeof adminEntry === 'object') {
      const data = adminEntry as Record<string, unknown>;
      const name = typeof data.name === 'string' && data.name ? data.name : 'Admin';
      const avatar = (data.picture as string) || (data.avatar as string) || undefined;
      const adminParticipant: Participant = {
        id: adminId,
        name,
        avatar,
        status: 'admin'
      };
      participants.push(adminParticipant);
      participantById.set(adminId, adminParticipant);
    }
  }

  const normalizedParticipants = participants.map((participant) => {
    if (participant.status === 'organizer') {
      return participant;
    }
    if (adminIds.has(participant.id)) {
      return { ...participant, status: 'admin' as const };
    }
    return participant;
  });

  return {
    id: plan.id ?? `plan-${index}`,
    invitationId: plan.invitation_id ?? undefined,
    title: plan.name ?? 'Untitled Plan',
    type: normalizePlanType(plan.type),
    isPublic: Boolean(plan.is_public),
    status: plan.status ?? 'active',
    deadline: parseDate(plan.deadline),
    startDay: parseDate(plan.start_day),
    endDay: parseDate(plan.end_day),
    country: plan.country ?? undefined,
    state: plan.state ?? undefined,
    city: plan.city ?? undefined,
    location: resolvedLocation,
    coverImage: coverImageOverride || plan.cover_image || coverImages[index % coverImages.length],
    goal,
    raised,
    perPerson,
    participants: normalizedParticipants,
    organizer: plan.organizer
      ? {
          id: plan.organizer.id ?? undefined,
          name: plan.organizer.name ?? undefined,
          picture: plan.organizer.picture ?? undefined,
          venmo: plan.organizer.venmo ?? undefined
        }
      : undefined,
    createdAt: parseDate(plan.created_at)
  };
};

export const mapPlanDetailFromApi = (
  plan: ApiPlan,
  index = 0,
  coverImageOverride?: string | null
): PlanDetail => ({
  ...mapPlanFromApi(plan, index, coverImageOverride),
  description: plan.description ?? '',
  activities: Array.isArray(plan.activities)
    ? plan.activities.map((activity, activityIndex) => mapActivityFromApi(activity, activityIndex))
    : [],
  proposals: [],
  chat: Array.isArray(plan.messages)
    ? plan.messages.map((message, messageIndex) => mapMessageFromApi(message, messageIndex))
    : []
});
