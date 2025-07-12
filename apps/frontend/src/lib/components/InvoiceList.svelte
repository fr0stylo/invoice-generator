<script lang="ts">
  import { onMount } from 'svelte';
  import { db, type Invoice } from '$lib/database';
  import { showSuccess, showError } from '$lib/stores/toast';

  interface Props {
    isOpen?: boolean;
    onClose?: () => void;
    onEditInvoice?: (invoice: Invoice) => void;
  }

  const {
    isOpen = false,
    onClose = () => {},
    onEditInvoice = () => {},
  }: Props = $props();

  let invoices: Invoice[] = $state([]);
  let loading = $state(false);
  let searchTerm = $state('');

  // Filtered invoices based on search
  let filteredInvoices = $derived(
    invoices.filter(invoice => 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  onMount(() => {
    if (isOpen) {
      loadInvoices();
    }
  });

  async function loadInvoices() {
    loading = true;
    try {
      // Get invoices with related data
      const allInvoices = await db.invoices.orderBy('createdAt').reverse().toArray();
      
      // Load related myBusiness and client data
      for (const invoice of allInvoices) {
        if (invoice.myBusinessId) {
          invoice.myBusiness = await db.myBusinesses.get(invoice.myBusinessId);
        }
        if (invoice.clientId) {
          invoice.client = await db.clients.get(invoice.clientId);
        }
      }
      
      invoices = allInvoices;
    } catch (error) {
      console.error('Error loading invoices:', error);
      showError('Loading Failed', 'Could not load invoices. Please try again.');
    } finally {
      loading = false;
    }
  }

  async function deleteInvoice(invoice: Invoice) {
    if (confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
      try {
        await db.invoices.delete(invoice.id!);
        await loadInvoices(); // Reload the list
        showSuccess('Deleted', `Invoice ${invoice.invoiceNumber} deleted successfully.`);
      } catch (error) {
        console.error('Error deleting invoice:', error);
        showError('Delete Failed', 'Could not delete the invoice. Please try again.');
      }
    }
  }

  async function regenerateInvoicePDF(invoice: Invoice) {
    try {
      // Convert invoice data back to the format expected by the API
      const payload = {
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        taxRate: invoice.taxRate,
        sender: invoice.myBusiness || {},
        billTo: invoice.client || {},
        items: invoice.items || [],
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
        a.download = `invoice_${invoice.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showSuccess('Download Complete', `Invoice ${invoice.invoiceNumber} downloaded successfully.`);
      } else {
        throw new Error('Failed to regenerate invoice');
      }
    } catch (error) {
      console.error('Error regenerating invoice:', error);
      showError('Download Failed', 'Could not regenerate the invoice PDF. Please try again.');
    }
  }

  function formatDate(date: string | Date) {
    return new Date(date).toLocaleDateString();
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  // Load invoices when panel opens
  $effect(() => {
    if (isOpen) {
      loadInvoices();
    }
  });
</script>

<!-- Slide-over backdrop -->
{#if isOpen}
  <div class="fixed inset-0 z-50 overflow-hidden">
    <!-- Background overlay -->
    <div class="absolute inset-0 bg-black bg-opacity-50" onclick={onClose} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && onClose()} aria-label="Close dialog"></div>
    
    <!-- Slide-over panel -->
    <div class="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
      <div class="flex h-full flex-col">
        <!-- Header -->
        <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900">Invoice History</h2>
            <button
              onclick={onClose}
              class="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label="Close invoice list"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- Search -->
          <div class="mt-4">
            <input
              type="text"
              placeholder="Search invoices..."
              bind:value={searchTerm}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          {#if loading}
            <div class="flex items-center justify-center py-12">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span class="ml-2 text-gray-600">Loading invoices...</span>
            </div>
          {:else if filteredInvoices.length === 0}
            <div class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
              <p class="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating your first invoice.'}
              </p>
            </div>
          {:else}
            <div class="space-y-4">
              {#each filteredInvoices as invoice (invoice.id)}
                <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center space-x-3">
                        <h3 class="text-lg font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </h3>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {formatCurrency(invoice.totalAmount || 0)}
                        </span>
                      </div>
                      
                      <div class="mt-1 space-y-1">
                        <p class="text-sm text-gray-600">
                          <span class="font-medium">Client:</span> {invoice.client?.name || 'Unknown'}
                        </p>
                        <p class="text-sm text-gray-600">
                          <span class="font-medium">Issue Date:</span> {formatDate(invoice.issueDate)}
                        </p>
                        <p class="text-sm text-gray-600">
                          <span class="font-medium">Due Date:</span> {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                    </div>
                    
                    <!-- Actions -->
                    <div class="flex flex-col space-y-2 ml-4">
                      <button
                        onclick={() => onEditInvoice(invoice)}
                        class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      
                      <button
                        onclick={() => regenerateInvoicePDF(invoice)}
                        class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download
                      </button>
                      
                      <button
                        onclick={() => deleteInvoice(invoice)}
                        class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}