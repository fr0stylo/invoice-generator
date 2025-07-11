<script lang="ts">
  import LineItemManager from './LineItemManager.svelte';
  import type { LineItem } from '$lib/database';

  interface InvoiceItem {
    description: string;
    period: string;
    qty: number;
    unitPrice: number;
  }

  interface Props {
    items: InvoiceItem[];
    selectedLineItems?: LineItem[];
    showLineItemManager?: boolean;
    onItemsChange?: (items: InvoiceItem[]) => void;
    onLineItemsSelect?: (items: LineItem[]) => void;
    onToggleLineItemManager?: () => void;
  }

  const { 
    items, 
    selectedLineItems = [],
    showLineItemManager = false,
    onItemsChange = () => {},
    onLineItemsSelect = () => {},
    onToggleLineItemManager = () => {}
  }: Props = $props();

  function addItem() {
    const newItems = [
      ...items,
      {
        description: '',
        period: '',
        qty: 1,
        unitPrice: 0,
      },
    ];
    onItemsChange(newItems);
  }

  function removeItem(index: number) {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      onItemsChange(newItems);
    }
  }

  function updateItem(index: number, field: string, value: any) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onItemsChange(newItems);
  }
</script>

<div class="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-8">
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-medium text-gray-700">Invoice Items</h2>
    {#if selectedLineItems.length > 0}
      <span class="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
        {selectedLineItems.length} line items selected
      </span>
    {/if}
  </div>

  <div class="space-y-4">
    {#each items as item, index}
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div class="md:col-span-4">
          <label
            for="itemDescription{index}"
            class="block text-sm font-medium text-gray-700 mb-1"
          >Description *</label>
          <input
            id="itemDescription{index}"
            type="text"
            value={item.description}
            oninput={(e) => updateItem(index, 'description', (e.target as HTMLInputElement).value)}
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div class="md:col-span-3">
          <label
            for="itemPeriod{index}"
            class="block text-sm font-medium text-gray-700 mb-1"
          >Period</label>
          <input
            id="itemPeriod{index}"
            type="text"
            value={item.period}
            oninput={(e) => updateItem(index, 'period', (e.target as HTMLInputElement).value)}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div class="md:col-span-2">
          <label
            for="itemQty{index}"
            class="block text-sm font-medium text-gray-700 mb-1"
          >Qty *</label>
          <input
            id="itemQty{index}"
            type="number"
            value={item.qty}
            oninput={(e) => updateItem(index, 'qty', parseFloat((e.target as HTMLInputElement).value) || 1)}
            min="0.01"
            step="0.01"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div class="md:col-span-2">
          <label
            for="itemPrice{index}"
            class="block text-sm font-medium text-gray-700 mb-1"
          >Price (€) *</label>
          <input
            id="itemPrice{index}"
            type="number"
            value={item.unitPrice}
            oninput={(e) => updateItem(index, 'unitPrice', parseFloat((e.target as HTMLInputElement).value) || 0)}
            min="0"
            step="0.01"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div class="md:col-span-1 pb-2 flex items-center justify-center">
          <button
            type="button"
            onclick={() => removeItem(index)}
            class="text-red-500 hover:text-red-700 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            aria-label="Remove item"
            title="Remove item"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 12H4"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    {/each}

    <!-- Action Buttons -->
    <div class="pt-4 border-t border-gray-300 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <button
        type="button"
        onclick={addItem}
        class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          ></path>
        </svg>
        Add Item
      </button>
      <button
        type="button"
        onclick={onToggleLineItemManager}
        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors text-sm flex items-center justify-center gap-2"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          ></path>
        </svg>
        {showLineItemManager ? 'Hide' : 'Manage'} Line Items
      </button>
    </div>
  </div>
</div>

<!-- Line Items Manager -->
{#if showLineItemManager}
  <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-8">
    <LineItemManager
      selectedLineItems={selectedLineItems}
      onLineItemsSelect={onLineItemsSelect}
    />
  </div>
{/if}