import Dexie, { type Table } from 'dexie';

export interface MyBusiness {
  id?: number;
  name: string;
  entityNumber: string;
  entityType: 'entrepreneurship' | 'company';
  address: string;
  city: string;
  country: string;
  phone?: string;
  iban?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id?: number;
  name: string;
  companyNumber?: string;
  address: string;
  city: string;
  state?: string;
  zip?: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LineItem {
  id?: number;
  name: string;
  description: string;
  category?: string;
  unitPrice: number;
  defaultQuantity: number;
  unit: string; // e.g., "hours", "pieces", "months"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceRecord {
  id?: number;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  taxRate: number;
  myBusinessId: number;
  clientId: number;
  items: Array<{
    lineItemId?: number;
    description: string;
    period: string;
    qty: number;
    unitPrice: number;
    unit: string;
  }>;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class InvoiceDatabase extends Dexie {
  myBusinesses!: Table<MyBusiness>;
  clients!: Table<Client>;
  lineItems!: Table<LineItem>;
  invoices!: Table<InvoiceRecord>;

  constructor() {
    super('InvoiceDatabase');
    
    // Version 1: Original schema
    this.version(1).stores({
      senders: '++id, name, entityNumber, entityType, createdAt',
      receivers: '++id, name, companyNumber, createdAt',
      invoices: '++id, invoiceNumber, issueDate, senderId, receiverId, createdAt'
    });

    // Version 2: Updated schema with line items and renamed entities
    this.version(2).stores({
      myBusinesses: '++id, name, entityNumber, entityType, createdAt',
      clients: '++id, name, companyNumber, createdAt',
      lineItems: '++id, name, category, isActive, createdAt',
      invoices: '++id, invoiceNumber, issueDate, myBusinessId, clientId, createdAt'
    }).upgrade(trans => {
      // Migrate existing data from v1 to v2
      return trans.db.table('senders').toArray().then(senders => {
        return Promise.all(senders.map(sender => 
          trans.db.table('myBusinesses').add(sender)
        ));
      }).then(() => {
        return trans.db.table('receivers').toArray();
      }).then(receivers => {
        return Promise.all(receivers.map(receiver => 
          trans.db.table('clients').add(receiver)
        ));
      }).catch(error => {
        // Ignore errors if tables don't exist (fresh install)
        console.log('Migration note: No existing data to migrate');
      });
    });

    this.myBusinesses.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.myBusinesses.hook('updating', (modifications: Partial<MyBusiness>, primKey, obj, trans) => {
      modifications.updatedAt = new Date();
    });

    this.clients.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.clients.hook('updating', (modifications: Partial<Client>, primKey, obj, trans) => {
      modifications.updatedAt = new Date();
    });

    this.lineItems.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
      if (obj.isActive === undefined) {
        obj.isActive = true;
      }
    });

    this.lineItems.hook('updating', (modifications: Partial<LineItem>, primKey, obj, trans) => {
      modifications.updatedAt = new Date();
    });

    this.invoices.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.invoices.hook('updating', (modifications: Partial<InvoiceRecord>, primKey, obj, trans) => {
      modifications.updatedAt = new Date();
    });
  }
}

export const db = new InvoiceDatabase();