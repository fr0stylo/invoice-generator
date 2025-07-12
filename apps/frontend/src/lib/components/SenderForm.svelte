<script lang="ts">
  import EntityManager from './EntityManager.svelte';
  import ValidatedField from './ValidatedField.svelte';
  import RadioGroup from './RadioGroup.svelte';
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
    onToggleEntityManager = () => {},
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
        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors text-sm"
      >
        {showEntityManager ? 'Hide' : 'Show'} Business
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
    <ValidatedField
      id="senderName"
      label="Name"
      value={senderData.name}
      required={true}
      fieldPath="sender.name"
      oninput={(value) => updateSenderData('name', value)}
    />

    <ValidatedField
      id="senderEntityNumber"
      label="Entity Number"
      value={senderData.entityNumber}
      required={true}
      fieldPath="sender.entityNumber"
      oninput={(value) => updateSenderData('entityNumber', value)}
    />

    <RadioGroup
      legend="Entity Type"
      options={[
        { value: 'entrepreneurship', label: 'Individual Entrepreneurship' },
        { value: 'company', label: 'Company' },
      ]}
      value={senderData.entityType}
      required={true}
      onchange={(value) => updateSenderData('entityType', value)}
    />

    <ValidatedField
      id="senderAddress"
      label="Address"
      value={senderData.address}
      required={true}
      fieldPath="sender.address"
      oninput={(value) => updateSenderData('address', value)}
    />

    <ValidatedField
      id="senderCity"
      label="City"
      value={senderData.city}
      required={true}
      fieldPath="sender.city"
      oninput={(value) => updateSenderData('city', value)}
    />

    <ValidatedField
      id="senderCountry"
      label="Country"
      value={senderData.country}
      required={true}
      fieldPath="sender.country"
      oninput={(value) => updateSenderData('country', value)}
    />

    <ValidatedField
      id="senderPhone"
      label="Phone"
      type="tel"
      value={senderData.phone}
      fieldPath="sender.phone"
      oninput={(value) => updateSenderData('phone', value)}
    />

    <ValidatedField
      id="senderIban"
      label="IBAN"
      value={senderData.iban}
      fieldPath="sender.iban"
      oninput={(value) => updateSenderData('iban', value)}
    />
  </div>
</div>
