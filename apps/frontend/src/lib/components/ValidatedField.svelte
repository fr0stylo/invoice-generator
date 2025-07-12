<script lang="ts">
  import { validationErrors, showValidationErrors } from '$lib/stores/validation';

  interface Props {
    id: string;
    label: string;
    type?: 'text' | 'email' | 'tel' | 'date' | 'number';
    value: string | number;
    required?: boolean;
    placeholder?: string;
    fieldPath: string;
    min?: string | number;
    max?: string | number;
    step?: string | number;
    oninput?: (value: string | number) => void;
  }

  const {
    id,
    label,
    type = 'text',
    value,
    required = false,
    placeholder = '',
    fieldPath,
    min,
    max,
    step,
    oninput = () => {},
  }: Props = $props();

  // Reactive error state from store
  let error = $state('');
  let showError = $state(false);

  // Subscribe to validation stores
  validationErrors.subscribe(errors => {
    error = errors[fieldPath] || '';
  });

  showValidationErrors.subscribe(show => {
    showError = show;
  });

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const val = type === 'number' ? parseFloat(target.value) || 0 : target.value;
    oninput(val);
  }
</script>

<div class="space-y-1">
  <label for={id} class="block text-sm font-medium text-gray-700">
    {label}{required ? ' *' : ''}
  </label>

  <input
    {id}
    {type}
    {value}
    {placeholder}
    {required}
    {min}
    {max}
    {step}
    oninput={handleInput}
    class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent {showError && error
      ? 'border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:ring-purple-500'}"
  />

  <!-- Reserved space for error message (always present to prevent layout shift) -->
  <div class="h-5 flex items-start">
    {#if showError && error}
      <p class="text-sm text-red-600">{error}</p>
    {/if}
  </div>
</div>