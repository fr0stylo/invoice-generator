<script lang="ts">
  import { onMount } from 'svelte';
  import SenderForm from '../lib/components/SenderForm.svelte';
  import BillToForm from '../lib/components/BillToForm.svelte';
  import InvoiceDetails from '../lib/components/InvoiceDetails.svelte';
  import InvoiceItems from '../lib/components/InvoiceItems.svelte';
  import { db, type MyBusiness, type Client, type LineItem } from '$lib/database';
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
  let errorMessage = $state('');
  let successMessage = $state('');
  let showSenderEntityManager = $state(false);
  let showClientEntityManager = $state(false);
  let showLineItemManager = $state(false);
  let selectedMyBusiness: MyBusiness | null = $state(null);
  let selectedClient: Client | null = $state(null);
  let selectedLineItems: LineItem[] = $state([]);

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
        iban: entity.iban || ''
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
        country: entity.country
      };
    }
  }

  function onLineItemsSelect(items: LineItem[]) {
    selectedLineItems = items;
    // Update form items with selected line items
    formData.items = items.map(item => ({
      description: item.description,
      period: '',
      qty: item.defaultQuantity,
      unitPrice: item.unitPrice
    }));
  }

  async function saveEntitiesToDatabase() {
    try {
      if (!selectedMyBusiness && formData.sender.name) {
        const businessData: Omit<MyBusiness, 'id'> = {
          ...formData.sender,
          entityType: formData.sender.entityType as 'entrepreneurship' | 'company',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const businessId = await db.myBusinesses.add(businessData);
        selectedMyBusiness = { ...businessData, id: businessId };
      }

      if (!selectedClient && formData.billTo.name) {
        const clientData = {
          ...formData.billTo,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const clientId = await db.clients.add(clientData);
        selectedClient = { ...clientData, id: clientId };
      }

      const totalAmount = formData.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
      
      const invoiceData = {
        invoiceNumber: formData.invoiceNumber,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        taxRate: formData.taxRate,
        myBusinessId: selectedMyBusiness?.id!,
        clientId: selectedClient?.id!,
        items: formData.items.filter(item => item.description && !isNaN(item.qty) && !isNaN(item.unitPrice)).map(item => ({
          ...item,
          unit: 'units'
        })),
        totalAmount: totalAmount,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.invoices.add(invoiceData);
    } catch (error) {
      console.error('Error saving entities to database:', error);
      throw error;
    }
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
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl font-normal text-gray-800">
        Invoice Generator
      </h1>
    </div>



    <form onsubmit={handleSubmit}>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SenderForm
          senderData={formData.sender}
          selectedMyBusiness={selectedMyBusiness}
          showEntityManager={showSenderEntityManager}
          onSenderDataChange={(data) => formData.sender = { ...data, entityType: (data.entityType === 'company' ? 'company' : 'entrepreneurship') as 'entrepreneurship' | 'company' }}
          onMyBusinessSelect={onMyBusinessSelect}
          onToggleEntityManager={() => showSenderEntityManager = !showSenderEntityManager}
        />
        
        <BillToForm
          billToData={formData.billTo}
          selectedClient={selectedClient}
          showEntityManager={showClientEntityManager}
          onBillToDataChange={(data) => formData.billTo = data}
          onClientSelect={onClientSelect}
          onToggleEntityManager={() => showClientEntityManager = !showClientEntityManager}
        />
      </div>

      <InvoiceDetails
        invoiceData={{
          invoiceNumber: formData.invoiceNumber,
          taxRate: formData.taxRate,
          issueDate: formData.issueDate,
          dueDate: formData.dueDate
        }}
        onInvoiceDataChange={(data) => {
          formData.invoiceNumber = data.invoiceNumber;
          formData.taxRate = data.taxRate;
          formData.issueDate = data.issueDate;
          formData.dueDate = data.dueDate;
        }}
      />

      <InvoiceItems
        items={formData.items}
        selectedLineItems={selectedLineItems}
        showLineItemManager={showLineItemManager}
        onItemsChange={(items) => formData.items = items}
        onLineItemsSelect={onLineItemsSelect}
        onToggleLineItemManager={() => showLineItemManager = !showLineItemManager}
      />

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
