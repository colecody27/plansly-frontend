import type { ApiUserProfile } from '$lib/api/types';
import type { UserProfile } from '$lib/types';

export const mapUserProfileFromApi = (profile: ApiUserProfile): UserProfile => {
  const firstName = profile.first_name?.trim() || undefined;
  const lastName = profile.last_name?.trim() || undefined;
  const name =
    profile.name?.trim() ||
    [firstName, lastName].filter(Boolean).join(' ').trim() ||
    'there';

  const avatar =
    profile.picture?.trim() ||
    profile.avatar?.trim() ||
    profile.avatar_url?.trim() ||
    undefined;
  const country = profile.country?.trim() || undefined;
  const state = profile.state?.trim() || undefined;
  const city = profile.city?.trim() || undefined;
  const locationParts = [city, state, country].filter(Boolean);
  const location = locationParts.length ? locationParts.join(', ') : undefined;
  const mutuals = Array.isArray(profile.mutuals)
    ? profile.mutuals.map((person) => ({
        id: person.id ?? undefined,
        name: person.name ?? 'Guest',
        avatar: person.picture ?? undefined
      }))
    : undefined;

  return {
    id: profile.id ?? undefined,
    name,
    firstName,
    lastName,
    email: profile.email ?? undefined,
    avatar,
    venmoHandle: profile.venmo ?? profile.venmo_handle ?? undefined,
    bio: profile.bio ?? undefined,
    plansHosted: profile.hosting_count ?? undefined,
    plansJoined: profile.participating_count ?? undefined,
    mutuals,
    location,
    country,
    state,
    city
  };
};
