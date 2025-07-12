<script lang="ts">
  import { db, type LineItem } from '$lib/database';
  import { onMount } from 'svelte';

  interface Props {
    selectedLineItems?: LineItem[];
    onLineItemsSelect?: (items: LineItem[]) => void;
  }

  const { selectedLineItems = [], onLineItemsSelect = () => {} }: Props = $props();

  let lineItems: LineItem[] = $state([]);
  let showForm = $state(false);
  let editingItem: LineItem | null = $state(null);
  let loading = $state(false);
  let errorMessage = $state('');
  let selectedItems: Set<number> = $state(new Set());

  let formData = $state({
    name: '',
    description: '',
    category: '',
    unitPrice: 0,
    defaultQuantity: 1,
    unit: 'hours',
    isActive: true
  });

  const commonUnits = ['hours', 'pieces', 'months', 'weeks', 'days', 'services', 'licenses'];
  const commonCategories = ['Consulting', 'Development', 'Design', 'Support', 'Training', 'Hardware', 'Software'];

  onMount(async () => {
    await loadLineItems();
    // Initialize selected items from props
    selectedItems = new Set(selectedLineItems.map(item => item.id!).filter(id => id !== undefined));
  });

  async function loadLineItems() {
    try {
      loading = true;
      // Fix: Use filter instead of where().equals().orderBy() chain
      const allItems = await db.lineItems.orderBy('name').toArray();
      lineItems = allItems.filter(item => item.isActive);
    } catch (error) {
      console.error('Error loading line items:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      errorMessage = `Failed to load line items: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      loading = false;
    }
  }

  function openForm(item?: LineItem) {
    editingItem = item || null;
    if (item) {
      formData = {
        name: item.name,
        description: item.description,
        category: item.category || '',
        unitPrice: item.unitPrice,
        defaultQuantity: item.defaultQuantity,
        unit: item.unit,
        isActive: item.isActive
      };
    } else {
      formData = {
        name: '',
        description: '',
        category: '',
        unitPrice: 0,
        defaultQuantity: 1,
        unit: 'hours',
        isActive: true
      };
    }
    showForm = true;
  }

  function closeForm() {
    showForm = false;
    editingItem = null;
    errorMessage = '';
  }

  async function saveLineItem() {
    try {
      loading = true;
      errorMessage = '';

      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }
      if (formData.unitPrice <= 0) {
        throw new Error('Unit price must be greater than 0');
      }
      if (formData.defaultQuantity <= 0) {
        throw new Error('Default quantity must be greater than 0');
      }

      const itemData: Omit<LineItem, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        unitPrice: Number(formData.unitPrice),
        defaultQuantity: Number(formData.defaultQuantity),
        unit: formData.unit,
        isActive: formData.isActive
      };

      if (editingItem) {
        await db.lineItems.update(editingItem.id!, itemData);
      } else {
        await db.lineItems.add(itemData as LineItem);
      }

      await loadLineItems();
      closeForm();
    } catch (error) {
      console.error('Error saving line item:', error);
      errorMessage = `Failed to save line item: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      loading = false;
    }
  }

  async function toggleItemActive(item: LineItem) {
    try {
      await db.lineItems.update(item.id!, { isActive: !item.isActive });
      await loadLineItems();
    } catch (error) {
      console.error('Error updating line item:', error);
      errorMessage = `Failed to update line item: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  function toggleItemSelection(itemId: number) {
    if (selectedItems.has(itemId)) {
      selectedItems.delete(itemId);
    } else {
      selectedItems.add(itemId);
    }
    selectedItems = new Set(selectedItems);
    
    const selected = lineItems.filter(item => selectedItems.has(item.id!));
    onLineItemsSelect(selected);
  }

  function selectAllItems() {
    selectedItems = new Set(lineItems.map(item => item.id!));
    onLineItemsSelect(lineItems);
  }

  function clearSelection() {
    selectedItems = new Set();
    onLineItemsSelect([]);
  }
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
  <div class="flex justify-between items-center mb-4">
    <h3 class="text-lg font-medium text-gray-900">Line Items</h3>
    <div class="flex space-x-2">
      {#if selectedItems.size > 0}
        <span class="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
          {selectedItems.size} selected
        </span>
      {/if}
      <button
        type="button"
        onclick={() => openForm()}
        class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
      >
        Add New
      </button>
    </div>
  </div>

  {#if selectedItems.size > 0}
    <div class="flex space-x-2 mb-4">
      <button
        type="button"
        onclick={selectAllItems}
        class="text-sm text-blue-600 hover:text-blue-800"
      >
        Select All
      </button>
      <span class="text-gray-300">|</span>
      <button
        type="button"
        onclick={clearSelection}
        class="text-sm text-gray-600 hover:text-gray-800"
      >
        Clear Selection
      </button>
    </div>
  {/if}

  {#if loading}
    <div class="text-center py-4">
      <div class="text-gray-500">Loading...</div>
    </div>
  {:else if lineItems.length === 0}
    <div class="text-center py-4">
      <div class="text-gray-500">No line items found</div>
    </div>
  {:else}
    <div class="space-y-2">
      {#each lineItems as item (item.id)}
        <div
          class="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          class:ring-2={selectedItems.has(item.id!)}
          class:ring-blue-500={selectedItems.has(item.id!)}
        >
          <div class="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedItems.has(item.id!)}
              onchange={() => toggleItemSelection(item.id!)}
              class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div class="flex-1">
              <div class="font-medium text-gray-900">{item.name}</div>
              <div class="text-sm text-gray-500">{item.description}</div>
              <div class="text-xs text-gray-400">
                €{item.unitPrice.toFixed(2)} per {item.unit}
                {#if item.category}
                  • {item.category}
                {/if}
              </div>
            </div>
          </div>
          <div class="flex space-x-2">
            <button
              type="button"
              onclick={() => openForm(item)}
              class="text-blue-500 hover:text-blue-700 text-sm"
            >
              Edit
            </button>
            <button
              type="button"
              onclick={() => toggleItemActive(item)}
              class="text-gray-500 hover:text-gray-700 text-sm"
            >
              {item.isActive ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if errorMessage}
    <div class="mt-4 text-red-600 text-sm">{errorMessage}</div>
  {/if}
</div>

{#if showForm}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        {editingItem ? 'Edit' : 'Add'} Line Item
      </h3>

      <form onsubmit={(e) => { e.preventDefault(); saveLineItem(); }}>
        <div class="space-y-4">
          <div>
            <label for="lineItemName" class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              id="lineItemName"
              type="text"
              bind:value={formData.name}
              required
              placeholder="e.g., Web Development"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="lineItemDescription" class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              id="lineItemDescription"
              bind:value={formData.description}
              required
              rows="3"
              placeholder="Brief description of the service or product"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div>
            <label for="lineItemCategory" class="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              id="lineItemCategory"
              bind:value={formData.category}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {#each commonCategories as category}
                <option value={category}>{category}</option>
              {/each}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="lineItemUnitPrice" class="block text-sm font-medium text-gray-700 mb-1">Unit Price (€) *</label>
              <input
                id="lineItemUnitPrice"
                type="number"
                bind:value={formData.unitPrice}
                min="0"
                step="0.01"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="lineItemDefaultQuantity" class="block text-sm font-medium text-gray-700 mb-1">Default Qty *</label>
              <input
                id="lineItemDefaultQuantity"
                type="number"
                bind:value={formData.defaultQuantity}
                min="0.01"
                step="0.01"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label for="lineItemUnit" class="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
            <select
              id="lineItemUnit"
              bind:value={formData.unit}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {#each commonUnits as unit}
                <option value={unit}>{unit}</option>
              {/each}
            </select>
          </div>

          <div class="flex items-center">
            <input
              type="checkbox"
              bind:checked={formData.isActive}
              id="isActive"
              class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label for="isActive" class="ml-2 text-sm text-gray-700">Active</label>
          </div>
        </div>

        {#if errorMessage}
          <div class="mt-4 text-red-600 text-sm">{errorMessage}</div>
        {/if}

        <div class="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onclick={closeForm}
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}