<script lang="ts">
  import EntityManager from './EntityManager.svelte';
  import type { MyBusiness } from '$lib/database';

  interface Props {
    senderData: {
      name: string;
      entityNumber: string;
      entityType: 'entrepreneurship' | 'company';
      address: string;
      city: string;
      country: string;
      phone: string;
      iban: string;
    };
    selectedMyBusiness?: MyBusiness | null;
    showEntityManager?: boolean;
    onSenderDataChange?: (data: any) => void;
    onMyBusinessSelect?: (entity: MyBusiness | null) => void;
    onToggleEntityManager?: () => void;
  }

  const { 
    senderData, 
    selectedMyBusiness = null, 
    showEntityManager = false,
    onSenderDataChange = () => {},
    onMyBusinessSelect = () => {},
    onToggleEntityManager = () => {}
  }: Props = $props();

  function updateSenderData(field: string, value: any) {
    onSenderDataChange({ ...senderData, [field]: value });
  }
</script>

<div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-medium text-gray-700">From (My Business)</h2>
    <div class="flex items-center space-x-3">
      {#if selectedMyBusiness}
        <span class="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
          Selected: {selectedMyBusiness.name}
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
        entityType="myBusiness"
        selectedEntity={selectedMyBusiness}
        onEntitySelect={onMyBusinessSelect}
      />
    </div>
  {/if}

  <div class="space-y-4">
    <div>
      <label
        for="senderName"
        class="block text-sm font-medium text-gray-700 mb-1"
      >Name *</label>
      <input
        id="senderName"
        type="text"
        value={senderData.name}
        oninput={(e) => updateSenderData('name', (e.target as HTMLInputElement).value)}
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>

    <div>
      <label
        for="senderEntityNumber"
        class="block text-sm font-medium text-gray-700 mb-1"
      >Entity Number *</label>
      <input
        id="senderEntityNumber"
        type="text"
        value={senderData.entityNumber}
        oninput={(e) => updateSenderData('entityNumber', (e.target as HTMLInputElement).value)}
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>

    <fieldset>
      <legend class="block text-sm font-medium text-gray-700 mb-2">Entity Type *</legend>
      <div class="flex space-x-4">
        <label class="flex items-center">
          <input
            type="radio"
            value="entrepreneurship"
            checked={senderData.entityType === 'entrepreneurship'}
            onchange={() => updateSenderData('entityType', 'entrepreneurship')}
            class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500 focus:ring-2"
          />
          <span class="ml-2 text-sm text-gray-700">Individual Entrepreneurship</span>
        </label>
        <label class="flex items-center">
          <input
            type="radio"
            value="company"
            checked={senderData.entityType === 'company'}
            onchange={() => updateSenderData('entityType', 'company')}
            class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500 focus:ring-2"
          />
          <span class="ml-2 text-sm text-gray-700">Company</span>
        </label>
      </div>
    </fieldset>

    <div>
      <label
        for="senderAddress"
        class="block text-sm font-medium text-gray-700 mb-1"
      >Address *</label>
      <input
        id="senderAddress"
        type="text"
        value={senderData.address}
        oninput={(e) => updateSenderData('address', (e.target as HTMLInputElement).value)}
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>

    <div>
      <label
        for="senderCity"
        class="block text-sm font-medium text-gray-700 mb-1"
      >City *</label>
      <input
        id="senderCity"
        type="text"
        value={senderData.city}
        oninput={(e) => updateSenderData('city', (e.target as HTMLInputElement).value)}
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>

    <div>
      <label
        for="senderCountry"
        class="block text-sm font-medium text-gray-700 mb-1"
      >Country *</label>
      <input
        id="senderCountry"
        type="text"
        value={senderData.country}
        oninput={(e) => updateSenderData('country', (e.target as HTMLInputElement).value)}
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>

    <div>
      <label
        for="senderPhone"
        class="block text-sm font-medium text-gray-700 mb-1"
      >Phone</label>
      <input
        id="senderPhone"
        type="tel"
        value={senderData.phone}
        oninput={(e) => updateSenderData('phone', (e.target as HTMLInputElement).value)}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>

    <div>
      <label
        for="senderIban"
        class="block text-sm font-medium text-gray-700 mb-1"
      >IBAN</label>
      <input
        id="senderIban"
        type="text"
        value={senderData.iban}
        oninput={(e) => updateSenderData('iban', (e.target as HTMLInputElement).value)}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>
  </div>
</div>