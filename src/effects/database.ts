import { Effect } from 'effect';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { InvoiceData } from '../types.js';

const getDatabase = () =>
  Effect.promise(() =>
    open({
      filename: 'db.sqlite',
      driver: sqlite3.cached.Database,
    })
  );

export const runMigrations = Effect.gen(function* () {
  const database = yield* getDatabase();
  yield* Effect.promise(() =>
    database.run(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issueDate TEXT NOT NULL,
        dueDate TEXT NOT NULL,
        billTo_name TEXT,
        billTo_companyNumber TEXT,
        items_json JSON,
        timesheets_json JSON
      )
    `)
  );
}).pipe(
  Effect.catchAll((error) =>
    Effect.fail(new Error(`Failed to run migrations: ${error}`))
  )
);

export const insertInvoice = (invoiceData: InvoiceData) =>
  Effect.gen(function* () {
    const database = yield* getDatabase();
    const result = yield* Effect.promise(() =>
      database.run(
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
      )
    );
    return result.lastID;
  }).pipe(
    Effect.catchAll((error) =>
      Effect.fail(new Error(`Failed to insert invoice: ${error}`))
    )
  );