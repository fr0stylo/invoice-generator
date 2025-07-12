<script lang="ts">
  interface Props {
    formData: {
      invoiceNumber: string;
      issueDate: string;
      dueDate: string;
      taxRate: number;
      sender: {
        name: string;
        entityNumber: string;
        entityType: 'entrepreneurship' | 'company';
        address: string;
        city: string;
        country: string;
        phone: string;
        iban: string;
      };
      billTo: {
        name: string;
        companyNumber: string;
        address: string;
        city: string;
        state: string;
        zip: string;
        country: string;
      };
      items: Array<{
        description: string;
        period: string;
        qty: number;
        unitPrice: number;
      }>;
    };
  }

  const { formData }: Props = $props();

  const subtotal = $derived(formData.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0));
  const taxAmount = $derived(subtotal * (formData.taxRate / 100));
  const total = $derived(subtotal + taxAmount);
</script>

<!-- A4 Paper dimensions scaled to screen (595px × 842px scaled to fit) -->
<div class="bg-white mx-auto" style="width: 595px; min-height: 842px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); font-family: system-ui, -apple-system, sans-serif;">
  <!-- Red gradient header line -->
  <div style="height: 5px; background: linear-gradient(to right, #E33939, #972A2A);"></div>
  <!-- Black line -->
  <div style="height: 0.1px; background: #000000;"></div>
  
  <!-- Main content with 72px margins (scaled down proportionally) -->
  <div style="padding: 36px;">
    <!-- Invoice Title -->
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="font-size: 24px; font-weight: 600; color: #000000; margin: 0;">Invoice</h1>
    </div>

    <!-- Invoice Details (top right) -->
    <div style="text-align: left; margin-bottom: 32px;">
      <div style="display: inline-block; text-align: left; max-width: 200px;">
        <table style="font-size: 10px; line-height: 1.4;">
          <tbody>
            <tr>
              <td style="font-weight: 600; padding-right: 12px;">Invoice Number:</td>
              <td>{formData.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; padding-right: 12px;">Issue Date:</td>
              <td>{formData.issueDate}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; padding-right: 12px;">Due Date:</td>
              <td>{formData.dueDate}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Parties Section (Two Columns with 50px gap) -->
    <div style="display: flex; gap: 50px; margin-bottom: 32px;">
      <!-- Issued To (Left Column) -->
      <div style="flex: 1;">
        <h3 style="font-size: 12px; font-weight: 600; color: #000000; margin-bottom: 8px;">Issued To</h3>
        <div style="font-size: 10px; line-height: 1.4; color: #000000;">
          <div style="margin-bottom: 4px;">{formData.billTo.name}</div>
          {#if formData.billTo.companyNumber}
            <div style="margin-bottom: 4px;">Company Number: {formData.billTo.companyNumber}</div>
          {/if}
          <div style="margin-bottom: 4px;">{formData.billTo.address}</div>
          <div style="margin-bottom: 4px;">{formData.billTo.city}{formData.billTo.state ? `, ${formData.billTo.state}` : ''}{formData.billTo.zip ? ` ${formData.billTo.zip}` : ''}</div>
          <div>{formData.billTo.country}</div>
        </div>
      </div>

      <!-- From (Right Column) -->
      <div style="flex: 1;">
        <h3 style="font-size: 12px; font-weight: 600; color: #000000; margin-bottom: 8px;">From</h3>
        <div style="font-size: 10px; line-height: 1.4; color: #000000;">
          <div style="margin-bottom: 4px;">{formData.sender.name}</div>
          <div style="margin-bottom: 4px;">{formData.sender.entityType === 'company' ? 'Company number' : 'Individual entrepreneurship number'}: {formData.sender.entityNumber}</div>
          <div style="margin-bottom: 4px;">{formData.sender.address}</div>
          <div style="margin-bottom: 4px;">{formData.sender.city}, {formData.sender.country}</div>
          {#if formData.sender.phone}
            <div style="margin-bottom: 4px;">Phone: {formData.sender.phone}</div>
          {/if}
          {#if formData.sender.iban}
            <div>IBAN: {formData.sender.iban}</div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <div style="margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #D3D1D1;">
            <th style="text-align: left; padding: 0.5em; font-size: 10px; font-weight: 600; color: #000000; width: 250px; border-bottom: 0.5px solid #aaaaaa;">Description</th>
            <th style="text-align: right; padding: 0.5em; font-size: 10px; font-weight: 600; color: #000000; width: 70px; border-bottom: 0.5px solid #aaaaaa;">Qty</th>
            <th style="text-align: right; padding: 0.5em; font-size: 10px; font-weight: 600; color: #000000; width: 70px; border-bottom: 0.5px solid #aaaaaa;">Unit Price</th>
            <th style="text-align: right; padding: 0.5em; font-size: 10px; font-weight: 600; color: #000000; width: 70px; border-bottom: 0.5px solid #aaaaaa;">Amount</th>
          </tr>
        </thead>
        <tbody>
          {#each formData.items.filter(item => item.description && !isNaN(item.qty) && !isNaN(item.unitPrice)) as item}
            <tr style="background-color: #f0f0f0;">
              <td style="padding: 0.5em; font-size: 10px; color: #000000; border-bottom: 0.5px solid #aaaaaa; min-height: 2em; vertical-align: top;">
                <div>{item.description}</div>
                {#if item.period}
                  <div style="margin-top: 4px; font-style: italic;">{item.period}</div>
                {/if}
              </td>
              <td style="padding: 0.5em; font-size: 10px; color: #000000; border-bottom: 0.5px solid #aaaaaa; text-align: right; vertical-align: top;">{item.qty}</td>
              <td style="padding: 0.5em; font-size: 10px; color: #000000; border-bottom: 0.5px solid #aaaaaa; text-align: right; vertical-align: top;">€{item.unitPrice.toFixed(2)}</td>
              <td style="padding: 0.5em; font-size: 10px; color: #000000; border-bottom: 0.5px solid #aaaaaa; text-align: right; vertical-align: top;">€{(item.qty * item.unitPrice).toFixed(2)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Summary Section (Right-aligned spanning last two columns) -->
    <div style="margin-top: 16px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>
          <tr>
            <td style="width: 390px;"></td> <!-- Empty space for first two columns -->
            <td style="padding: 0.5em; font-size: 10px; font-weight: 600; color: #000000; text-align: right; border-bottom: 0.5px solid #aaaaaa;">Subtotal</td>
            <td style="padding: 0.5em; font-size: 10px; color: #000000; text-align: right; border-bottom: 0.5px solid #aaaaaa;">€{subtotal.toFixed(2)}</td>
          </tr>
          {#if formData.taxRate > 0}
            <tr>
              <td style="width: 390px;"></td>
              <td style="padding: 0.5em; font-size: 10px; font-weight: 600; color: #000000; text-align: right; border-bottom: 0.5px solid #aaaaaa;">Tax ({formData.taxRate}%)</td>
              <td style="padding: 0.5em; font-size: 10px; color: #000000; text-align: right; border-bottom: 0.5px solid #aaaaaa;">€{taxAmount.toFixed(2)}</td>
            </tr>
          {/if}
          <tr>
            <td style="width: 390px;"></td>
            <td style="padding: 0.5em; font-size: 10px; font-weight: 600; color: #000000; text-align: right; border-bottom: 0.5px solid #aaaaaa;">Total</td>
            <td style="padding: 0.5em; font-size: 10px; color: #000000; text-align: right; border-bottom: 0.5px solid #aaaaaa;">€{total.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="width: 390px;"></td>
            <td style="padding: 0.5em; font-size: 10px; font-weight: 600; color: #000000; text-align: right; border-bottom: 0.5px solid #aaaaaa;">Amount Due</td>
            <td style="padding: 0.5em; font-size: 10px; color: #000000; text-align: right; border-bottom: 0.5px solid #aaaaaa;">€{total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
