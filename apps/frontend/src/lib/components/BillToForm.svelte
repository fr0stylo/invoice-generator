<script lang="ts">
  import EntityManager from './EntityManager.svelte';
  import ValidatedField from './ValidatedField.svelte';
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
        class="bg-blue-500 hover:bg-blue-600 text-white  px-4 py-2  rounded-md transition-colors text-sm"
      >
        {showEntityManager ? 'Hide' : 'Show'} Client
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
    <ValidatedField
      id="billToName"
      label="Name"
      value={billToData.name}
      required={true}
      fieldPath="billTo.name"
      oninput={(value) => updateBillToData('name', value)}
    />

    <ValidatedField
      id="billToCompanyNumber"
      label="Company Number"
      value={billToData.companyNumber}
      fieldPath="billTo.companyNumber"
      oninput={(value) => updateBillToData('companyNumber', value)}
    />

    <ValidatedField
      id="billToAddress"
      label="Address"
      value={billToData.address}
      required={true}
      fieldPath="billTo.address"
      oninput={(value) => updateBillToData('address', value)}
    />

    <ValidatedField
      id="billToCity"
      label="City"
      value={billToData.city}
      required={true}
      fieldPath="billTo.city"
      oninput={(value) => updateBillToData('city', value)}
    />

    <ValidatedField
      id="billToState"
      label="State"
      value={billToData.state}
      fieldPath="billTo.state"
      oninput={(value) => updateBillToData('state', value)}
    />

    <ValidatedField
      id="billToZip"
      label="ZIP Code"
      value={billToData.zip}
      fieldPath="billTo.zip"
      oninput={(value) => updateBillToData('zip', value)}
    />

    <ValidatedField
      id="billToCountry"
      label="Country"
      value={billToData.country}
      required={true}
      fieldPath="billTo.country"
      oninput={(value) => updateBillToData('country', value)}
    />
  </div>
</div>
