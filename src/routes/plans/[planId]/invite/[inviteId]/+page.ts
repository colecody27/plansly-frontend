import type { PageLoad } from './$types';
import type { ApiPlan, ApiResponse } from '$lib/api/types';
import { getBackendBaseUrl } from '$lib/api/client';
import type { Plan } from '$lib/types';
import { mapPlanFromApi } from '$lib/models/plan';

export const load: PageLoad = async ({ fetch, params }) => {
  const { planId, inviteId } = params;
  let plan: Plan | null = null;
  let statusMessage = '';

  try {
    const response = await fetch(`${getBackendBaseUrl()}/plan/${planId}/invite/${inviteId}`, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Unable to load plan invitation.');
    }
    const payload = (await response.json()) as ApiResponse<ApiPlan>;
    if (payload?.success && payload.data) {
      plan = mapPlanFromApi(payload.data, 0);
    } else {
      statusMessage = 'Invitation unavailable.';
    }
  } catch (error) {
    statusMessage = 'Unable to load invitation right now.';
  }

  return { plan, statusMessage };
};
