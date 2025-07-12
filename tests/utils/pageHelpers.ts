import { Page, Locator, expect } from '@playwright/test';

export class InvoiceGeneratorPage {
  readonly page: Page;
  
  // Form sections
  readonly senderForm: Locator;
  readonly clientForm: Locator;
  readonly invoiceDetailsForm: Locator;
  readonly invoiceItemsForm: Locator;
  
  // Sender fields
  readonly senderName: Locator;
  readonly senderEntityNumber: Locator;
  readonly senderAddress: Locator;
  readonly senderCity: Locator;
  readonly senderCountry: Locator;
  readonly senderPhone: Locator;
  readonly senderIban: Locator;
  readonly senderEntityTypeEntrepreneurship: Locator;
  readonly senderEntityTypeCompany: Locator;
  
  // Client fields
  readonly clientName: Locator;
  readonly clientCompanyNumber: Locator;
  readonly clientAddress: Locator;
  readonly clientCity: Locator;
  readonly clientState: Locator;
  readonly clientZip: Locator;
  readonly clientCountry: Locator;
  
  // Invoice details fields
  readonly invoiceNumber: Locator;
  readonly taxRate: Locator;
  readonly issueDate: Locator;
  readonly dueDate: Locator;
  
  // Template system
  readonly templateEditButton: Locator;
  readonly templateRefreshButton: Locator;
  readonly templateInput: Locator;
  readonly templatePreview: Locator;
  readonly templateApplyButton: Locator;
  readonly templateCancelButton: Locator;
  readonly templateResetButton: Locator;
  
  // Line items
  readonly addItemButton: Locator;
  readonly manageLineItemsButton: Locator;
  
  // Actions
  readonly showPreviewButton: Locator;
  readonly generateInvoiceButton: Locator;
  readonly invoiceHistoryButton: Locator;
  
  // Toast notifications
  readonly toastContainer: Locator;
  readonly toastMessage: Locator;
  readonly toastCloseButton: Locator;
  
  // Invoice list
  readonly invoiceListPanel: Locator;
  readonly invoiceListCloseButton: Locator;
  readonly invoiceSearchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Form sections
    this.senderForm = page.locator('[class*="From (My Business)"]').first();
    this.clientForm = page.locator('[class*="To (Client)"]').first();
    this.invoiceDetailsForm = page.locator('text=Invoice Details').locator('..').first();
    this.invoiceItemsForm = page.locator('text=Invoice Items').locator('..').first();
    
    // Sender fields
    this.senderName = page.locator('input[id*="senderName"]');
    this.senderEntityNumber = page.locator('input[id*="senderEntityNumber"]');
    this.senderAddress = page.locator('input[id*="senderAddress"]');
    this.senderCity = page.locator('input[id*="senderCity"]');
    this.senderCountry = page.locator('input[id*="senderCountry"]');
    this.senderPhone = page.locator('input[id*="senderPhone"]');
    this.senderIban = page.locator('input[id*="senderIban"]');
    this.senderEntityTypeEntrepreneurship = page.locator('label:has-text("Individual Entrepreneurship") input[type="radio"]');
    this.senderEntityTypeCompany = page.locator('label:has-text("Company") input[type="radio"]');
    
    // Client fields
    this.clientName = page.locator('input[id*="billToName"]');
    this.clientCompanyNumber = page.locator('input[id*="billToCompanyNumber"]');
    this.clientAddress = page.locator('input[id*="billToAddress"]');
    this.clientCity = page.locator('input[id*="billToCity"]');
    this.clientState = page.locator('input[id*="billToState"]');
    this.clientZip = page.locator('input[id*="billToZip"]');
    this.clientCountry = page.locator('input[id*="billToCountry"]');
    
    // Invoice details fields
    this.invoiceNumber = page.locator('input[id="invoiceNumber"]');
    this.taxRate = page.locator('input[id="taxRate"]');
    this.issueDate = page.locator('input[id="issueDate"]');
    this.dueDate = page.locator('input[id="dueDate"]');
    
    // Template system
    this.templateEditButton = page.locator('button[aria-label="Edit template"]');
    this.templateRefreshButton = page.locator('button[aria-label="Refresh invoice number"]');
    this.templateInput = page.locator('input[id="templateInput"]');
    this.templatePreview = page.locator('text=Preview').locator('..').locator('div').nth(1);
    this.templateApplyButton = page.locator('button:has-text("Apply Template")');
    this.templateCancelButton = page.locator('button:has-text("Cancel")');
    this.templateResetButton = page.locator('button:has-text("Reset to Default")');
    
    // Line items
    this.addItemButton = page.locator('button:has-text("Add Item")');
    this.manageLineItemsButton = page.locator('button:has-text("Manage Line Items")');
    
    // Actions
    this.showPreviewButton = page.locator('button').filter({ hasText: /Show Preview|Hide Preview/ });
    this.generateInvoiceButton = page.locator('button[type="submit"]').filter({ hasText: /Generate Invoice PDF|Generating/ });
    this.invoiceHistoryButton = page.locator('button:has-text("Invoice History")');
    
    // Toast notifications
    this.toastContainer = page.locator('[role="alert"]').first();
    this.toastMessage = page.locator('[role="alert"] p');
    this.toastCloseButton = page.locator('[role="alert"] button[aria-label="Close notification"]');
    
    // Invoice list
    this.invoiceListPanel = page.locator('.fixed.inset-0 .max-w-2xl');
    this.invoiceListCloseButton = page.locator('button[aria-label="Close invoice list"]');
    this.invoiceSearchInput = page.locator('input[placeholder*="Search invoices"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async fillSenderForm(data: any) {
    await this.senderName.fill(data.name);
    await this.senderEntityNumber.fill(data.entityNumber);
    await this.senderAddress.fill(data.address);
    await this.senderCity.fill(data.city);
    await this.senderCountry.fill(data.country);
    
    if (data.phone) await this.senderPhone.fill(data.phone);
    if (data.iban) await this.senderIban.fill(data.iban);
    
    if (data.entityType === 'company') {
      await this.senderEntityTypeCompany.click();
    } else {
      await this.senderEntityTypeEntrepreneurship.click();
    }
  }

  async fillClientForm(data: any) {
    await this.clientName.fill(data.name);
    await this.clientAddress.fill(data.address);
    await this.clientCity.fill(data.city);
    await this.clientCountry.fill(data.country);
    
    if (data.companyNumber) await this.clientCompanyNumber.fill(data.companyNumber);
    if (data.state) await this.clientState.fill(data.state);
    if (data.zip) await this.clientZip.fill(data.zip);
  }

  async fillInvoiceDetails(data: any) {
    if (data.invoiceNumber) await this.invoiceNumber.fill(data.invoiceNumber);
    if (data.taxRate !== undefined) await this.taxRate.fill(data.taxRate.toString());
    if (data.issueDate) await this.issueDate.fill(data.issueDate);
    if (data.dueDate) await this.dueDate.fill(data.dueDate);
  }

  async fillLineItem(index: number, data: any) {
    const descriptionField = this.page.locator(`input[id*="itemDescription${index}"]`);
    const periodField = this.page.locator(`input[id*="itemPeriod${index}"]`);
    const qtyField = this.page.locator(`input[id*="itemQty${index}"]`);
    const priceField = this.page.locator(`input[id*="itemPrice${index}"]`);
    
    await descriptionField.fill(data.description);
    if (data.period) await periodField.fill(data.period);
    await qtyField.fill(data.qty.toString());
    await priceField.fill(data.unitPrice.toString());
  }

  async openTemplateEditor() {
    await this.templateEditButton.click();
    await expect(this.templateInput).toBeVisible();
  }

  async closeTemplateEditor() {
    await this.templateCancelButton.click();
    await expect(this.templateInput).not.toBeVisible();
  }

  async setTemplate(template: string) {
    await this.openTemplateEditor();
    await this.templateInput.fill(template);
    await this.templateApplyButton.click();
    await expect(this.templateInput).not.toBeVisible();
  }

  async waitForToast(expectedText?: string) {
    await expect(this.toastContainer).toBeVisible();
    if (expectedText) {
      await expect(this.toastMessage).toContainText(expectedText);
    }
  }

  async closeToast() {
    await this.toastCloseButton.click();
    await expect(this.toastContainer).not.toBeVisible();
  }

  async openInvoiceHistory() {
    await this.invoiceHistoryButton.click();
    await expect(this.invoiceListPanel).toBeVisible();
  }

  async closeInvoiceHistory() {
    await this.invoiceListCloseButton.click();
    await expect(this.invoiceListPanel).not.toBeVisible();
  }

  async getValidationErrors(): Promise<string[]> {
    const errorElements = await this.page.locator('.text-red-600, [class*="text-red"]').all();
    const errors = await Promise.all(
      errorElements.map(el => el.textContent())
    );
    return errors.filter(error => error !== null && error.trim() !== '') as string[];
  }

  async clearLocalStorage() {
    await this.page.evaluate(() => {
      localStorage.clear();
    });
  }
}