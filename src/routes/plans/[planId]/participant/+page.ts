import type { PageLoad } from './$types';
import { redirect, isRedirect } from '@sveltejs/kit';
import type { ApiPlan, ApiPlanWithImages, ApiResponse } from '$lib/api/types';
import type { PlanDetail } from '$lib/types';
import { mapPlanDetailFromApi } from '$lib/models/plan';

export const load: PageLoad = async ({ fetch, params }) => {
  const { planId } = params;
  let plan: PlanDetail | null = null;
  let statusMessage = '';

  try {
    const response = await fetch(`/api/plan/${planId}`);
    console.log('Participant plan load status', response.status);
    if (response.status === 401 || response.status === 303) {
      throw redirect(303, '/');
    }
    if (!response.ok) {
      throw new Error('Unable to load plan.');
    }

    const payload = (await response.json()) as ApiResponse<ApiPlan | ApiPlanWithImages>;
    if (payload.success && payload.data) {
      const planPayload = payload.data;
      const planData = (planPayload as ApiPlanWithImages)?.plan ?? planPayload;
      const coverImage = (planPayload as ApiPlanWithImages)?.image_urls?.selected ?? undefined;
      plan = mapPlanDetailFromApi(planData as ApiPlan, 0, coverImage);
    } else {
      statusMessage = 'Plan not available.';
    }
  } catch (error) {
    if (isRedirect(error)) {
      throw error;
    }
    statusMessage = 'Unable to load plan right now.';
  }

  return { plan, statusMessage };
};
