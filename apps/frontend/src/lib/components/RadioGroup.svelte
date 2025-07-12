<script lang="ts">
  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    legend: string;
    options: Option[];
    value: string;
    required?: boolean;
    error?: string;
    showError?: boolean;
    onchange?: (value: string) => void;
  }

  const {
    legend,
    options,
    value,
    required = false,
    error = '',
    showError = false,
    onchange = () => {}
  }: Props = $props();
</script>

<div class="space-y-1">
  <fieldset class="h-[68px]">
    <legend class="block text-sm font-medium text-gray-700 mb-1">
      {legend}{required ? ' *' : ''}
    </legend>
    <div class="flex space-x-4 h-[42px] items-center">
      {#each options as option}
        <label class="flex items-center">
          <input
            type="radio"
            {value}
            checked={value === option.value}
            onchange={() => onchange(option.value)}
            class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500 focus:ring-2"
          />
          <span class="ml-2 text-sm text-gray-700">{option.label}</span>
        </label>
      {/each}
    </div>
  </fieldset>
  
  <!-- Reserved space for error message -->
  <div class="h-5 flex items-start">
    {#if showError && error}
      <p class="text-sm text-red-600">{error}</p>
    {/if}
  </div>
</div>