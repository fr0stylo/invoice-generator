import { test, describe } from 'node:test';
import assert from 'node:assert';
import { InvoiceGenerator } from './invoiceGenerator.js';
import { InvoiceData } from './types.js';

describe('InvoiceGenerator', () => {
  const generator = new InvoiceGenerator();

  const baseTestData: InvoiceData = {
    invoiceNumber: 'TEST-001',
    issueDate: '2025-01-01',
    dueDate: '2025-01-15',
    sender: {
      name: 'Test Person',
      entityNumber: '1234567',
      entityType: 'entrepreneurship',
      address: 'Test Address',
      city: 'Test City',
      country: 'Test Country',
      phone: '+123456789',
      iban: 'TEST123456789'
    },
    billTo: {
      name: 'Test Company',
      companyNumber: '987654321',
      address: 'Company Address',
      city: 'Company City',
      state: 'State',
      zip: '12345',
      country: 'Test Country'
    },
    items: [
      {
        description: 'Test Service',
        period: '2025-01-01 - 2025-01-31',
        qty: 1,
        unitPrice: 100.00
      }
    ],
    taxRate: 0,
    timesheets: []
  };

  test('should process invoice data correctly', () => {
    const processed = generator.processInvoiceData(baseTestData);
    
    assert.strictEqual(processed.subtotal, 100.00);
    assert.strictEqual(processed.tax, 0);
    assert.strictEqual(processed.total, 100.00);
    assert.strictEqual(processed.amountDue, 100.00);
    assert.strictEqual(processed.items[0].amount, 100.00);
  });

  test('should handle entrepreneurship entity type', () => {
    const testData = {
      ...baseTestData,
      sender: {
        ...baseTestData.sender,
        entityType: 'entrepreneurship' as const
      }
    };

    const processed = generator.processInvoiceData(testData);
    assert.strictEqual(processed.sender.entityType, 'entrepreneurship');
  });

  test('should handle company entity type', () => {
    const testData = {
      ...baseTestData,
      sender: {
        ...baseTestData.sender,
        entityType: 'company' as const
      }
    };

    const processed = generator.processInvoiceData(testData);
    assert.strictEqual(processed.sender.entityType, 'company');
  });

  test('should default to entrepreneurship when entityType is undefined', () => {
    const testData = {
      ...baseTestData,
      sender: {
        ...baseTestData.sender,
        entityType: undefined
      }
    };

    const processed = generator.processInvoiceData(testData);
    assert.strictEqual(processed.sender.entityType, undefined);
  });

  test('should calculate tax correctly when tax rate is non-zero', () => {
    const testData = {
      ...baseTestData,
      taxRate: 21
    };

    const processed = generator.processInvoiceData(testData);
    assert.strictEqual(processed.subtotal, 100.00);
    assert.strictEqual(processed.tax, 21.00);
    assert.strictEqual(processed.total, 121.00);
    assert.strictEqual(processed.amountDue, 121.00);
  });

  test('should calculate multiple items correctly', () => {
    const testData = {
      ...baseTestData,
      items: [
        {
          description: 'Service 1',
          period: '2025-01-01 - 2025-01-31',
          qty: 2,
          unitPrice: 50.00
        },
        {
          description: 'Service 2',
          period: '2025-01-01 - 2025-01-31',
          qty: 1,
          unitPrice: 75.00
        }
      ]
    };

    const processed = generator.processInvoiceData(testData);
    assert.strictEqual(processed.subtotal, 175.00);
    assert.strictEqual(processed.items[0].amount, 100.00);
    assert.strictEqual(processed.items[1].amount, 75.00);
  });
});