export type Contract = {
  trackingNumber: number;
  notice: number;
  lang: string;
  tax: number;
  services: Array<{
    name: string;
    price: number;
    type: 'hourly' | 'fixed';
  }>;
  name: string;
  address: string;
  city: string;
  zip: string;
  state: string;
  country: string;
  companyNumber: string;
};

export type Owner = {
  name: string;
  email: string;
  address: string;
  city: string;
  phone: string;
  country: string;
  iban: string;
  entityNumber: string;
  invoice: {
    prefix: string;
  };
};

export type ContractsData = {
  contracts: Array<Contract>;
  owner: Owner;
};

export type TimeSheetEntry = {
  seconds: string;
  name: string;
  start: string;
  end: string;
};

export type InvoiceData = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  sender: {
    name: string;
    entityNumber: string;
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
    amount?: number;
  }>;
  taxRate: number;
  timesheets: Array<TimeSheetEntry>;
};

export type ProjectEntry = {
  client_name: string;
  duration: number;
  project_name: number;
  start: string;
  stop: string;
  description: string;
};
