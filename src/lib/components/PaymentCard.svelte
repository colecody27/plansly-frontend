<script lang="ts">
  export let amount = 150;
  export let note = 'Covering lodging & food';
</script>

<div class="card bg-base-100 border border-base-200 shadow-sm">
  <div class="card-body gap-4">
    <div class="flex items-center justify-between">
      <span class="badge badge-warning">Payment Due</span>
      <span class="text-sm text-primary">Secure</span>
    </div>
    <div>
      <p class="text-3xl font-semibold">${amount.toFixed(2)}</p>
      <p class="text-sm text-base-content/60">{note}</p>
    </div>
    <button class="btn btn-primary">Pay Now -></button>
    <p class="text-xs text-base-content/50">Venmo / Card - Instant confirmation</p>
  </div>
</div>
