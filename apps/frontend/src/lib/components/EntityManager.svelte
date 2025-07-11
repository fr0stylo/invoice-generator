<script lang="ts">
  import { db, type MyBusiness, type Client } from '$lib/database';
  import { onMount } from 'svelte';

  interface Props {
    entityType: 'myBusiness' | 'client';
    selectedEntity?: MyBusiness | Client | null;
    onEntitySelect?: (entity: any) => void;
  }

  const { entityType, selectedEntity = null, onEntitySelect = () => {} }: Props = $props();

  let entities: (MyBusiness | Client)[] = $state([]);
  let showForm = $state(false);
  let editingEntity: MyBusiness | Client | null = $state(null);
  let loading = $state(false);
  let errorMessage = $state('');

  let formData = $state({
    name: '',
    entityNumber: '',
    entityType: 'entrepreneurship' as 'entrepreneurship' | 'company',
    companyNumber: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phone: '',
    iban: ''
  });

  onMount(async () => {
    await loadEntities();
  });

  async function loadEntities() {
    try {
      loading = true;
      if (entityType === 'myBusiness') {
        entities = await db.myBusinesses.orderBy('name').toArray();
      } else {
        entities = await db.clients.orderBy('name').toArray();
      }
    } catch (error) {
      console.error('Error loading entities:', error);
      errorMessage = 'Failed to load entities';
    } finally {
      loading = false;
    }
  }

  function openForm(entity?: MyBusiness | Client) {
    editingEntity = entity || null;
    if (entity) {
      if (entityType === 'myBusiness') {
        const businessEntity = entity as MyBusiness;
        formData = {
          name: businessEntity.name,
          entityNumber: businessEntity.entityNumber,
          entityType: businessEntity.entityType,
          companyNumber: '',
          address: businessEntity.address,
          city: businessEntity.city,
          state: '',
          zip: '',
          country: businessEntity.country,
          phone: businessEntity.phone || '',
          iban: businessEntity.iban || ''
        };
      } else {
        const clientEntity = entity as Client;
        formData = {
          name: clientEntity.name,
          entityNumber: '',
          entityType: 'entrepreneurship',
          companyNumber: clientEntity.companyNumber || '',
          address: clientEntity.address,
          city: clientEntity.city,
          state: clientEntity.state || '',
          zip: clientEntity.zip || '',
          country: clientEntity.country,
          phone: '',
          iban: ''
        };
      }
    } else {
      formData = {
        name: '',
        entityNumber: '',
        entityType: 'entrepreneurship',
        companyNumber: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        phone: '',
        iban: ''
      };
    }
    showForm = true;
  }

  function closeForm() {
    showForm = false;
    editingEntity = null;
    errorMessage = '';
  }

  async function saveEntity() {
    try {
      loading = true;
      errorMessage = '';

      if (entityType === 'myBusiness') {
        const businessData: Omit<MyBusiness, 'id' | 'createdAt' | 'updatedAt'> = {
          name: formData.name,
          entityNumber: formData.entityNumber,
          entityType: formData.entityType,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          phone: formData.phone,
          iban: formData.iban
        };

        if (editingEntity) {
          await db.myBusinesses.update(editingEntity.id!, businessData);
        } else {
          await db.myBusinesses.add(businessData as MyBusiness);
        }
      } else {
        const clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> = {
          name: formData.name,
          companyNumber: formData.companyNumber,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country
        };

        if (editingEntity) {
          await db.clients.update(editingEntity.id!, clientData);
        } else {
          await db.clients.add(clientData as Client);
        }
      }

      await loadEntities();
      closeForm();
    } catch (error) {
      console.error('Error saving entity:', error);
      errorMessage = 'Failed to save entity';
    } finally {
      loading = false;
    }
  }

  async function deleteEntity(entity: MyBusiness | Client) {
    if (!confirm('Are you sure you want to delete this entity?')) {
      return;
    }

    try {
      loading = true;
      if (entityType === 'myBusiness') {
        await db.myBusinesses.delete(entity.id!);
      } else {
        await db.clients.delete(entity.id!);
      }
      await loadEntities();
      if (selectedEntity?.id === entity.id) {
        onEntitySelect(null);
      }
    } catch (error) {
      console.error('Error deleting entity:', error);
      errorMessage = 'Failed to delete entity';
    } finally {
      loading = false;
    }
  }

  function selectEntity(entity: MyBusiness | Client) {
    onEntitySelect(entity);
  }
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
  <div class="flex justify-between items-center mb-4">
    <h3 class="text-lg font-medium text-gray-900">
      {entityType === 'myBusiness' ? 'My Business' : 'Clients'}
    </h3>
    <button
      type="button"
      onclick={() => openForm()}
      class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
    >
      Add New
    </button>
  </div>

  {#if loading}
    <div class="text-center py-4">
      <div class="text-gray-500">Loading...</div>
    </div>
  {:else if entities.length === 0}
    <div class="text-center py-4">
      <div class="text-gray-500">No entities found</div>
    </div>
  {:else}
    <div class="space-y-2">
      {#each entities as entity (entity.id)}
        <div
          class="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          class:ring-2={selectedEntity?.id === entity.id}
          class:ring-blue-500={selectedEntity?.id === entity.id}
        >
          <div class="flex-1 cursor-pointer" onclick={() => selectEntity(entity)}>
            <div class="font-medium text-gray-900">{entity.name}</div>
            <div class="text-sm text-gray-500">
              {entity.address}, {entity.city}, {entity.country}
            </div>
            {#if entityType === 'myBusiness'}
              <div class="text-xs text-gray-400">
                {(entity as MyBusiness).entityNumber} 
                ({(entity as MyBusiness).entityType})
              </div>
            {:else if (entity as Client).companyNumber}
              <div class="text-xs text-gray-400">
                {(entity as Client).companyNumber}
              </div>
            {/if}
          </div>
          <div class="flex space-x-2">
            <button
              type="button"
              onclick={() => openForm(entity)}
              class="text-blue-500 hover:text-blue-700 text-sm"
            >
              Edit
            </button>
            <button
              type="button"
              onclick={() => deleteEntity(entity)}
              class="text-red-500 hover:text-red-700 text-sm"
            >
              Delete
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
        {editingEntity ? 'Edit' : 'Add'} {entityType === 'myBusiness' ? 'My Business' : 'Client'}
      </h3>

      <form onsubmit={(e) => { e.preventDefault(); saveEntity(); }}>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              bind:value={formData.name}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {#if entityType === 'myBusiness'}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Entity Number *</label>
              <input
                type="text"
                bind:value={formData.entityNumber}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <fieldset>
              <legend class="block text-sm font-medium text-gray-700 mb-2">Entity Type *</legend>
              <div class="flex space-x-4">
                <label class="flex items-center">
                  <input
                    type="radio"
                    bind:group={formData.entityType}
                    value="entrepreneurship"
                    class="w-4 h-4 text-blue-600"
                  />
                  <span class="ml-2 text-sm">Entrepreneurship</span>
                </label>
                <label class="flex items-center">
                  <input
                    type="radio"
                    bind:group={formData.entityType}
                    value="company"
                    class="w-4 h-4 text-blue-600"
                  />
                  <span class="ml-2 text-sm">Company</span>
                </label>
              </div>
            </fieldset>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                bind:value={formData.phone}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
              <input
                type="text"
                bind:value={formData.iban}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          {:else}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Company Number</label>
              <input
                type="text"
                bind:value={formData.companyNumber}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                bind:value={formData.state}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
              <input
                type="text"
                bind:value={formData.zip}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          {/if}

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <input
              type="text"
              bind:value={formData.address}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">City *</label>
            <input
              type="text"
              bind:value={formData.city}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Country *</label>
            <input
              type="text"
              bind:value={formData.country}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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