<script lang="ts">
  export let title = 'Weekend in Joshua Tree';
  export let dateRange = 'June 14-16';
  export let location = 'Joshua Tree, CA';
  export let showFinalize = true;
  export let showInvite = true;
  export let showMeta = true;
  export let extraActionLabel: string | null = null;
  export let extraActionHref = '#';
  export let extraActionVariant: 'outline' | 'ghost' | 'error' = 'outline';
  export let extraActionClass = '';
  export let extraActionTargetId: string | null = null;
  export let inviteTargetId: string | null = null;
  export let onInvite: (() => void) | null = null;

  $: extraActionVariantClass =
    extraActionVariant === 'error' ? 'btn-error' : `btn-${extraActionVariant}`;
</script>

<div class="space-y-4">
  <div class="flex flex-wrap items-center gap-3">
    <span class="badge badge-success">Planning Phase</span>
    <span class="badge badge-outline">Draft</span>
  </div>
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
    <div>
      <div class="flex flex-wrap items-center gap-2">
        <h1 class="text-3xl lg:text-4xl font-semibold">{title}</h1>
        <slot name="title-action" />
      </div>
      {#if showMeta}
        <div class="flex flex-wrap gap-3 text-sm text-base-content/60 mt-2">
          <span>{dateRange}</span>
          <span>-</span>
          <span>{location}</span>
        </div>
      {/if}
    </div>
    <div class="flex flex-wrap gap-3">
      {#if extraActionLabel}
        {#if extraActionTargetId}
          <label
            class={`btn ${extraActionVariantClass} ${extraActionClass}`}
            for={extraActionTargetId}
          >
            {extraActionLabel}
          </label>
        {:else}
          <a class={`btn ${extraActionVariantClass} ${extraActionClass}`} href={extraActionHref}>
            {extraActionLabel}
          </a>
        {/if}
      {/if}
      {#if showInvite}
        {#if inviteTargetId}
          <label class="btn btn-outline" for={inviteTargetId} on:click={onInvite ?? undefined}
            >Invite Friends</label
          >
        {:else}
          <button class="btn btn-outline" on:click={onInvite ?? undefined}>Invite Friends</button>
        {/if}
      {/if}
      <slot name="edit-action" />
      {#if showFinalize}
        <button class="btn btn-primary">Finalize Plan</button>
      {/if}
    </div>
  </div>
</div>
