import { apiFetch } from '$lib/api/client';
import type { ApiPlan, ApiResponse } from '$lib/api/types';
import type { Plan, PlanDetail } from '$lib/types';
import { mapPlanDetailFromApi, mapPlanFromApi } from '$lib/models/plan';

export const getPlans = async () => {
  const response = await apiFetch<ApiResponse<ApiPlan[]>>('/plan');
  return {
    ...response,
    data: Array.isArray(response.data)
      ? response.data.map((plan, index) => mapPlanFromApi(plan, index))
      : []
  } satisfies ApiResponse<Plan[]>;
};

export const getPlan = async (planId: string) => {
  const response = await apiFetch<ApiResponse<ApiPlan>>(`/plan/${planId}`);
  return {
    ...response,
    data: mapPlanDetailFromApi(response.data)
  } satisfies ApiResponse<PlanDetail>;
};

export const createPlan = async (payload: Record<string, unknown>) => {
  const response = await apiFetch<ApiResponse<ApiPlan>>('/plan/create', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  return {
    ...response,
    data: mapPlanFromApi(response.data)
  } satisfies ApiResponse<Plan>;
};

export const lockPlan = async (planId: string) => {
  const response = await apiFetch<ApiResponse<ApiPlan>>(`/plan/${planId}/lock-toggle`, {
    method: 'PUT'
  });
  return {
    ...response,
    data: mapPlanFromApi(response.data)
  } satisfies ApiResponse<Plan>;
};
