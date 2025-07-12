<script lang="ts">
  import { removeToast, type Toast } from '$lib/stores/toast';
  import { onMount } from 'svelte';

  interface Props {
    toast: Toast;
  }

  const { toast }: Props = $props();

  let isVisible = $state(false);
  let isLeaving = $state(false);
  let autoCloseTimer: number | NodeJS.Timeout | null = null;

  // Animation states
  onMount(() => {
    // Trigger enter animation
    setTimeout(() => {
      isVisible = true;
    }, 10);

    // Set up auto-dismiss timer
    if (toast.duration && toast.duration > 0 && toast.dismissible !== false) {
      autoCloseTimer = setTimeout(() => {
        handleClose();
      }, toast.duration);
    }

    // Cleanup timer on unmount
    return () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  });

  function handleClose() {
    if (!toast.dismissible) return;
    
    // Clear auto-dismiss timer
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      autoCloseTimer = null;
    }
    
    isLeaving = true;
    setTimeout(() => {
      removeToast(toast.id);
    }, 300); // Match exit animation duration
  }

  // Get icon for toast type
  function getIcon(type: Toast['type']) {
    switch (type) {
      case 'success':
        return {
          icon: 'M5 13l4 4L19 7',
          bgColor: 'bg-green-50',
          iconColor: 'text-green-400',
          borderColor: 'border-green-200',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700'
        };
      case 'error':
        return {
          icon: 'M6 18L18 6M6 6l12 12',
          bgColor: 'bg-red-50',
          iconColor: 'text-red-400',
          borderColor: 'border-red-200',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700'
        };
      case 'warning':
        return {
          icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
          bgColor: 'bg-yellow-50',
          iconColor: 'text-yellow-400',
          borderColor: 'border-yellow-200',
          titleColor: 'text-yellow-800',
          messageColor: 'text-yellow-700'
        };
      case 'info':
        return {
          icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
          bgColor: 'bg-blue-50',
          iconColor: 'text-blue-400',
          borderColor: 'border-blue-200',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700'
        };
      default:
        return {
          icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
          bgColor: 'bg-gray-50',
          iconColor: 'text-gray-400',
          borderColor: 'border-gray-200',
          titleColor: 'text-gray-800',
          messageColor: 'text-gray-700'
        };
    }
  }

  const styles = getIcon(toast.type);
</script>

<!-- Toast Container -->
<div
  class="pointer-events-auto w-full overflow-hidden rounded-lg {styles.bgColor} {styles.borderColor} border shadow-lg ring-1 ring-black ring-opacity-5 transition-all duration-300 ease-in-out transform {isVisible && !isLeaving
    ? 'translate-x-0 opacity-100 scale-100'
    : 'translate-x-full opacity-0 scale-95'}"
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
>
  <div class="p-4">
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <!-- Icon -->
        <svg
          class="h-6 w-6 {styles.iconColor}"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d={styles.icon} />
        </svg>
      </div>
      
      <div class="ml-3 w-0 flex-1 pt-0.5">
        <!-- Title -->
        <p class="text-sm font-medium {styles.titleColor}">
          {toast.title}
        </p>
        
        <!-- Message -->
        {#if toast.message}
          <p class="mt-1 text-sm {styles.messageColor}">
            {toast.message}
          </p>
        {/if}
      </div>
      
      <!-- Close Button -->
      {#if toast.dismissible}
        <div class="ml-4 flex flex-shrink-0">
          <button
            class="inline-flex rounded-md {styles.bgColor} text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            onclick={handleClose}
            aria-label="Close notification"
          >
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>
