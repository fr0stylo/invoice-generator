<script lang="ts">
  interface Props {
    invoiceData: {
      invoiceNumber: string;
      taxRate: number;
      issueDate: string;
      dueDate: string;
    };
    onInvoiceDataChange?: (data: any) => void;
  }

  const { 
    invoiceData, 
    onInvoiceDataChange = () => {}
  }: Props = $props();

  function updateInvoiceData(field: string, value: any) {
    onInvoiceDataChange({ ...invoiceData, [field]: value });
  }
</script>

<div class="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-8">
  <h2 class="text-2xl font-medium text-gray-700 mb-6">Invoice Details</h2>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div>
      <label
        for="invoiceNumber"
        class="block text-sm font-medium text-gray-700 mb-1"
      >Invoice Number *</label>
      <input
        id="invoiceNumber"
        type="text"
        value={invoiceData.invoiceNumber}
        oninput={(e) => updateInvoiceData('invoiceNumber', (e.target as HTMLInputElement).value)}
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>

    <div>
      <label
        for="taxRate"
        class="block text-sm font-medium text-gray-700 mb-1"
      >Tax Rate (%)</label>
      <input
        id="taxRate"
        type="number"
        value={invoiceData.taxRate}
        oninput={(e) => updateInvoiceData('taxRate', parseFloat((e.target as HTMLInputElement).value) || 0)}
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
      >Issue Date *</label>
      <input
        id="issueDate"
        type="date"
        value={invoiceData.issueDate}
        oninput={(e) => updateInvoiceData('issueDate', (e.target as HTMLInputElement).value)}
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>

    <div>
      <label
        for="dueDate"
        class="block text-sm font-medium text-gray-700 mb-1"
      >Due Date *</label>
      <input
        id="dueDate"
        type="date"
        value={invoiceData.dueDate}
        oninput={(e) => updateInvoiceData('dueDate', (e.target as HTMLInputElement).value)}
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>
  </div>
</div>