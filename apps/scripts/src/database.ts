import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { InvoiceData } from './types';

const database = await open({
  filename: 'db.sqlite',
  driver: sqlite3.cached.Database,
});

export const migrations = async () => {
  await database.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issueDate TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      billTo_name TEXT,
      billTo_companyNumber TEXT,
      items_json JSON,
      timesheets_json JSON
    )
  `);
};

export const insertInvoice = async (invoiceData: InvoiceData) => {
  const result = await database.run(
    `INSERT INTO invoices (
      issueDate, dueDate,
      billTo_name, billTo_companyNumber, items_json, timesheets_json
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    invoiceData.issueDate,
    invoiceData.dueDate,
    invoiceData.billTo.name,
    invoiceData.billTo.companyNumber,
    JSON.stringify(invoiceData.items),
    JSON.stringify(invoiceData.timesheets)
  );
  return result.lastID;
};
