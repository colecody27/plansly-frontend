<script lang="ts">
  import AppNav from '$lib/components/AppNav.svelte';
  import Avatar from '$lib/components/Avatar.svelte';

  const mutuals = [
    { initials: 'SK', name: 'Sarah' },
    { initials: 'MR', name: 'Mike' },
    { initials: 'AT', name: 'Alex' },
    { initials: 'DB', name: 'Dave' },
    { initials: 'JL', name: 'Jen' },
    { initials: 'TH', name: 'Tom' }
  ];

  const sidebarItems = [
    { label: 'Personal Information', active: true },
    { label: 'Payment Methods', active: false },
    { label: 'Login & Security', active: false },
    { label: 'Sign Out', active: false, danger: true }
  ];

  const venmoHandle = '';
</script>

<div>
  <AppNav />
  <main class="px-6 lg:px-16 pb-20">
    <section class="section-spacing space-y-6">
      <div class="text-sm text-base-content/60">Home / <span class="text-primary">Profile Settings</span></div>
      {#if !venmoHandle}
        <div class="alert alert-warning">
          Add your Venmo handle to enable faster buy-in payouts.
        </div>
      {/if}

      <div class="grid gap-6 lg:grid-cols-[1fr,2fr]">
        <div class="space-y-6">
          <div class="card bg-base-100 border border-base-200 shadow-sm">
            <div class="card-body items-center text-center">
              <div class="w-full rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 py-10"></div>
              <Avatar
                initials="JP"
                size="xl"
                status="none"
                outerClass="-mt-8"
                innerClass="bg-base-100 ring-4 ring-base-100"
              />
              <h3 class="text-lg font-semibold">Jessica Parker</h3>
              <div class="grid grid-cols-2 gap-4 text-center w-full mt-4">
                <div>
                  <p class="text-xl font-semibold text-primary">14</p>
                  <p class="text-xs text-base-content/60">Plans Joined</p>
                </div>
                <div>
                  <p class="text-xl font-semibold text-primary">3</p>
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
                {#each mutuals as person}
                  <div class="text-center">
                    <Avatar initials={person.initials} size="lg" status="none" textClass="text-sm" />
                    <p class="text-xs mt-1">{person.name}</p>
                  </div>
                {/each}
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
                <label class="form-control">
                  <span class="label-text">First Name</span>
                  <input class="input input-bordered" value="Jessica" />
                </label>
                <label class="form-control">
                  <span class="label-text">Last Name</span>
                  <input class="input input-bordered" value="Parker" />
                </label>
                <label class="form-control">
                  <span class="label-text">Email Address</span>
                  <input class="input input-bordered" value="jessica.parker@example.com" readonly />
                </label>
                <label class="form-control">
                  <span class="label-text">Phone Number</span>
                  <input class="input input-bordered" value="+1 (555) 123-4567" readonly />
                </label>
              </div>
              <label class="form-control">
                <span class="label-text">Venmo Handle</span>
                <input class="input input-bordered" placeholder="@username" />
              </label>
              <div class="space-y-2">
                <p class="text-sm font-semibold">Preferred Communication</p>
                <label class="flex items-center gap-2 text-sm">
                  <input type="checkbox" class="checkbox checkbox-sm" checked />
                  Email
                </label>
                <label class="flex items-center gap-2 text-sm">
                  <input type="checkbox" class="checkbox checkbox-sm" />
                  Phone
                </label>
              </div>
              <label class="form-control">
                <span class="label-text">Location</span>
                <input class="input input-bordered" value="San Francisco, CA" />
              </label>
              <label class="form-control">
                <span class="label-text">Bio</span>
                <textarea class="textarea textarea-bordered h-24">
I love organizing weekend getaways and trying new restaurants. Always down for a hiking trip or a board game night.
                </textarea>
              </label>
              <div class="flex justify-end">
                <button class="btn btn-primary">Save Changes</button>
              </div>
            </div>
          </div>

          <div class="card bg-base-100 border border-base-200 shadow-sm">
            <div class="card-body gap-4">
              <div>
                <h3 class="text-lg font-semibold">Notifications</h3>
                <p class="text-sm text-base-content/60">Manage how you receive updates about your plans.</p>
              </div>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-semibold">New Invitations</p>
                    <p class="text-xs text-base-content/60">Receive email when you're invited to a new plan.</p>
                  </div>
                  <input type="checkbox" class="toggle toggle-primary" checked />
                </div>
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-semibold">Trip Updates</p>
                    <p class="text-xs text-base-content/60">Notify me about changes to itinerary or details.</p>
                  </div>
                  <input type="checkbox" class="toggle toggle-primary" checked />
                </div>
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-semibold">Payment Reminders</p>
                    <p class="text-xs text-base-content/60">Get reminded when buy-ins are due.</p>
                  </div>
                  <input type="checkbox" class="toggle toggle-primary" checked />
                </div>
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-semibold">Chat Messages</p>
                    <p class="text-xs text-base-content/60">Push notifications for new chat messages.</p>
                  </div>
                  <input type="checkbox" class="toggle" />
                </div>
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-semibold">Marketing Emails</p>
                    <p class="text-xs text-base-content/60">Receive news and updates from Plannit.</p>
                  </div>
                  <input type="checkbox" class="toggle" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</div>
