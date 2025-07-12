export const validSenderData = {
  name: 'Test Business Ltd',
  entityNumber: '123456789',
  entityType: 'company' as const,
  address: '123 Business Street',
  city: 'Business City',
  country: 'Lithuania',
  phone: '+370 600 12345',
  iban: 'LT12 3456 7890 1234 5678',
};

export const validClientData = {
  name: 'Test Client Corp',
  companyNumber: 'CC987654321',
  address: '456 Client Avenue',
  city: 'Client City',
  state: 'Client State',
  zip: '12345',
  country: 'Estonia',
};

export const validInvoiceData = {
  invoiceNumber: 'INV-2025-07-12-001',
  taxRate: 21,
  issueDate: '2025-07-12',
  dueDate: '2025-08-11',
};

export const validLineItems = [
  {
    description: 'Web Development Services',
    period: 'July 2025',
    qty: 40,
    unitPrice: 75,
  },
  {
    description: 'Project Management',
    period: 'July 2025',
    qty: 10,
    unitPrice: 120,
  },
];

export const invalidSenderData = {
  name: '',
  entityNumber: '',
  address: '',
  city: '',
  country: '',
};

export const invalidClientData = {
  name: '',
  address: '',
  city: '',
  country: '',
};

export const invalidLineItems = [
  {
    description: '',
    period: '',
    qty: 0,
    unitPrice: 0,
  },
];

export const templateTestCases = [
  {
    template: 'PROJ-{{ inc }}',
    expected: 'PROJ-001',
    description: 'Simple project template',
  },
  {
    template: 'INV-{{YEAR}}-{{MONTH}}-{{DAY}}-{{ inc }}',
    expected: 'INV-2025-07-12-001',
    description: 'Full date template',
  },
  {
    template: '{{YEAR}}{{MONTH}}-{{ inc }}',
    expected: '202507-001',
    description: 'Compact date template',
  },
  {
    template: 'CLIENT-A-{{ inc }}',
    expected: 'CLIENT-A-001',
    description: 'Client-specific template',
  },
  {
    template: 'Q3-{{YEAR}}-{{ inc }}',
    expected: 'Q3-2025-001',
    description: 'Quarterly template',
  },
];