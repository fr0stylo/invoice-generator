import { Effect } from 'effect/index';
import path from 'path';
import { format, parse } from 'date-fns';
import { InvoiceData } from '../types.js';
import { readConfig } from '../effects/config.js';
import { createDir } from '../effects/fs.js';
import { runMigrations, insertInvoice } from '../effects/database.js';
import { generateInvoicePDF } from '../effects/invoice.js';

interface CustomInvoiceOptions {
  client: string;
  items: Array<{
    description: string;
    qty: number;
    unitPrice: number;
    period?: string;
  }>;
  issueDate?: string;
  dueDate?: string;
  config?: string;
  output?: string;
}

export const createCustomInvoice = (options: CustomInvoiceOptions) =>
  Effect.gen(function* () {
    // Run database migrations
    yield* runMigrations;

    // Read and parse contracts configuration
    const config = yield* readConfig(options.config || './contracts.yaml');

    // Find the client contract
    const contract = config.contracts.find((c) => c.name === options.client);
    if (!contract) {
      yield* Effect.fail(
        new Error(`No contract found for client: ${options.client}`)
      );
      return;
    }

    // Ensure output directory exists
    const outputDir = options.output || './invoices';
    yield* createDir(outputDir);

    // Use provided dates or defaults
    const issueDate = options.issueDate || format(new Date(), 'yyyy-MM-dd');
    const dueDate =
      options.dueDate ||
      format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

    // Build invoice data
    const invoiceData: InvoiceData = {
      invoiceNumber: 'INV-temp',
      issueDate,
      dueDate,
      sender: {
        name: config.owner.name,
        entityNumber: config.owner.entityNumber,
        address: config.owner.address,
        city: config.owner.city,
        country: config.owner.country,
        phone: config.owner.phone,
        iban: config.owner.iban,
      },
      billTo: {
        name: contract.name,
        companyNumber: contract.companyNumber,
        address: contract.address,
        city: contract.city,
        state: contract.state,
        zip: contract.zip,
        country: contract.country,
      },
      items: options.items.map((item) => ({
        description: item.description,
        period: item.period || issueDate,
        qty: item.qty,
        unitPrice: item.unitPrice,
      })),
      taxRate: contract.tax,
      timesheets: [], // Custom invoices don't include timesheets
    };

    // Insert invoice into database and get ID
    const id = yield* insertInvoice(invoiceData);
    invoiceData.invoiceNumber = `${config.owner.invoice.prefix}${id}`;

    // Generate PDF
    const fileName = `custom_invoice_${contract.name}_${format(
      new Date(),
      'yyyy-MM-dd'
    )}.pdf`;
    const outputPath = path.join(outputDir, fileName);
    yield* generateInvoicePDF(invoiceData, outputPath);

    yield* Effect.log(
      `Generated custom invoice for ${contract.name}: ${outputPath}`
    );

    return {
      invoiceId: id,
      invoiceNumber: invoiceData.invoiceNumber,
      outputPath,
      client: contract.name,
      total:
        invoiceData.items.reduce(
          (sum, item) => sum + item.qty * item.unitPrice,
          0
        ) *
        (1 + contract.tax / 100),
    };
  }).pipe(
    Effect.catchAll((error) => {
      console.error('Error creating custom invoice:', error);
      return Effect.fail(error);
    })
  );

interface InteractiveCustomInvoiceOptions {
  client: string;
  config?: string;
  output?: string;
}

export const createInteractiveCustomInvoice = (
  options: InteractiveCustomInvoiceOptions
) =>
  Effect.gen(function* () {
    // Read config to get client info
    const config = yield* readConfig(options.config || './contracts.yaml');
    const contract = config.contracts.find((c) => c.name === options.client);

    if (!contract) {
      yield* Effect.fail(
        new Error(`No contract found for client: ${options.client}`)
      );
      return;
    }

    yield* Effect.log(`Creating custom invoice for: ${contract.name}`);
    yield* Effect.log(`Available services from contract:`);
    // contract.services.forEach((service, index) => {
    //   yield *
    //     Effect.log(
    //       `  ${index + 1}. ${service.name} - €${service.price} (${
    //         service.type
    //       })`
    //     );
    // });

    // For now, create a simple example invoice
    // In a real implementation, you'd prompt for user input
    const items = [
      {
        description: 'Custom Service',
        qty: 1,
        unitPrice: 100,
        period: format(new Date(), 'yyyy-MM'),
      },
    ];

    return yield* createCustomInvoice({
      client: options.client,
      items,
      config: options.config,
      output: options.output,
    });
  });
