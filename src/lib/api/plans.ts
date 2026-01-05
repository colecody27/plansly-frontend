import { apiFetch } from '$lib/api/client';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  msg?: string;
}

export const getPlans = async () => {
  return apiFetch<ApiResponse<unknown[]>>('/plan');
};

export const getPlan = async (planId: string) => {
  return apiFetch<ApiResponse<unknown>>(`/plan/${planId}`);
};

export const createPlan = async (payload: Record<string, unknown>) => {
  return apiFetch<ApiResponse<unknown>>('/plan/create', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const lockPlan = async (planId: string) => {
  return apiFetch<ApiResponse<unknown>>(`/plan/${planId}/lock-toggle`, {
    method: 'PUT'
  });
};
