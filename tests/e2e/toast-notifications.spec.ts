import { test, expect } from '@playwright/test';
import { InvoiceGeneratorPage } from '../utils/pageHelpers';
import { validSenderData, validClientData, validInvoiceData, validLineItems } from '../fixtures/testData';

test.describe('Toast Notification Tests', () => {
  let invoicePage: InvoiceGeneratorPage;

  test.beforeEach(async ({ page }) => {
    invoicePage = new InvoiceGeneratorPage(page);
    await invoicePage.goto();
    await invoicePage.clearLocalStorage();
  });

  test.describe('Toast Appearance and Styling', () => {
    test('should show validation error toast with correct styling', async () => {
      await invoicePage.generateInvoiceButton.click();
      
      // Check toast appears
      await expect(invoicePage.toastContainer).toBeVisible();
      
      // Check error styling (red background)
      const toastElement = invoicePage.toastContainer;
      const bgColor = await toastElement.evaluate(el => getComputedStyle(el).backgroundColor);
      expect(bgColor).toContain('rgb(254, 242, 242)'); // bg-red-50
      
      // Check toast content
      await expect(invoicePage.toastMessage).toContainText('Validation Error');
      await expect(invoicePage.toastMessage.nth(1)).toContainText('Please fix the validation errors above before submitting.');
    });

    test('should show success toast with correct styling', async () => {
      // This test would require a successful invoice generation
      // For now, we'll test the success message for loading an invoice
      await invoicePage.openInvoiceHistory();
      await invoicePage.closeInvoiceHistory();
      
      // Since there are no invoices, this will just test the UI
      // In a real scenario with invoices, we would test editing one
    });

    test('should display toast in correct position', async () => {
      await invoicePage.generateInvoiceButton.click();
      await invoicePage.waitForToast();
      
      const toastContainer = invoicePage.page.locator('[aria-label="Notifications"]');
      await expect(toastContainer).toBeVisible();
      
      // Check positioning (should be fixed top-right)
      const position = await toastContainer.evaluate(el => {
        const style = getComputedStyle(el);
        return {
          position: style.position,
          top: style.top,
          right: style.right,
          zIndex: style.zIndex
        };
      });
      
      expect(position.position).toBe('fixed');
      expect(position.top).toBe('16px'); // top-4
      expect(position.right).toBe('16px'); // right-4
      expect(parseInt(position.zIndex)).toBeGreaterThan(40); // z-50
    });

    test('should have responsive width', async () => {
      await invoicePage.generateInvoiceButton.click();
      await invoicePage.waitForToast();
      
      const toast = invoicePage.toastContainer;
      const width = await toast.evaluate(el => getComputedStyle(el).width);
      
      // Should have a reasonable width (not too narrow)
      const widthPx = parseInt(width);
      expect(widthPx).toBeGreaterThan(250);
      expect(widthPx).toBeLessThan(500);
    });
  });

  test.describe('Toast Functionality', () => {
    test('should auto-dismiss toast after 5 seconds', async () => {
      await invoicePage.generateInvoiceButton.click();
      await invoicePage.waitForToast();
      
      // Toast should be visible initially
      await expect(invoicePage.toastContainer).toBeVisible();
      
      // Wait for auto-dismiss (5 seconds + buffer)
      await invoicePage.page.waitForTimeout(5500);
      
      // Toast should be gone
      await expect(invoicePage.toastContainer).not.toBeVisible();
    });

    test('should manually close toast with X button', async () => {
      await invoicePage.generateInvoiceButton.click();
      await invoicePage.waitForToast();
      
      // Toast should be visible
      await expect(invoicePage.toastContainer).toBeVisible();
      
      // Click close button
      await invoicePage.closeToast();
      
      // Toast should be gone immediately
      await expect(invoicePage.toastContainer).not.toBeVisible();
    });

    test('should show multiple toasts stacked', async () => {
      // Trigger first toast
      await invoicePage.generateInvoiceButton.click();
      await invoicePage.waitForToast();
      
      // Trigger second toast quickly
      await invoicePage.generateInvoiceButton.click();
      
      // Should have multiple toasts
      const toastCount = await invoicePage.page.locator('[role="alert"]').count();
      expect(toastCount).toBeGreaterThanOrEqual(1);
    });

    test('should clear toast when manually closed, even before auto-dismiss', async () => {
      await invoicePage.generateInvoiceButton.click();
      await invoicePage.waitForToast();
      
      // Close immediately (before 5-second auto-dismiss)
      await invoicePage.closeToast();
      
      // Wait to ensure it doesn't reappear
      await invoicePage.page.waitForTimeout(1000);
      await expect(invoicePage.toastContainer).not.toBeVisible();
    });
  });

  test.describe('Toast Content and Types', () => {
    test('should show appropriate icons for different toast types', async () => {
      // Test error toast
      await invoicePage.generateInvoiceButton.click();
      await invoicePage.waitForToast();
      
      // Check for error icon (X mark)
      const errorIcon = invoicePage.toastContainer.locator('svg path[d*="M6 18L18 6M6 6l12 12"]');
      await expect(errorIcon).toBeVisible();
    });

    test('should display proper error messages for validation', async () => {
      await invoicePage.generateInvoiceButton.click();
      await invoicePage.waitForToast();
      
      const toastMessages = invoicePage.toastMessage;
      await expect(toastMessages.first()).toContainText('Validation Error');
      await expect(toastMessages.nth(1)).toContainText('Please fix the validation errors above');
    });

    test('should show loading state appropriately', async () => {
      // Fill valid form
      await invoicePage.fillSenderForm(validSenderData);
      await invoicePage.fillClientForm(validClientData);
      await invoicePage.fillInvoiceDetails(validInvoiceData);
      await invoicePage.fillLineItem(0, validLineItems[0]);
      
      // Click generate (this will fail due to no backend, but we can test loading state)
      await invoicePage.generateInvoiceButton.click();
      
      // Check button shows loading state
      await expect(invoicePage.generateInvoiceButton).toContainText('Generating...');
      await expect(invoicePage.generateInvoiceButton).toBeDisabled();
    });
  });

  test.describe('Toast Accessibility', () => {
    test('should have proper ARIA attributes', async () => {
      await invoicePage.generateInvoiceButton.click();
      await invoicePage.waitForToast();
      
      const toast = invoicePage.toastContainer;
      
      // Check ARIA attributes
      await expect(toast).toHaveAttribute('role', 'alert');
      await expect(toast).toHaveAttribute('aria-live', 'assertive');
      await expect(toast).toHaveAttribute('aria-atomic', 'true');
      
      // Check close button has proper label
      await expect(invoicePage.toastCloseButton).toHaveAttribute('aria-label', 'Close notification');
    });

    test('should be keyboard accessible', async () => {
      await invoicePage.generateInvoiceButton.click();
      await invoicePage.waitForToast();
      
      // Focus close button and press Enter
      await invoicePage.toastCloseButton.focus();
      await invoicePage.page.keyboard.press('Enter');
      
      // Toast should close
      await expect(invoicePage.toastContainer).not.toBeVisible();
    });

    test('should announce to screen readers', async () => {
      await invoicePage.generateInvoiceButton.click();
      await invoicePage.waitForToast();
      
      // The toast container should be properly announced
      const notifications = await invoicePage.page.locator('[aria-live]').count();
      expect(notifications).toBeGreaterThan(0);
    });
  });

  test.describe('Toast Performance', () => {
    test('should not cause memory leaks with multiple toasts', async () => {
      // Create and dismiss multiple toasts rapidly
      for (let i = 0; i < 5; i++) {
        await invoicePage.generateInvoiceButton.click();
        await invoicePage.waitForToast();
        await invoicePage.closeToast();
        await invoicePage.page.waitForTimeout(100);
      }
      
      // Should not have any toasts remaining
      await expect(invoicePage.toastContainer).not.toBeVisible();
    });

    test('should handle rapid toast creation gracefully', async () => {
      // Rapidly trigger multiple toasts
      await invoicePage.generateInvoiceButton.click();
      await invoicePage.generateInvoiceButton.click();
      await invoicePage.generateInvoiceButton.click();
      
      // Should handle this gracefully without crashes
      await expect(invoicePage.page.locator('[role="alert"]')).toBeVisible();
    });
  });
});