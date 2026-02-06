import type { PageLoad } from './$types';
import type { ApiPlan, ApiPlanWithImages, ApiResponse } from '$lib/api/types';
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
    const payload = (await response.json()) as ApiResponse<ApiPlan | ApiPlanWithImages>;
    if (payload?.success && payload.data) {
      const planPayload = payload.data;
      const planData = (planPayload as ApiPlanWithImages)?.plan ?? planPayload;
      const coverImage = (planPayload as ApiPlanWithImages)?.image_urls?.selected ?? undefined;
      plan = mapPlanFromApi(planData as ApiPlan, 0, coverImage);
    } else {
      statusMessage = 'Invitation unavailable.';
    }
  } catch (error) {
    statusMessage = 'Unable to load invitation right now.';
  }

  return { plan, statusMessage };
};
