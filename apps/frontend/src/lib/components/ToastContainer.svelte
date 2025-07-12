<script lang="ts">
  import { toasts } from '$lib/stores/toast';
  import Toast from './Toast.svelte';
</script>

<!-- Toast Container - Fixed position at top-right -->
<div
  class="fixed top-4 right-4 z-50 flex flex-col space-y-3 pointer-events-none w-80 sm:w-96"
  aria-live="polite"
  aria-label="Notifications"
>
  {#each $toasts as toast (toast.id)}
    <Toast {toast} />
  {/each}
</div>
