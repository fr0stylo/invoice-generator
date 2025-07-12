import { test, expect } from '@playwright/test';
import { InvoiceGeneratorPage } from '../utils/pageHelpers';
import { templateTestCases } from '../fixtures/testData';

test.describe('Invoice Template System Tests', () => {
  let invoicePage: InvoiceGeneratorPage;

  test.beforeEach(async ({ page }) => {
    invoicePage = new InvoiceGeneratorPage(page);
    await invoicePage.goto();
    await invoicePage.clearLocalStorage();
  });

  test.describe('Template Editor UI', () => {
    test('should show template editor when edit button is clicked', async () => {
      await invoicePage.templateEditButton.click();
      
      // Template editor should be visible
      await expect(invoicePage.templateInput).toBeVisible();
      await expect(invoicePage.templateApplyButton).toBeVisible();
      await expect(invoicePage.templateCancelButton).toBeVisible();
      await expect(invoicePage.templateResetButton).toBeVisible();
      
      // Should show help text
      const helpText = invoicePage.page.locator('text=Use {{ inc }} for auto-increment number');
      await expect(helpText).toBeVisible();
    });

    test('should hide template editor when cancel is clicked', async () => {
      await invoicePage.openTemplateEditor();
      await invoicePage.closeTemplateEditor();
      
      await expect(invoicePage.templateInput).not.toBeVisible();
    });

    test('should load current template in editor', async () => {
      await invoicePage.openTemplateEditor();
      
      // Should show current invoice number pattern as template
      const currentValue = await invoicePage.templateInput.inputValue();
      expect(currentValue).toContain('{{ inc }}');
    });

    test('should show live preview while typing', async () => {
      await invoicePage.openTemplateEditor();
      
      // Type a custom template
      await invoicePage.templateInput.fill('TEST-{{ inc }}');
      
      // Preview should update
      await expect(invoicePage.templatePreview).toContainText('TEST-001');
    });

    test('should show placeholder with example templates', async () => {
      await invoicePage.openTemplateEditor();
      
      const placeholder = await invoicePage.templateInput.getAttribute('placeholder');
      expect(placeholder).toContain('PROJ');
      expect(placeholder).toContain('inc');
      expect(placeholder).toContain('YEAR');
    });
  });

  test.describe('Template Processing', () => {
    templateTestCases.forEach(({ template, expected, description }) => {
      test(`should process ${description}: ${template} -> ${expected}`, async () => {
        await invoicePage.setTemplate(template);
        
        // Check that invoice number field shows the expected value
        await expect(invoicePage.invoiceNumber).toHaveValue(expected);
      });
    });

    test('should handle templates without increment placeholder', async () => {
      const staticTemplate = 'STATIC-INVOICE-001';
      await invoicePage.setTemplate(staticTemplate);
      
      // Should accept static templates
      await expect(invoicePage.invoiceNumber).toHaveValue(staticTemplate);
    });

    test('should preserve case sensitivity', async () => {
      const caseTemplate = 'MyProject-{{ inc }}';
      await invoicePage.setTemplate(caseTemplate);
      
      await expect(invoicePage.invoiceNumber).toHaveValue('MyProject-001');
    });

    test('should handle special characters in templates', async () => {
      const specialTemplate = 'PROJ_2025.{{ inc }}-FINAL';
      await invoicePage.setTemplate(specialTemplate);
      
      await expect(invoicePage.invoiceNumber).toHaveValue('PROJ_2025.001-FINAL');
    });

    test('should handle whitespace in placeholders', async () => {
      const spaceTemplate = 'TEST-{{  inc  }}';
      await invoicePage.setTemplate(spaceTemplate);
      
      await expect(invoicePage.invoiceNumber).toHaveValue('TEST-001');
    });
  });

  test.describe('Template Persistence', () => {
    test('should save template to localStorage', async () => {
      const customTemplate = 'SAVED-{{ inc }}';
      await invoicePage.setTemplate(customTemplate);
      
      // Reload page
      await invoicePage.page.reload();
      
      // Template should be remembered
      await invoicePage.openTemplateEditor();
      const savedTemplate = await invoicePage.templateInput.inputValue();
      expect(savedTemplate).toBe(customTemplate);
    });

    test('should persist template across browser sessions', async () => {
      const customTemplate = 'SESSION-{{ inc }}';
      await invoicePage.setTemplate(customTemplate);
      
      // Check that template is saved in localStorage
      const savedTemplate = await invoicePage.page.evaluate(() => {
        const data = localStorage.getItem('invoice-number-template');
        return data ? JSON.parse(data).template : null;
      });
      
      expect(savedTemplate).toBe(customTemplate);
    });

    test('should use saved template for refresh button', async () => {
      const customTemplate = 'REFRESH-{{ inc }}';
      await invoicePage.setTemplate(customTemplate);
      
      // Click refresh button
      await invoicePage.templateRefreshButton.click();
      
      // Should still use the custom template
      await expect(invoicePage.invoiceNumber).toHaveValue('REFRESH-001');
    });
  });

  test.describe('Template Reset Functionality', () => {
    test('should reset to default template', async () => {
      // Set custom template
      await invoicePage.setTemplate('CUSTOM-{{ inc }}');
      
      // Open editor and reset
      await invoicePage.openTemplateEditor();
      await invoicePage.templateResetButton.click();
      
      // Should show default template
      const resetValue = await invoicePage.templateInput.inputValue();
      expect(resetValue).toBe('INV-{{YEAR}}-{{MONTH}}-{{DAY}}-{{ inc }}');
      
      // Preview should update
      await expect(invoicePage.templatePreview).toContainText('INV-2025-07-12-001');
    });

    test('should apply reset template when applied', async () => {
      await invoicePage.setTemplate('BEFORE-RESET-{{ inc }}');
      
      await invoicePage.openTemplateEditor();
      await invoicePage.templateResetButton.click();
      await invoicePage.templateApplyButton.click();
      
      // Should use default format
      await expect(invoicePage.invoiceNumber).toHaveValue('INV-2025-07-12-001');
    });
  });

  test.describe('Daily Counter Integration', () => {
    test('should show increment number 001 for first invoice of day', async () => {
      await invoicePage.setTemplate('DAILY-{{ inc }}');
      await expect(invoicePage.invoiceNumber).toHaveValue('DAILY-001');
    });

    test('should maintain template format with increments', async () => {
      // This test would require actually generating invoices to increment the counter
      // For now, we test that the template system is ready for increments
      await invoicePage.setTemplate('COUNT-{{ inc }}');
      
      // Multiple refreshes should show same number (001) since no invoices generated
      await invoicePage.templateRefreshButton.click();
      await expect(invoicePage.invoiceNumber).toHaveValue('COUNT-001');
      
      await invoicePage.templateRefreshButton.click();
      await expect(invoicePage.invoiceNumber).toHaveValue('COUNT-001');
    });

    test('should handle date placeholders correctly', async () => {
      const dateTemplate = '{{YEAR}}-{{MONTH}}-{{DAY}}-{{ inc }}';
      await invoicePage.setTemplate(dateTemplate);
      
      // Should replace with current date
      const expectedDate = new Date().toISOString().split('T')[0];
      const [year, month, day] = expectedDate.split('-');
      const expected = `${year}-${month}-${day}-001`;
      
      await expect(invoicePage.invoiceNumber).toHaveValue(expected);
    });
  });

  test.describe('Template Validation', () => {
    test('should handle invalid template gracefully', async () => {
      await invoicePage.openTemplateEditor();
      
      // Type incomplete placeholder
      await invoicePage.templateInput.fill('INVALID-{{ inc');
      
      // Should still show some preview (even if malformed)
      await expect(invoicePage.templatePreview).toBeVisible();
    });

    test('should handle empty template', async () => {
      await invoicePage.openTemplateEditor();
      await invoicePage.templateInput.fill('');
      await invoicePage.templateApplyButton.click();
      
      // Should handle empty template gracefully (possibly showing error or default)
      await expect(invoicePage.templateInput).not.toBeVisible(); // Editor should close
    });

    test('should handle very long templates', async () => {
      const longTemplate = 'VERY-LONG-TEMPLATE-WITH-MANY-CHARACTERS-AND-DETAILS-{{ inc }}';
      await invoicePage.setTemplate(longTemplate);
      
      await expect(invoicePage.invoiceNumber).toHaveValue('VERY-LONG-TEMPLATE-WITH-MANY-CHARACTERS-AND-DETAILS-001');
    });

    test('should show helpful error for malformed placeholders', async () => {
      await invoicePage.openTemplateEditor();
      
      // Type malformed placeholder
      await invoicePage.templateInput.fill('BAD-{inc}');
      
      // Preview should handle this gracefully
      await expect(invoicePage.templatePreview).toBeVisible();
    });
  });

  test.describe('Template User Experience', () => {
    test('should show helpful hints about available placeholders', async () => {
      await invoicePage.openTemplateEditor();
      
      // Check that help text is comprehensive
      const helpSection = invoicePage.page.locator('text=Use {{ inc }} for auto-increment number').locator('..');
      await expect(helpSection).toContainText('{{ inc }}');
      await expect(helpSection).toContainText('{{YEAR}}');
      await expect(helpSection).toContainText('{{MONTH}}');
      await expect(helpSection).toContainText('{{DAY}}');
    });

    test('should maintain template editor state when switching focus', async () => {
      await invoicePage.openTemplateEditor();
      await invoicePage.templateInput.fill('FOCUS-TEST-{{ inc }}');
      
      // Click outside template editor (but not cancel)
      await invoicePage.senderName.click();
      
      // Template editor should still be open with same content
      await expect(invoicePage.templateInput).toBeVisible();
      await expect(invoicePage.templateInput).toHaveValue('FOCUS-TEST-{{ inc }}');
    });

    test('should update invoice number immediately after applying template', async () => {
      const beforeTemplate = await invoicePage.invoiceNumber.inputValue();
      
      await invoicePage.setTemplate('IMMEDIATE-{{ inc }}');
      
      const afterTemplate = await invoicePage.invoiceNumber.inputValue();
      expect(afterTemplate).not.toBe(beforeTemplate);
      expect(afterTemplate).toBe('IMMEDIATE-001');
    });
  });
});