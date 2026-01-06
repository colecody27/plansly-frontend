<script lang="ts">
  import AppNav from '$lib/components/AppNav.svelte';
</script>

<div>
  <AppNav />
  <main class="px-6 lg:px-16 pb-20">
    <section class="section-spacing space-y-6">
      <div class="text-center space-y-3">
        <p class="text-sm text-primary">Step 3 of 3</p>
        <h1 class="text-3xl lg:text-4xl font-semibold">Setup Buy-in Payments</h1>
        <p class="text-base text-base-content/70">Connect a payout account to start collecting funds.</p>
      </div>
      <div class="flex items-center justify-between text-xs text-base-content/60">
        <span>Plan Details</span>
        <span>Payment Setup</span>
      </div>
      <progress class="progress progress-primary" value="100" max="100"></progress>

      <div class="max-w-2xl mx-auto">
        <div class="card bg-base-100 border border-base-200 shadow-sm">
          <div class="card-body items-center text-center gap-4">
            <div class="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl">
              S
            </div>
            <div>
              <h2 class="text-2xl font-semibold">Required for Buy-ins</h2>
              <p class="text-base text-base-content/70">
                You opted to allow buy-ins for this plan. To handle these transactions securely and
                receive direct deposits, we use Stripe.
              </p>
            </div>
            <div class="w-full rounded-2xl border border-base-200 bg-base-200/40 p-4 text-left">
              <p class="font-semibold">Secure Processing</p>
              <p class="text-sm text-base-content/60">
                Payments are processed securely. We do not store sensitive banking info.
              </p>
            </div>
            <button class="btn btn-primary btn-wide">Connect with Stripe -></button>
            <button class="btn btn-ghost">Continue without payment</button>
            <p class="text-xs text-base-content/60">Buy-in will be disabled for this plan.</p>
            <div class="w-full rounded-2xl border border-base-200 bg-base-100 px-4 py-3 text-left text-sm">
              <p class="text-xs text-base-content/60">Deep link</p>
              <a class="link link-hover text-primary" href="https://plannit.app/pay/placeholder">
                https://plannit.app/pay/placeholder
              </a>
            </div>
          </div>
        </div>
        <div class="text-center mt-6">
          <a class="link link-hover text-sm text-base-content/60" href="/plans/create">Back to Details</a>
        </div>
      </div>
    </section>
  </main>
</div>
