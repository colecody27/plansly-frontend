import { apiFetch } from '$lib/api/client';
import type { ApiPlan, ApiPlanWithImages, ApiResponse } from '$lib/api/types';
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
  const response = await apiFetch<ApiResponse<ApiPlan | ApiPlanWithImages>>(`/plan/${planId}`);
  const planPayload = response.data;
  const plan = (planPayload as ApiPlanWithImages)?.plan ?? planPayload;
  const coverImage =
    (planPayload as ApiPlanWithImages)?.image_urls?.selected ?? undefined;
  return {
    ...response,
    data: mapPlanDetailFromApi(plan as ApiPlan, 0, coverImage)
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

export interface PlanImageUploadRequest {
  filename: string;
  filetype: string;
  filesize: number;
}

export type PlanImageUploadResponse =
  | string
  | {
      upload_url?: string;
      uploadUrl?: string;
      url?: string;
      file_url?: string;
      fileUrl?: string;
      public_url?: string;
      publicUrl?: string;
      download_url?: string;
      downloadUrl?: string;
      selected?: string;
      s3_url?: string;
      s3Url?: string;
      image_id?: string;
      imageId?: string;
    };

export const requestPlanImageUpload = async (payload: PlanImageUploadRequest) => {
  return apiFetch<ApiResponse<PlanImageUploadResponse>>('/plan/upload/image', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const finalizePlanImageUpload = async (imageId: string) => {
  return apiFetch<ApiResponse<PlanImageUploadResponse>>(`/plan/upload/image/${imageId}`, {
    method: 'POST'
  });
};
