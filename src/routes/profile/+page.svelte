<script lang="ts">
  import { onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import AppNav from '$lib/components/AppNav.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import LocationAutocomplete from '$lib/components/LocationAutocomplete.svelte';
  import { apiFetch, getBackendBaseUrl } from '$lib/api/client';

  const sidebarItems = [
    { label: 'Personal Information', active: true },
    { label: 'Sign Out', active: false, danger: true }
  ];

  const props = $props();
  let venmoHandle = $state(props.data.profile?.venmoHandle ?? '');
  let name = $state(props.data.profile?.name ?? '');
  const email = props.data.profile?.email ?? '';
  const avatarUrl = props.data.profile?.avatar ?? null;
  let bio = $state(props.data.profile?.bio ?? '');
  let profileCountry = $state(props.data.profile?.country ?? '');
  let profileState = $state(props.data.profile?.state ?? '');
  let profileCity = $state(props.data.profile?.city ?? '');
  let profileLocation = $state(
    props.data.profile?.location ??
      [profileCity, profileState, profileCountry].filter(Boolean).join(', ')
  );

  const plansJoined = $derived(
    Number((props.data.profile as { plansJoined?: number } | null)?.plansJoined ?? 0)
  );
  const plansHosted = $derived(
    Number((props.data.profile as { plansHosted?: number } | null)?.plansHosted ?? 0)
  );
  const mutuals = $derived(
    (props.data.profile as { mutuals?: Array<{ name?: string; avatar?: string }> } | null)
      ?.mutuals ?? []
  );
  const displayName = $derived(name.trim() || 'Guest');
  const initials = $derived(
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'G'
  );

  let profileImagePreview = $state<string | null>(avatarUrl);
  let profileImageFile = $state<File | null>(null);
  let isSaving = $state(false);
  let saveError = $state('');
  let saveSuccess = $state(false);

  const handleProfileImageChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const [file] = input.files ?? [];
    if (!file) {
      return;
    }
    if (profileImagePreview && profileImagePreview !== avatarUrl) {
      URL.revokeObjectURL(profileImagePreview);
    }
    profileImagePreview = URL.createObjectURL(file);
    profileImageFile = file;
  };

  onDestroy(() => {
    if (profileImagePreview && profileImagePreview !== avatarUrl) {
      URL.revokeObjectURL(profileImagePreview);
    }
  });

  const handleSaveProfile = async () => {
    if (isSaving) {
      return;
    }
    isSaving = true;
    saveError = '';
    saveSuccess = false;
    const trimmedName = name.trim();
    const trimmedVenmo = venmoHandle.trim();
    const trimmedCountry = profileCountry.trim();
    const trimmedState = profileState.trim();
    const trimmedCity = profileCity.trim();

    try {
      if (profileImageFile) {
        const form = new FormData();
        form.append('name', trimmedName);
        form.append('venmo', trimmedVenmo);
        form.append('country', trimmedCountry);
        form.append('state', trimmedState);
        form.append('city', trimmedCity);
        form.append('bio', bio.trim());
        form.append('picture', profileImageFile);

        const headers = new Headers();
        const token = browser ? localStorage.getItem('access_token_cookie') : null;
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }

        const response = await fetch(`${getBackendBaseUrl()}/user/profile`, {
          method: 'PUT',
          headers,
          body: form,
          credentials: 'include'
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Request failed' }));
          throw new Error(error.message ?? 'Request failed');
        }
        await response.json().catch(() => null);
        profileImageFile = null;
      } else {
        await apiFetch('/user/profile', {
          method: 'PUT',
          body: JSON.stringify({
            name: trimmedName,
            venmo: trimmedVenmo,
            country: trimmedCountry,
            state: trimmedState,
            city: trimmedCity,
            bio: bio.trim()
          })
        });
      }

      saveSuccess = true;
      setTimeout(() => {
        saveSuccess = false;
      }, 2000);
    } catch (error) {
      saveError = error instanceof Error ? error.message : 'Unable to update profile.';
    } finally {
      isSaving = false;
    }
  };
</script>

<div>
  <AppNav />
  <main class="px-6 lg:px-16 pb-20">
    <section class="section-spacing space-y-6">
      <div class="text-sm text-base-content/60">Home / <span class="text-primary">Profile Settings</span></div>
      <div class="grid gap-6 lg:grid-cols-[1fr,2fr]">
        <div class="space-y-6">
          <div class="card bg-base-100 border border-base-200 shadow-sm">
            <div class="card-body items-center text-center">
              <div class="w-full rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 py-10"></div>
              <Avatar
                initials={initials}
                size="xl"
                status="none"
                imageUrl={profileImagePreview}
                outerClass="-mt-8"
                innerClass="bg-base-100 ring-4 ring-base-100"
              />
              <h3 class="text-lg font-semibold">{displayName}</h3>
              <label class="btn btn-outline btn-sm mt-2" for="profile-photo-unavailable">
                Upload Photo
              </label>
              <div class="grid grid-cols-2 gap-4 text-center w-full mt-4">
                <div>
                  <p class="text-xl font-semibold text-primary">{plansJoined}</p>
                  <p class="text-xs text-base-content/60">Plans Joined</p>
                </div>
                <div>
                  <p class="text-xl font-semibold text-primary">{plansHosted}</p>
                  <p class="text-xs text-base-content/60">Hosted</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card bg-base-100 border border-base-200 shadow-sm">
            <div class="card-body gap-2">
              {#each sidebarItems as item}
                <button
                  class={`btn btn-ghost justify-start ${item.active ? 'bg-primary/10 text-primary' : ''} ${
                    item.danger ? 'text-error' : ''
                  }`}
                >
                  {item.label}
                </button>
              {/each}
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="card bg-base-100 border border-base-200 shadow-sm">
            <div class="card-body gap-4">
              <div>
                <h3 class="text-lg font-semibold">Mutuals</h3>
                <p class="text-sm text-base-content/60">People you have hosted events with recently.</p>
              </div>
              <div class="flex flex-wrap gap-3">
                {#if mutuals.length}
                  {#each mutuals as person}
                    <div class="text-center">
                      <Avatar
                        initials={(person.name ?? 'G').slice(0, 2).toUpperCase()}
                        size="lg"
                        status="none"
                        textClass="text-sm"
                        imageUrl={person.avatar ?? null}
                      />
                      <p class="text-xs mt-1">{person.name ?? 'Guest'}</p>
                    </div>
                  {/each}
                {:else}
                  <p class="text-sm text-base-content/60">No mutuals yet.</p>
                {/if}
              </div>
            </div>
          </div>

          <div class="card bg-base-100 border border-base-200 shadow-sm">
            <div class="card-body gap-4">
              <div>
                <h3 class="text-lg font-semibold">Personal Information</h3>
                <p class="text-sm text-base-content/60">Update your personal details and public profile.</p>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <label class="form-control md:col-span-2">
                  <span class="label-text">Name</span>
                  <input class="input input-bordered" bind:value={name} />
                </label>
                <label class="form-control">
                  <span class="label-text">Email Address</span>
                  <input
                    class="input input-bordered bg-base-200 text-base-content/60"
                    value={email}
                    readonly
                  />
                </label>
              </div>
              <label class="form-control">
                <span class="label-text flex items-center gap-2">
                  Venmo Handle
                  {#if !venmoHandle}
                    <span class="text-xs text-warning">
                      Add your handle to enable participant payouts.
                    </span>
                  {/if}
                </span>
                <input
                  class="input input-bordered"
                  placeholder="@username"
                  bind:value={venmoHandle}
                />
              </label>
              <LocationAutocomplete
                label="Location"
                bind:location={profileLocation}
                bind:country={profileCountry}
                bind:state={profileState}
                bind:city={profileCity}
                idPrefix="profile-location"
                singleInput={true}
              />
              <label class="form-control">
                <span class="label-text">Bio</span>
                <textarea
                  class="textarea textarea-bordered h-24"
                  placeholder="Share a bit about yourself."
                  bind:value={bio}
                ></textarea>
              </label>
              {#if saveError}
                <div class="alert alert-error text-sm">{saveError}</div>
              {:else if saveSuccess}
                <div class="alert alert-success text-sm">Profile updated.</div>
              {/if}
              <div class="flex justify-end">
                <button class="btn btn-primary" type="button" on:click={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>

          <div class="card bg-base-100 border border-base-200 shadow-sm">
            <div class="card-body gap-4">
              <div>
                <h3 class="text-lg font-semibold">Notifications</h3>
                <p class="text-sm text-base-content/60">Manage how you receive updates about your plans.</p>
              </div>
              <div class="space-y-3 opacity-60 pointer-events-none select-none">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-semibold">New Invitations</p>
                    <p class="text-xs text-base-content/60">Receive email when you're invited to a new plan.</p>
                  </div>
                  <input type="checkbox" class="toggle toggle-primary" checked disabled />
                </div>
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-semibold">Trip Updates</p>
                    <p class="text-xs text-base-content/60">Notify me about changes to itinerary or details.</p>
                  </div>
                  <input type="checkbox" class="toggle toggle-primary" checked disabled />
                </div>
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-semibold">Payment Reminders</p>
                    <p class="text-xs text-base-content/60">Get reminded when buy-ins are due.</p>
                  </div>
                  <input type="checkbox" class="toggle toggle-primary" checked disabled />
                </div>
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-semibold">Chat Messages</p>
                    <p class="text-xs text-base-content/60">Push notifications for new chat messages.</p>
                  </div>
                  <input type="checkbox" class="toggle" disabled />
                </div>
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-semibold">Marketing Emails</p>
                    <p class="text-xs text-base-content/60">Receive news and updates from Plansly.</p>
                  </div>
                  <input type="checkbox" class="toggle" disabled />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
  <input id="profile-photo-unavailable" type="checkbox" class="modal-toggle" />
  <div class="modal" role="dialog">
    <div class="modal-box">
      <h3 class="text-lg font-semibold mb-2">Feature unavailable</h3>
      <p class="text-sm text-base-content/70">
        Profile photo uploads aren’t available yet. Please check back soon!
      </p>
      <div class="modal-action">
        <label for="profile-photo-unavailable" class="btn btn-primary">Okay</label>
      </div>
    </div>
    <label class="modal-backdrop" for="profile-photo-unavailable">Close</label>
  </div>
</div>
