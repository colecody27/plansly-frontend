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

const mapParticipant = (person: unknown, index: number): Participant => {
  if (person && typeof person === 'object') {
    const data = person as Record<string, unknown>;
    return {
      id: (data.id as string) || (data._id as string) || `participant-${index}`,
      name: (data.name as string) || 'Guest',
      avatar: data.avatar as string | undefined,
      status: data.status as Participant['status']
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
    return `${formatTime(start)} - ${formatTime(end)}`;
  }
  if (start) {
    return formatTime(start);
  }
  return null;
};

export const mapActivityFromApi = (activity: ApiActivity, index = 0): Activity => ({
  id: (activity as Record<string, any>).id ?? `activity-${index}`,
  title: activity.name ?? 'Untitled Activity',
  startTime: parseDate(activity.start_time ?? null),
  endTime: parseDate(activity.end_time ?? null),
  location: (activity as Record<string, any>).location ?? 'Location TBD',
  description: activity.description ?? undefined,
  link: activity.link ?? undefined,
  cost: activity.cost ?? undefined,
  status: activity.status ?? undefined,
  options: undefined
});

export const mapMessageFromApi = (message: ApiMessage, index = 0): ChatMessage => ({
  id: (message as Record<string, any>).id ?? `message-${index}`,
  name: message.sender_id ?? 'Participant',
  message: message.text,
  timestamp: parseDate(message.timestamp ?? null),
  isSelf: false
});

export const mapPlanFromApi = (plan: ApiPlan, index = 0): Plan => {
  const goal = plan.costs?.total ?? 0;
  const perPerson = plan.costs?.per_person ?? 0;
  const raised = (plan as Record<string, any>)?.costs?.raised ?? Math.round(goal * 0.6);

  return {
    id: plan.id ?? plan._id ?? plan.invitation_id ?? `plan-${index}`,
    title: plan.name ?? 'Untitled Plan',
    type: normalizePlanType(plan.type),
    status: plan.status ?? 'active',
    deadline: parseDate(plan.deadline),
    location: plan.location ?? 'Location TBD',
    coverImage: plan.cover_image ?? coverImages[index % coverImages.length],
    goal,
    raised,
    perPerson,
    participants: Array.isArray(plan.participant_ids)
      ? plan.participant_ids.map(mapParticipant)
      : [],
    createdAt: parseDate(plan.created_at)
  };
};

export const mapPlanDetailFromApi = (plan: ApiPlan, index = 0): PlanDetail => ({
  ...mapPlanFromApi(plan, index),
  description: plan.description ?? '',
  activities: Array.isArray(plan.activities)
    ? plan.activities.map((activity, activityIndex) => mapActivityFromApi(activity, activityIndex))
    : [],
  proposals: [],
  chat: Array.isArray(plan.messages)
    ? plan.messages.map((message, messageIndex) => mapMessageFromApi(message, messageIndex))
    : []
});
