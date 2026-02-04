import type { LayoutServerLoad } from './$types';
import type { ApiResponse, ApiUserProfile } from '$lib/api/types';
import type { UserProfile } from '$lib/types';
import { mapUserProfileFromApi } from '$lib/models/user';
import { getBackendBaseUrl } from '$lib/api/client';

const PROFILE_PATH = '/user';

export const load: LayoutServerLoad = async ({ fetch, cookies }) => {
  const token = cookies.get('access_token_cookie');
  if (!token) {
    return { profile: null };
  }

  let profile: UserProfile | null = null;

  try {
    const response = await fetch(`${getBackendBaseUrl()}${PROFILE_PATH}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: 'include'
    });
    if (response.ok) {
      const payload = (await response.json()) as ApiResponse<ApiUserProfile>;
      if (payload?.success && payload.data) {
        profile = mapUserProfileFromApi(payload.data);
      }
    }
  } catch (error) {
    profile = null;
  }

  return { profile };
};
