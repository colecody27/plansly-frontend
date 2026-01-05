import type { Plan, PlanType } from '$lib/types';

const coverImages = [
  'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80'
];

const formatShortDate = (value?: string) => {
  if (!value) {
    return 'TBD';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'TBD';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const mapPlanFromApi = (plan: Record<string, any>, index = 0): Plan => {
  const type = plan.type === 'group_purchase' ? 'group' : plan.type || 'event';
  const normalizedType = ['trip', 'event', 'group'].includes(type) ? (type as PlanType) : 'event';
  const goal = plan.costs?.total ?? 0;
  const perPerson = plan.costs?.per_person ?? 0;

  return {
    id: plan.id ?? plan._id ?? plan.invitation_id ?? `plan-${index}`,
    title: plan.name ?? 'Untitled Plan',
    type: normalizedType,
    status: plan.status ?? 'Active',
    dateRange: plan.deadline ? formatShortDate(plan.deadline) : 'TBD',
    location: plan.location ?? 'Location TBD',
    coverImage: plan.cover_image ?? coverImages[index % coverImages.length],
    goal,
    raised: plan.costs?.raised ?? Math.round(goal * 0.6),
    perPerson,
    dueBy: plan.deadline ? formatShortDate(plan.deadline) : 'TBD',
    participants: (plan.participant_ids ?? []).map((person: any, idx: number) => ({
      id: person?.id ?? `${index}-${idx}`,
      name: person?.name ?? 'Guest',
      status: 'pending'
    }))
  };
};
