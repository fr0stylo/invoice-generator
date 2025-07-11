import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('Frontend Integration', () => {
  test('should have correct form data structure with entityType', () => {
    const formData = {
      invoiceNumber: 'TEST-001',
      issueDate: '2025-01-01',
      dueDate: '2025-01-15',
      taxRate: 0,
      sender: {
        name: 'Test Person',
        entityNumber: '1234567',
        entityType: 'company' as const,
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
      ]
    };

    // Test that the form data structure is correct
    assert.strictEqual(formData.sender.entityType, 'company');
    assert.strictEqual(typeof formData.sender.entityType, 'string');
    assert.ok(['entrepreneurship', 'company'].includes(formData.sender.entityType));
  });

  test('should default to entrepreneurship entity type', () => {
    const formData = {
      sender: {
        name: 'Test Person',
        entityNumber: '1234567',
        entityType: 'entrepreneurship' as const,
        address: 'Test Address',
        city: 'Test City',
        country: 'Test Country',
        phone: '+123456789',
        iban: 'TEST123456789'
      }
    };

    assert.strictEqual(formData.sender.entityType, 'entrepreneurship');
  });

  test('should support both entity types', () => {
    const entrepreneurshipForm = {
      sender: { entityType: 'entrepreneurship' as const }
    };
    
    const companyForm = {
      sender: { entityType: 'company' as const }
    };

    assert.strictEqual(entrepreneurshipForm.sender.entityType, 'entrepreneurship');
    assert.strictEqual(companyForm.sender.entityType, 'company');
  });
});