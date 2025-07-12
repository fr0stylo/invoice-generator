import { test, expect } from '@playwright/test';
import { InvoiceGeneratorPage } from '../utils/pageHelpers';
import { validSenderData, validClientData, validInvoiceData, validLineItems, invalidSenderData, invalidClientData, invalidLineItems } from '../fixtures/testData';

test.describe('Form Validation Tests', () => {
  let invoicePage: InvoiceGeneratorPage;

  test.beforeEach(async ({ page }) => {
    invoicePage = new InvoiceGeneratorPage(page);
    await invoicePage.goto();
    await invoicePage.clearLocalStorage();
  });

  test.describe('Sender Form Validation', () => {
    test('should show validation errors for empty required sender fields', async () => {
      // Try to submit without filling sender fields
      await invoicePage.generateInvoiceButton.click();
      
      // Wait for validation to trigger
      await invoicePage.waitForToast('Validation Error');
      
      // Check that validation errors are visible
      const errors = await invoicePage.getValidationErrors();
      expect(errors.some(error => error.includes('Name is required'))).toBe(true);
      expect(errors.some(error => error.includes('Entity number is required'))).toBe(true);
      expect(errors.some(error => error.includes('Address is required'))).toBe(true);
      expect(errors.some(error => error.includes('City is required'))).toBe(true);
      expect(errors.some(error => error.includes('Country is required'))).toBe(true);
    });

    test('should accept valid sender data', async () => {
      await invoicePage.fillSenderForm(validSenderData);
      
      // Check that no validation errors are shown for sender fields
      const senderErrors = await invoicePage.page.locator('input[id*="sender"] ~ .text-red-600').count();
      expect(senderErrors).toBe(0);
    });

    test('should validate entity type selection', async () => {
      await invoicePage.fillSenderForm({ ...validSenderData, entityType: 'company' });
      await expect(invoicePage.senderEntityTypeCompany).toBeChecked();
      
      await invoicePage.senderEntityTypeEntrepreneurship.check();
      await expect(invoicePage.senderEntityTypeEntrepreneurship).toBeChecked();
      await expect(invoicePage.senderEntityTypeCompany).not.toBeChecked();
    });
  });

  test.describe('Client Form Validation', () => {
    test('should show validation errors for empty required client fields', async () => {
      await invoicePage.fillSenderForm(validSenderData);
      await invoicePage.generateInvoiceButton.click();
      
      await invoicePage.waitForToast('Validation Error');
      
      const errors = await invoicePage.getValidationErrors();
      expect(errors.some(error => error.includes('Client name is required'))).toBe(true);
      expect(errors.some(error => error.includes('Address is required'))).toBe(true);
      expect(errors.some(error => error.includes('City is required'))).toBe(true);
      expect(errors.some(error => error.includes('Country is required'))).toBe(true);
    });

    test('should accept valid client data', async () => {
      await invoicePage.fillClientForm(validClientData);
      
      // Check that no validation errors are shown for client fields
      const clientErrors = await invoicePage.page.locator('input[id*="billTo"] ~ .text-red-600').count();
      expect(clientErrors).toBe(0);
    });
  });

  test.describe('Invoice Details Validation', () => {
    test('should show validation errors for empty invoice details', async () => {
      await invoicePage.fillSenderForm(validSenderData);
      await invoicePage.fillClientForm(validClientData);
      
      // Clear invoice details
      await invoicePage.invoiceNumber.fill('');
      await invoicePage.issueDate.fill('');
      await invoicePage.dueDate.fill('');
      
      await invoicePage.generateInvoiceButton.click();
      await invoicePage.waitForToast('Validation Error');
      
      const errors = await invoicePage.getValidationErrors();
      expect(errors.some(error => error.includes('Invoice number is required'))).toBe(true);
      expect(errors.some(error => error.includes('Issue date is required'))).toBe(true);
      expect(errors.some(error => error.includes('Due date is required'))).toBe(true);
    });

    test('should validate tax rate range', async () => {
      // Fill required fields first so we can focus on tax rate validation
      await invoicePage.fillSenderForm(validSenderData);
      await invoicePage.fillClientForm(validClientData);
      await invoicePage.fillInvoiceDetails(validInvoiceData);
      await invoicePage.fillLineItem(0, validLineItems[0]);
      
      await invoicePage.taxRate.fill('-5');
      await invoicePage.generateInvoiceButton.click();
      
      // Tax rate should be >= 0
      const errors = await invoicePage.getValidationErrors();
      expect(errors.some(error => error.includes('Tax rate must be 0 or greater'))).toBe(true);
      
      await invoicePage.taxRate.fill('150');
      await invoicePage.generateInvoiceButton.click();
      
      // Tax rate should be <= 100
      const errors2 = await invoicePage.getValidationErrors();
      expect(errors2.some(error => error.includes('Tax rate cannot exceed 100%'))).toBe(true);
    });

    test('should accept valid invoice details', async () => {
      await invoicePage.fillInvoiceDetails(validInvoiceData);
      
      await expect(invoicePage.invoiceNumber).toHaveValue(validInvoiceData.invoiceNumber);
      await expect(invoicePage.taxRate).toHaveValue(validInvoiceData.taxRate.toString());
      await expect(invoicePage.issueDate).toHaveValue(validInvoiceData.issueDate);
      await expect(invoicePage.dueDate).toHaveValue(validInvoiceData.dueDate);
    });
  });

  test.describe('Line Items Validation', () => {
    test('should show validation errors for empty line items', async () => {
      await invoicePage.fillSenderForm(validSenderData);
      await invoicePage.fillClientForm(validClientData);
      await invoicePage.fillInvoiceDetails(validInvoiceData);
      
      // Clear the default line item
      await invoicePage.fillLineItem(0, invalidLineItems[0]);
      
      await invoicePage.generateInvoiceButton.click();
      await invoicePage.waitForToast('Validation Error');
      
      const errors = await invoicePage.getValidationErrors();
      expect(errors.some(error => error.includes('Item 1 description: Description is required'))).toBe(true);
      expect(errors.some(error => error.includes('Item 1 price: Price must be greater than 0'))).toBe(true);
    });

    test('should validate quantity and price fields', async () => {
      // Fill required fields first  
      await invoicePage.fillSenderForm(validSenderData);
      await invoicePage.fillClientForm(validClientData);
      await invoicePage.fillInvoiceDetails(validInvoiceData);
      
      // Test quantity validation
      await invoicePage.fillLineItem(0, {
        description: 'Test Service',
        period: 'Test Period',
        qty: 0,
        unitPrice: 100
      });
      
      await invoicePage.generateInvoiceButton.click();
      
      const errors = await invoicePage.getValidationErrors();
      expect(errors.some(error => error.includes('Item 1 quantity: Quantity must be greater than 0'))).toBe(true);
    });

    test('should accept valid line items', async () => {
      await invoicePage.fillLineItem(0, validLineItems[0]);
      
      const descriptionField = invoicePage.page.locator('input[id*="itemDescription0"]');
      const qtyField = invoicePage.page.locator('input[id*="itemQty0"]');
      const priceField = invoicePage.page.locator('input[id*="itemPrice0"]');
      
      await expect(descriptionField).toHaveValue(validLineItems[0].description);
      await expect(qtyField).toHaveValue(validLineItems[0].qty.toString());
      await expect(priceField).toHaveValue(validLineItems[0].unitPrice.toString());
    });

    test('should allow adding and removing line items', async () => {
      // Add a new line item
      await invoicePage.addItemButton.click();
      
      // Should now have 2 line items
      const lineItems = await invoicePage.page.locator('input[id*="itemDescription"]').count();
      expect(lineItems).toBe(2);
      
      // Remove a line item
      const removeButton = invoicePage.page.locator('button[aria-label="Remove item"]').first();
      await removeButton.click();
      
      // Should be back to 1 line item
      const lineItemsAfterRemove = await invoicePage.page.locator('input[id*="itemDescription"]').count();
      expect(lineItemsAfterRemove).toBe(1);
    });
  });

  test.describe('Real-time Validation', () => {
    test('should show validation errors in real-time during form filling', async () => {
      // Fill some valid data first to enable validation
      await invoicePage.fillSenderForm(validSenderData);
      await invoicePage.generateInvoiceButton.click(); // Trigger validation
      await invoicePage.waitForToast();
      await invoicePage.closeToast();
      
      // Clear a required field and check for immediate validation
      await invoicePage.senderName.fill('');
      await invoicePage.senderName.blur();
      
      // Should show validation error immediately
      const nameError = invoicePage.page.locator('input[id*="senderName"] ~ .text-red-600');
      await expect(nameError).toBeVisible();
      await expect(nameError).toContainText('Name is required');
    });

    test('should clear validation errors when field becomes valid', async () => {
      // Trigger validation first
      await invoicePage.generateInvoiceButton.click();
      await invoicePage.waitForToast();
      await invoicePage.closeToast();
      
      // Fill a field that was invalid
      await invoicePage.senderName.fill(validSenderData.name);
      
      // Validation error should disappear
      const nameError = invoicePage.page.locator('input[id*="senderName"] ~ .text-red-600');
      await expect(nameError).not.toBeVisible();
    });
  });
});