<script lang="ts">
  export let messages: { id: string; name: string; message: string; time: string; isSelf?: boolean }[] = [];
</script>

<div class="card bg-base-100 border border-base-200 shadow-sm">
  <div class="card-body gap-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Group Chat</h3>
      <span class="text-xs text-success">3 online</span>
    </div>
    <div class="space-y-4 max-h-72 overflow-auto">
      {#each messages as message}
        <div class={`chat ${message.isSelf ? 'chat-end' : 'chat-start'}`}>
          <div class="chat-header text-xs text-base-content/60">{message.name} - {message.time}</div>
          <div class={`chat-bubble ${message.isSelf ? 'chat-bubble-primary text-primary-content' : ''}`}>
            {message.message}
          </div>
        </div>
      {/each}
    </div>
    <div class="flex items-center gap-2">
      <input class="input input-bordered flex-1" placeholder="Type a message..." />
      <button class="btn btn-primary btn-square">-></button>
    </div>
  </div>
</div>
