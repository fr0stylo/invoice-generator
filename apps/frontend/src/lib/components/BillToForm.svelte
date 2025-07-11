<script lang="ts">
  import EntityManager from './EntityManager.svelte';
  import type { Client } from '$lib/database';

  interface Props {
    billToData: {
      name: string;
      companyNumber: string;
      address: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    selectedClient?: Client | null;
    showEntityManager?: boolean;
    onBillToDataChange?: (data: any) => void;
    onClientSelect?: (entity: Client | null) => void;
    onToggleEntityManager?: () => void;
  }

  const { 
    billToData, 
    selectedClient = null, 
    showEntityManager = false,
    onBillToDataChange = () => {},
    onClientSelect = () => {},
    onToggleEntityManager = () => {}
  }: Props = $props();

  function updateBillToData(field: string, value: any) {
    onBillToDataChange({ ...billToData, [field]: value });
  }
</script>

<div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-medium text-gray-700">To (Client)</h2>
    <div class="flex items-center space-x-3">
      {#if selectedClient}
        <span class="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
          Selected: {selectedClient.name}
        </span>
      {/if}
      <button
        type="button"
        onclick={onToggleEntityManager}
        class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md transition-colors text-sm"
      >
        {showEntityManager ? 'Hide' : 'Show'} Contacts
      </button>
    </div>
  </div>

  {#if showEntityManager}
    <div class="mb-6">
      <EntityManager
        entityType="client"
        selectedEntity={selectedClient}
        onEntitySelect={onClientSelect}
      />
    </div>
  {/if}

  <div class="space-y-4">
    <div>
      <label
        for="billToName"
        class="block text-sm font-medium text-gray-700 mb-1"
      >Name *</label>
      <input
        id="billToName"
        type="text"
        value={billToData.name}
        oninput={(e) => updateBillToData('name', (e.target as HTMLInputElement).value)}
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>

    <div>
      <label
        for="billToCompanyNumber"
        class="block text-sm font-medium text-gray-700 mb-1"
      >Company Number</label>
      <input
        id="billToCompanyNumber"
        type="text"
        value={billToData.companyNumber}
        oninput={(e) => updateBillToData('companyNumber', (e.target as HTMLInputElement).value)}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>

    <div>
      <label
        for="billToAddress"
        class="block text-sm font-medium text-gray-700 mb-1"
      >Address *</label>
      <input
        id="billToAddress"
        type="text"
        value={billToData.address}
        oninput={(e) => updateBillToData('address', (e.target as HTMLInputElement).value)}
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>

    <div>
      <label
        for="billToCity"
        class="block text-sm font-medium text-gray-700 mb-1"
      >City *</label>
      <input
        id="billToCity"
        type="text"
        value={billToData.city}
        oninput={(e) => updateBillToData('city', (e.target as HTMLInputElement).value)}
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>

    <div>
      <label
        for="billToState"
        class="block text-sm font-medium text-gray-700 mb-1"
      >State</label>
      <input
        id="billToState"
        type="text"
        value={billToData.state}
        oninput={(e) => updateBillToData('state', (e.target as HTMLInputElement).value)}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>

    <div>
      <label
        for="billToZip"
        class="block text-sm font-medium text-gray-700 mb-1"
      >ZIP Code</label>
      <input
        id="billToZip"
        type="text"
        value={billToData.zip}
        oninput={(e) => updateBillToData('zip', (e.target as HTMLInputElement).value)}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>

    <div>
      <label
        for="billToCountry"
        class="block text-sm font-medium text-gray-700 mb-1"
      >Country *</label>
      <input
        id="billToCountry"
        type="text"
        value={billToData.country}
        oninput={(e) => updateBillToData('country', (e.target as HTMLInputElement).value)}
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>
  </div>
</div>