import type { PageLoad } from './$types';
import { redirect, isRedirect } from '@sveltejs/kit';
import type { ApiPlan, ApiResponse } from '$lib/api/types';
import type { Plan } from '$lib/types';
import { mapPlanFromApi } from '$lib/models/plan';

export const load: PageLoad = async ({ fetch }) => {
  let plans: Plan[] = [];
  let statusMessage = '';

  try {
    const response = await fetch('/api/plan');
    if (response.status === 401 || response.status === 303) {
      throw redirect(303, '/');
    }
    if (!response.ok) {
      throw new Error('Unable to load plans.');
    }

    const payload = (await response.json()) as ApiResponse<ApiPlan[]>;
    if (payload.success && Array.isArray(payload.data)) {
      plans = payload.data.map((plan, index) =>
        mapPlanFromApi(plan, index, plan.image_url ?? plan.imageUrl)
      );
    } else {
      statusMessage = 'No plans yet.';
    }
  } catch (error) {
    if (isRedirect(error)) {
      throw error;
    }
    statusMessage = 'Unable to load plans right now.';
  }

  return { plans, statusMessage };
};
