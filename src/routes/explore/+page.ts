import type { PageLoad } from './$types';
import type { ApiPlan, ApiResponse } from '$lib/api/types';
import type { Plan } from '$lib/types';
import { mapPlanFromApi } from '$lib/models/plan';
import { getBackendBaseUrl } from '$lib/api/client';

export const load: PageLoad = async ({ fetch }) => {
  let plans: Plan[] = [];
  let statusMessage = '';

  try {
    const response = await fetch(`${getBackendBaseUrl()}/plan/public`, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Unable to load public plans.');
    }

    const payload = (await response.json()) as ApiResponse<ApiPlan[]>;
    if (payload.success && Array.isArray(payload.data)) {
      plans = payload.data.map((plan, index) =>
        mapPlanFromApi(plan, index, plan.image_url ?? plan.imageUrl)
      );
    } else {
      statusMessage = 'No public plans yet.';
    }
  } catch (error) {
    statusMessage = 'Unable to load public plans right now.';
  }

  return { plans, statusMessage };
};
