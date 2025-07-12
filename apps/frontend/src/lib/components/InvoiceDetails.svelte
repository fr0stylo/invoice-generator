<script lang="ts">
  import ValidatedField from './ValidatedField.svelte';
  import { 
    previewNextInvoiceNumber, 
    previewTemplate, 
    updateTemplate, 
    getCurrentTemplate 
  } from '$lib/stores/invoiceCounter';
  
  interface Props {
    invoiceData: {
      invoiceNumber: string;
      taxRate: number;
      issueDate: string;
      dueDate: string;
    };
    onInvoiceDataChange?: (data: any) => void;
    onRefreshInvoiceNumber?: () => void;
  }

  const { 
    invoiceData,
    onInvoiceDataChange = () => {},
    onRefreshInvoiceNumber = () => {}
  }: Props = $props();

  let showTemplateEditor = $state(false);
  let templateInput = $state('');
  let templatePreview = $state('');

  function updateInvoiceData(field: string, value: any) {
    onInvoiceDataChange({ ...invoiceData, [field]: value });
  }

  function toggleTemplateEditor() {
    if (!showTemplateEditor) {
      // Opening editor - load current template or use invoice number as template
      const currentTemplate = getCurrentTemplate();
      const currentNumber = invoiceData.invoiceNumber;
      
      // If current number seems to be from template (contains our increment pattern), use template
      // Otherwise, use the current number as starting point
      if (currentTemplate !== 'INV-{{YEAR}}-{{MONTH}}-{{DAY}}-{{ inc }}' && 
          currentNumber.match(/INV-\d{4}-\d{2}-\d{2}-\d{3}/)) {
        templateInput = currentTemplate;
      } else {
        // Try to detect pattern from current number
        templateInput = currentNumber.replace(/\d{3}$/, '{{ inc }}');
      }
      
      updateTemplatePreview();
    }
    showTemplateEditor = !showTemplateEditor;
  }

  function updateTemplatePreview() {
    try {
      templatePreview = previewTemplate(templateInput);
    } catch (error) {
      templatePreview = 'Invalid template';
    }
  }

  function applyTemplate() {
    if (templateInput.trim()) {
      updateTemplate(templateInput);
      updateInvoiceData('invoiceNumber', previewTemplate(templateInput));
      showTemplateEditor = false;
    }
  }

  function resetToDefault() {
    templateInput = 'INV-{{YEAR}}-{{MONTH}}-{{DAY}}-{{ inc }}';
    updateTemplatePreview();
  }
</script>

<div class="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-8">
  <h2 class="text-2xl font-medium text-gray-700 mb-6">Invoice Details</h2>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="relative">
      <ValidatedField
        id="invoiceNumber"
        label="Invoice Number"
        value={invoiceData.invoiceNumber}
        required={true}
        fieldPath="invoiceNumber"
        oninput={(value) => updateInvoiceData('invoiceNumber', value)}
      />
      <div class="absolute right-2 top-9 flex gap-1">
        <button
          type="button"
          onclick={toggleTemplateEditor}
          class="text-purple-500 hover:text-purple-700 focus:outline-none"
          title="Edit invoice number template"
          aria-label="Edit template"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          type="button"
          onclick={onRefreshInvoiceNumber}
          class="text-blue-500 hover:text-blue-700 focus:outline-none"
          title="Refresh to next available invoice number"
          aria-label="Refresh invoice number"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

    <ValidatedField
      id="taxRate"
      label="Tax Rate (%)"
      type="number"
      value={invoiceData.taxRate}
      min={0}
      max={100}
      step={0.01}
      fieldPath="taxRate"
      oninput={(value) => updateInvoiceData('taxRate', value)}
    />

    <ValidatedField
      id="issueDate"
      label="Issue Date"
      type="date"
      value={invoiceData.issueDate}
      required={true}
      fieldPath="issueDate"
      oninput={(value) => updateInvoiceData('issueDate', value)}
    />

    <ValidatedField
      id="dueDate"
      label="Due Date"
      type="date"
      value={invoiceData.dueDate}
      required={true}
      fieldPath="dueDate"
      oninput={(value) => updateInvoiceData('dueDate', value)}
    />
  </div>

  <!-- Template Editor -->
  {#if showTemplateEditor}
    <div class="mt-6 p-4 bg-white border border-gray-300 rounded-lg">
      <h3 class="text-lg font-medium text-gray-800 mb-4">Invoice Number Template</h3>
      
      <div class="space-y-4">
        <div>
          <label for="templateInput" class="block text-sm font-medium text-gray-700 mb-2">
            Template Pattern
          </label>
          <input
            id="templateInput"
            type="text"
            bind:value={templateInput}
            oninput={updateTemplatePreview}
            placeholder="e.g., PROJ-&#123;&#123; inc &#125;&#125; or INV-&#123;&#123;YEAR&#125;&#125;-&#123;&#123;MONTH&#125;&#125;-&#123;&#123;DAY&#125;&#125;-&#123;&#123; inc &#125;&#125;"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p class="mt-1 text-xs text-gray-500">
            Use <code class="bg-gray-100 px-1 rounded">{`{{ inc }}`}</code> for auto-increment number. 
            Other placeholders: <code class="bg-gray-100 px-1 rounded">{`{{YEAR}}`}</code>, 
            <code class="bg-gray-100 px-1 rounded">{`{{MONTH}}`}</code>, 
            <code class="bg-gray-100 px-1 rounded">{`{{DAY}}`}</code>
          </p>
        </div>

        {#if templatePreview}
          <div>
            <div class="block text-sm font-medium text-gray-700 mb-2">Preview</div>
            <div class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-800 font-mono">
              {templatePreview}
            </div>
          </div>
        {/if}

        <div class="flex justify-between">
          <button
            type="button"
            onclick={resetToDefault}
            class="text-gray-600 hover:text-gray-800 text-sm"
          >
            Reset to Default
          </button>
          
          <div class="flex gap-2">
            <button
              type="button"
              onclick={toggleTemplateEditor}
              class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onclick={applyTemplate}
              class="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Apply Template
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>