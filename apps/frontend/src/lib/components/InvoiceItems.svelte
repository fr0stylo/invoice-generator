<script lang="ts">
  import LineItemManager from './LineItemManager.svelte';
  import ValidatedField from './ValidatedField.svelte';
  import type { LineItem } from '$lib/database';
  import { lineItemSchema, validateSection } from '$lib/validation';

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

  function getItemFieldError(): string {
    // For now, return empty string - will be replaced with store-based validation
    return '';
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
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div class="md:col-span-4">
          <ValidatedField
            id="itemDescription{index}"
            label="Description"
            value={item.description}
            required={true}
            fieldPath="items.{index}.description"
            oninput={(value) => updateItem(index, 'description', value)}
          />
        </div>

        <div class="md:col-span-3">
          <ValidatedField
            id="itemPeriod{index}"
            label="Period"
            value={item.period}
            fieldPath="items.{index}.period"
            oninput={(value) => updateItem(index, 'period', value)}
          />
        </div>

        <div class="md:col-span-2">
          <ValidatedField
            id="itemQty{index}"
            label="Qty"
            type="number"
            value={item.qty}
            required={true}
            min={0.01}
            step={0.01}
            fieldPath="items.{index}.qty"
            oninput={(value) => updateItem(index, 'qty', value)}
          />
        </div>

        <div class="md:col-span-2">
          <ValidatedField
            id="itemPrice{index}"
            label="Price (€)"
            type="number"
            value={item.unitPrice}
            required={true}
            min={0}
            step={0.01}
            fieldPath="items.{index}.unitPrice"
            oninput={(value) => updateItem(index, 'unitPrice', value)}
          />
        </div>

        <div class="md:col-span-1 flex items-center justify-center">
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
        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2"
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
