<script lang="ts">
  import { onMount } from 'svelte';
  import SenderForm from '../lib/components/SenderForm.svelte';
  import BillToForm from '../lib/components/BillToForm.svelte';
  import InvoiceDetails from '../lib/components/InvoiceDetails.svelte';
  import InvoiceItems from '../lib/components/InvoiceItems.svelte';
  import InvoicePreview from '../lib/components/InvoicePreview.svelte';
  import InvoiceList from '../lib/components/InvoiceList.svelte';
  import ToastContainer from '../lib/components/ToastContainer.svelte';
  import {
    db,
    type MyBusiness,
    type Client,
    type LineItem,
  } from '$lib/database';
  import {
    validationErrors,
    showValidationErrors as showValidationStore,
    validateFormData,
    validateSingleField,
    clearAllErrors,
  } from '$lib/stores/validation';
  import { showSuccess, showError } from '$lib/stores/toast';
  import { 
    generateNextInvoiceNumber, 
    previewNextInvoiceNumber,
    generateFromTemplate,
    getCurrentTemplate 
  } from '$lib/stores/invoiceCounter';
  const browser = typeof window !== 'undefined';

  let formData = $state({
    invoiceNumber: '',
    issueDate: '',
    dueDate: '',
    taxRate: 0,
    sender: {
      name: '',
      entityNumber: '',
      entityType: 'entrepreneurship' as 'entrepreneurship' | 'company',
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
  let showSenderEntityManager = $state(false);
  let showClientEntityManager = $state(false);
  let showLineItemManager = $state(false);
  let showPreview = $state(false);
  let showInvoiceList = $state(false);
  let selectedMyBusiness: MyBusiness | null = $state(null);
  let selectedClient: Client | null = $state(null);
  let selectedLineItems: LineItem[] = $state([]);

  // Validation state - using stores for proper reactivity
  let fieldErrors = $state<Record<string, string>>({});
  let showValidationErrors = $state(false);

  // Subscribe to validation stores
  validationErrors.subscribe((errors) => {
    fieldErrors = errors;
  });

  showValidationStore.subscribe((show) => {
    showValidationErrors = show;
  });

  const STORAGE_KEY = 'invoice-form-data';

  // Load data from localStorage on mount
  onMount(() => {
    if (browser) {
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
        formData.invoiceNumber = previewNextInvoiceNumber();
      }
    }
  });


  function validateForm() {
    return validateFormData(formData);
  }

  // Real-time validation function using store
  function validateField(fieldPath: string, value: any) {
    if (!showValidationErrors) return;
    validateSingleField(fieldPath, formData);
  }

  function onMyBusinessSelect(entity: MyBusiness | null) {
    selectedMyBusiness = entity;
    if (entity) {
      formData.sender = {
        name: entity.name,
        entityNumber: entity.entityNumber,
        entityType: entity.entityType,
        address: entity.address,
        city: entity.city,
        country: entity.country,
        phone: entity.phone || '',
        iban: entity.iban || '',
      };
    }
  }

  function onClientSelect(entity: Client | null) {
    selectedClient = entity;
    if (entity) {
      formData.billTo = {
        name: entity.name,
        companyNumber: entity.companyNumber || '',
        address: entity.address,
        city: entity.city,
        state: entity.state || '',
        zip: entity.zip || '',
        country: entity.country,
      };
    }
  }

  function onLineItemsSelect(items: LineItem[]) {
    selectedLineItems = items;
    // Update form items with selected line items
    formData.items = items.map((item) => ({
      description: item.description,
      period: '',
      qty: item.defaultQuantity,
      unitPrice: item.unitPrice,
    }));
  }

  async function saveEntitiesToDatabase() {
    try {
      if (!selectedMyBusiness && formData.sender.name) {
        const businessData: Omit<MyBusiness, 'id'> = {
          ...formData.sender,
          entityType: formData.sender.entityType as
            | 'entrepreneurship'
            | 'company',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const businessId = await db.myBusinesses.add(businessData);
        selectedMyBusiness = { ...businessData, id: businessId };
      }

      if (!selectedClient && formData.billTo.name) {
        const clientData = {
          ...formData.billTo,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const clientId = await db.clients.add(clientData);
        selectedClient = { ...clientData, id: clientId };
      }

      const totalAmount = formData.items.reduce(
        (sum, item) => sum + item.qty * item.unitPrice,
        0
      );

      const invoiceData = {
        invoiceNumber: formData.invoiceNumber,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        taxRate: formData.taxRate,
        myBusinessId: selectedMyBusiness?.id!,
        clientId: selectedClient?.id!,
        items: formData.items
          .filter(
            (item) =>
              item.description && !isNaN(item.qty) && !isNaN(item.unitPrice)
          )
          .map((item) => ({
            ...item,
            unit: 'units',
          })),
        totalAmount: totalAmount,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.invoices.add(invoiceData);
    } catch (error) {
      console.error('Error saving entities to database:', error);
      throw error;
    }
  }

  // Refresh invoice number to next available
  function refreshInvoiceNumber() {
    formData.invoiceNumber = previewNextInvoiceNumber();
  }

  // Load invoice data for editing
  function onEditInvoice(invoice: any) {
    // Load the invoice data into the form
    formData.invoiceNumber = invoice.invoiceNumber;
    formData.issueDate = invoice.issueDate;
    formData.dueDate = invoice.dueDate;
    formData.taxRate = invoice.taxRate;
    
    // Load sender data
    if (invoice.myBusiness) {
      formData.sender = {
        name: invoice.myBusiness.name,
        entityNumber: invoice.myBusiness.entityNumber,
        entityType: invoice.myBusiness.entityType,
        address: invoice.myBusiness.address,
        city: invoice.myBusiness.city,
        country: invoice.myBusiness.country,
        phone: invoice.myBusiness.phone || '',
        iban: invoice.myBusiness.iban || '',
      };
      selectedMyBusiness = invoice.myBusiness;
    }
    
    // Load client data
    if (invoice.client) {
      formData.billTo = {
        name: invoice.client.name,
        companyNumber: invoice.client.companyNumber || '',
        address: invoice.client.address,
        city: invoice.client.city,
        state: invoice.client.state || '',
        zip: invoice.client.zip || '',
        country: invoice.client.country,
      };
      selectedClient = invoice.client;
    }
    
    // Load items
    if (invoice.items && invoice.items.length > 0) {
      formData.items = invoice.items.map((item: any) => ({
        description: item.description,
        period: item.period || '',
        qty: item.qty,
        unitPrice: item.unitPrice,
      }));
    }
    
    // Close the invoice list and clear any validation errors
    showInvoiceList = false;
    clearAllErrors();
    showValidationStore.set(false);
    
    showSuccess('Invoice Loaded', `Invoice ${invoice.invoiceNumber} loaded for editing.`);
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();

    console.log('Form submitted, validating...');

    // Clear existing errors and enable validation display
    clearAllErrors();
    showValidationStore.set(true);

    const errors = validateForm();
    console.log('Validation errors:', errors);
    console.log('Field errors:', fieldErrors);

    if (errors.length > 0) {
      showError('Validation Error', 'Please fix the validation errors above before submitting.');
      return;
    }

    loading = true;

    try {
      // Check if user modified the invoice number from the default preview
      const currentPreview = previewNextInvoiceNumber();
      
      // If user changed the invoice number, treat it as a custom template
      if (formData.invoiceNumber !== currentPreview && formData.invoiceNumber.trim()) {
        // Use the user's custom format
        const actualInvoiceNumber = generateFromTemplate(formData.invoiceNumber);
        formData.invoiceNumber = actualInvoiceNumber;
      } else {
        // Use standard generation
        const actualInvoiceNumber = generateNextInvoiceNumber();
        formData.invoiceNumber = actualInvoiceNumber;
      }
      
      await saveEntitiesToDatabase();

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

        showSuccess('Success!', 'Invoice generated and downloaded successfully!');
        
        // Refresh the invoice number for the next invoice
        formData.invoiceNumber = previewNextInvoiceNumber();
      } else {
        const errorData = await response.json();
        showError('Generation Failed', errorData.error || 'Failed to generate invoice');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Network Error', 'Network error occurred. Please try again.');
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-purple-300 to-blue-300 p-5">
  <div class="max-w-6xl mx-auto bg-white rounded-xl shadow-2xl p-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl font-normal text-gray-800">Invoice Generator</h1>
      <button
        type="button"
        onclick={() => (showInvoiceList = true)}
        class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Invoice History
      </button>
    </div>

    <form onsubmit={handleSubmit} novalidate>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SenderForm
          senderData={formData.sender}
          {selectedMyBusiness}
          showEntityManager={showSenderEntityManager}
          onSenderDataChange={(data) => {
            formData.sender = {
              ...data,
              entityType: (data.entityType === 'company'
                ? 'company'
                : 'entrepreneurship') as 'entrepreneurship' | 'company',
            };
            // Real-time validation for sender fields
            if (showValidationErrors) {
              validateField('sender.name', data.name);
              validateField('sender.entityNumber', data.entityNumber);
              validateField('sender.address', data.address);
              validateField('sender.city', data.city);
              validateField('sender.country', data.country);
            }
          }}
          {onMyBusinessSelect}
          onToggleEntityManager={() =>
            (showSenderEntityManager = !showSenderEntityManager)}
        />

        <BillToForm
          billToData={formData.billTo}
          {selectedClient}
          showEntityManager={showClientEntityManager}
          onBillToDataChange={(data) => {
            formData.billTo = data;
            // Real-time validation for bill-to fields
            if (showValidationErrors) {
              validateField('billTo.name', data.name);
              validateField('billTo.address', data.address);
              validateField('billTo.city', data.city);
              validateField('billTo.country', data.country);
            }
          }}
          {onClientSelect}
          onToggleEntityManager={() =>
            (showClientEntityManager = !showClientEntityManager)}
        />
      </div>

      <InvoiceDetails
        invoiceData={{
          invoiceNumber: formData.invoiceNumber,
          taxRate: formData.taxRate,
          issueDate: formData.issueDate,
          dueDate: formData.dueDate,
        }}
        onInvoiceDataChange={(data) => {
          formData.invoiceNumber = data.invoiceNumber;
          formData.taxRate = data.taxRate;
          formData.issueDate = data.issueDate;
          formData.dueDate = data.dueDate;
          // Real-time validation for invoice details
          if (showValidationErrors) {
            validateField('invoiceNumber', data.invoiceNumber);
            validateField('issueDate', data.issueDate);
            validateField('dueDate', data.dueDate);
          }
        }}
        onRefreshInvoiceNumber={refreshInvoiceNumber}
      />

      <InvoiceItems
        items={formData.items}
        {selectedLineItems}
        {showLineItemManager}
        onItemsChange={(items) => (formData.items = items)}
        {onLineItemsSelect}
        onToggleLineItemManager={() =>
          (showLineItemManager = !showLineItemManager)}
      />

      <!-- Items validation error -->
      {#if showValidationErrors && fieldErrors['items']}
        <div class="mt-2">
          <p class="text-sm text-red-600">{fieldErrors['items']}</p>
        </div>
      {/if}

      <!-- Preview Section -->
      {#if showPreview}
        <div class="pt-8 mt-8 border-t border-gray-200">
          <div class="mb-8">
            <InvoicePreview {formData} />
          </div>
        </div>
      {/if}

      <!-- Generate Button -->
      <div
        class="text-center mt-8 pt-8 border-t flex justify-center gap-2 border-gray-200"
      >
        <button
          type="button"
          onclick={() => (showPreview = !showPreview)}
          class="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors text-md font-medium"
        >
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
        <button
          type="submit"
          disabled={loading}
          class="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-md font-medium"
        >
          {loading ? 'Generating...' : 'Generate Invoice PDF'}
        </button>

        {#if loading}
          <div class="text-purple-600 text-lg mt-3">Generating invoice...</div>
        {/if}
      </div>
    </form>
  </div>
  
  <!-- Invoice List Component -->
  <InvoiceList
    isOpen={showInvoiceList}
    onClose={() => (showInvoiceList = false)}
    onEditInvoice={onEditInvoice}
  />
  
  <!-- Toast Notifications -->
  <ToastContainer />
</div>
