<script lang="ts">
  export let initials = '';
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let status: 'online' | 'offline' | 'none' = 'online';
  export let outerClass = '';
  export let innerClass = '';
  export let textClass = '';

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-20 w-20 text-xl'
  } as const;

  $: statusClass =
    status === 'online' ? 'avatar-online' : status === 'offline' ? 'avatar-offline' : '';
</script>

<div class={`avatar placeholder overflow-visible ${statusClass} ${outerClass}`.trim()}>
  <div
    class={`rounded-full flex items-center justify-center leading-none ${sizeClasses[size]} bg-base-200 text-base-content ${innerClass} ${textClass}`.trim()}
  >
    <span>{initials}</span>
  </div>
</div>
