<script lang="ts">
  import { onMount } from 'svelte';
  const browser = typeof window !== 'undefined';

  let formData = $state({
    invoiceNumber: '',
    issueDate: '',
    dueDate: '',
    taxRate: 0,
    sender: {
      name: '',
      entityNumber: '',
      address: '',
      city: '',
      country: '',
      phone: '',
      iban: '',
    },
    billTo: {
      name: '',
      companyNumber: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      country: '',
    },
    items: [
      {
        description: '',
        period: '',
        qty: 1,
        unitPrice: 0,
      },
    ],
  });

  let loading = $state(false);
  let errorMessage = $state('');
  let successMessage = $state('');

  const STORAGE_KEY = 'invoice-form-data';

  // Load data from localStorage on mount
  onMount(() => {
    if (browser) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsedData = JSON.parse(stored);
          formData = { ...formData, ...parsedData };
        } catch (e) {
          console.error('Failed to parse stored data:', e);
        }
      }

      // Set defaults if not loaded from storage
      if (!formData.issueDate) {
        const today = new Date().toISOString().split('T')[0];
        formData.issueDate = today;
      }

      if (!formData.dueDate) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        formData.dueDate = dueDate.toISOString().split('T')[0];
      }

      if (!formData.invoiceNumber) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        formData.invoiceNumber = `INV-${year}-${month}-${day}-001`;
      }
    }
  });

  // Save to localStorage whenever formData changes
  $effect(() => {
    if (browser && formData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  });

  function addItem() {
    formData.items = [
      ...formData.items,
      {
        description: '',
        period: '',
        qty: 1,
        unitPrice: 0,
      },
    ];
  }

  function removeItem(index: number) {
    if (formData.items.length > 1) {
      formData.items = formData.items.filter((_, i) => i !== index);
    } else {
      showError('At least one item is required');
    }
  }

  function showError(message: string) {
    errorMessage = message;
    successMessage = '';
    setTimeout(() => {
      errorMessage = '';
    }, 5000);
  }

  function showSuccess(message: string) {
    successMessage = message;
    errorMessage = '';
    setTimeout(() => {
      successMessage = '';
    }, 5000);
  }

  function validateForm() {
    const errors = [];

    if (!formData.sender.name) errors.push('Sender name is required');
    if (!formData.sender.entityNumber)
      errors.push('Sender entity number is required');
    if (!formData.sender.address) errors.push('Sender address is required');
    if (!formData.sender.city) errors.push('Sender city is required');
    if (!formData.sender.country) errors.push('Sender country is required');

    if (!formData.billTo.name) errors.push('Bill-to name is required');
    if (!formData.billTo.address) errors.push('Bill-to address is required');
    if (!formData.billTo.city) errors.push('Bill-to city is required');
    if (!formData.billTo.country) errors.push('Bill-to country is required');

    if (!formData.invoiceNumber) errors.push('Invoice number is required');
    if (!formData.issueDate) errors.push('Issue date is required');
    if (!formData.dueDate) errors.push('Due date is required');

    const validItems = formData.items.filter(
      (item) => item.description && !isNaN(item.qty) && !isNaN(item.unitPrice)
    );
    if (validItems.length === 0)
      errors.push('At least one valid item is required');

    return errors;
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    errorMessage = '';
    successMessage = '';

    const errors = validateForm();
    if (errors.length > 0) {
      showError(errors.join(', '));
      return;
    }

    loading = true;

    try {
      const payload = {
        ...formData,
        items: formData.items.filter(
          (item) =>
            item.description && !isNaN(item.qty) && !isNaN(item.unitPrice)
        ),
        timesheets: [],
      };

      const response = await fetch('/api/generate-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice_${formData.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showSuccess('Invoice generated and downloaded successfully!');
      } else {
        const errorData = await response.json();
        showError(errorData.error || 'Failed to generate invoice');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Network error occurred. Please try again.');
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-purple-300 to-blue-300 p-5">
  <div class="max-w-6xl mx-auto bg-white rounded-xl shadow-2xl p-8">
    <h1 class="text-4xl font-normal text-center text-gray-800 mb-8">
      Invoice Generator
    </h1>

    <form onsubmit={handleSubmit}>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Sender Information -->
        <div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 class="text-2xl font-medium text-gray-700 mb-6">From (Sender)</h2>

          <div class="space-y-4">
            <div>
              <label
                for="senderName"
                class="block text-sm font-medium text-gray-700 mb-1"
                >Name *</label
              >
              <input
                id="senderName"
                type="text"
                bind:value={formData.sender.name}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                for="senderEntityNumber"
                class="block text-sm font-medium text-gray-700 mb-1"
                >Entity Number *</label
              >
              <input
                id="senderEntityNumber"
                type="text"
                bind:value={formData.sender.entityNumber}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                for="senderAddress"
                class="block text-sm font-medium text-gray-700 mb-1"
                >Address *</label
              >
              <input
                id="senderAddress"
                type="text"
                bind:value={formData.sender.address}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                for="senderCity"
                class="block text-sm font-medium text-gray-700 mb-1"
                >City *</label
              >
              <input
                id="senderCity"
                type="text"
                bind:value={formData.sender.city}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                for="senderCountry"
                class="block text-sm font-medium text-gray-700 mb-1"
                >Country *</label
              >
              <input
                id="senderCountry"
                type="text"
                bind:value={formData.sender.country}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                for="senderPhone"
                class="block text-sm font-medium text-gray-700 mb-1"
                >Phone</label
              >
              <input
                id="senderPhone"
                type="tel"
                bind:value={formData.sender.phone}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                for="senderIban"
                class="block text-sm font-medium text-gray-700 mb-1">IBAN</label
              >
              <input
                id="senderIban"
                type="text"
                bind:value={formData.sender.iban}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <!-- Bill To Information -->
        <div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 class="text-2xl font-medium text-gray-700 mb-6">To (Bill To)</h2>

          <div class="space-y-4">
            <div>
              <label
                for="billToName"
                class="block text-sm font-medium text-gray-700 mb-1"
                >Name *</label
              >
              <input
                id="billToName"
                type="text"
                bind:value={formData.billTo.name}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                for="billToCompanyNumber"
                class="block text-sm font-medium text-gray-700 mb-1"
                >Company Number</label
              >
              <input
                id="billToCompanyNumber"
                type="text"
                bind:value={formData.billTo.companyNumber}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                for="billToAddress"
                class="block text-sm font-medium text-gray-700 mb-1"
                >Address *</label
              >
              <input
                id="billToAddress"
                type="text"
                bind:value={formData.billTo.address}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                for="billToCity"
                class="block text-sm font-medium text-gray-700 mb-1"
                >City *</label
              >
              <input
                id="billToCity"
                type="text"
                bind:value={formData.billTo.city}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                for="billToState"
                class="block text-sm font-medium text-gray-700 mb-1"
                >State</label
              >
              <input
                id="billToState"
                type="text"
                bind:value={formData.billTo.state}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                for="billToZip"
                class="block text-sm font-medium text-gray-700 mb-1"
                >ZIP Code</label
              >
              <input
                id="billToZip"
                type="text"
                bind:value={formData.billTo.zip}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                for="billToCountry"
                class="block text-sm font-medium text-gray-700 mb-1"
                >Country *</label
              >
              <input
                id="billToCountry"
                type="text"
                bind:value={formData.billTo.country}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Invoice Details -->
      <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-8">
        <h2 class="text-2xl font-medium text-gray-700 mb-6">Invoice Details</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label
              for="invoiceNumber"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Invoice Number *</label
            >
            <input
              id="invoiceNumber"
              type="text"
              bind:value={formData.invoiceNumber}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              for="taxRate"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Tax Rate (%)</label
            >
            <input
              id="taxRate"
              type="number"
              bind:value={formData.taxRate}
              min="0"
              max="100"
              step="0.01"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              for="issueDate"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Issue Date *</label
            >
            <input
              id="issueDate"
              type="date"
              bind:value={formData.issueDate}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              for="dueDate"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Due Date *</label
            >
            <input
              id="dueDate"
              type="date"
              bind:value={formData.dueDate}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <!-- Invoice Items -->
      <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-8">
        <h2 class="text-2xl font-medium text-gray-700 mb-6">Invoice Items</h2>

        <div class="space-y-4">
          {#each formData.items as item, index}
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div class="md:col-span-4">
                <label
                  for="itemDescription{index}"
                  class="block text-sm font-medium text-gray-700 mb-1"
                  >Description *</label
                >
                <input
                  id="itemDescription{index}"
                  type="text"
                  bind:value={item.description}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div class="md:col-span-3">
                <label
                  for="itemPeriod{index}"
                  class="block text-sm font-medium text-gray-700 mb-1"
                  >Period</label
                >
                <input
                  id="itemPeriod{index}"
                  type="text"
                  bind:value={item.period}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div class="md:col-span-2">
                <label
                  for="itemQty{index}"
                  class="block text-sm font-medium text-gray-700 mb-1"
                  >Qty *</label
                >
                <input
                  id="itemQty{index}"
                  type="number"
                  bind:value={item.qty}
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
                  >Price (€) *</label
                >
                <input
                  id="itemPrice{index}"
                  type="number"
                  bind:value={item.unitPrice}
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

          <!-- Add Item Button -->
          <div class="pt-4 border-t items-center border-gray-300">
            <button
              type="button"
              onclick={addItem}
              class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
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
          </div>
        </div>
      </div>

      <!-- Generate Button -->
      <div class="text-center mt-8 pt-8 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading}
          class="bg-purple-600 text-white px-8 py-3 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
        >
          {loading ? 'Generating...' : 'Generate Invoice PDF'}
        </button>

        {#if loading}
          <div class="text-purple-600 text-lg mt-3">Generating invoice...</div>
        {/if}

        {#if errorMessage}
          <div
            class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mt-4"
          >
            {errorMessage}
          </div>
        {/if}

        {#if successMessage}
          <div
            class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mt-4"
          >
            {successMessage}
          </div>
        {/if}
      </div>
    </form>
  </div>
</div>
