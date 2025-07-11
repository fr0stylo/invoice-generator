import { Effect } from 'effect/index';
import path from 'path';
import {
  startOfMonth,
  endOfMonth,
  format,
  addDays,
  isBefore,
  parse,
} from 'date-fns';
import { InvoiceData, ProjectEntry } from '../types.js';
import { readConfig } from '../effects/config.js';
import { createDir } from '../effects/fs.js';
import { runMigrations, insertInvoice } from '../effects/database.js';
import { getEntries } from '../effects/toggl.js';
import { generateInvoicePDF } from '../effects/invoice.js';

type GroupedProjectEntry = Record<string, Array<ProjectEntry>>;

interface GenerateInvoicesOptions {
  month?: string;
  client?: string;
  config?: string;
  output?: string;
}

export const generateInvoices = (options: GenerateInvoicesOptions = {}) =>
  Effect.gen(function* () {
    // Run database migrations
    yield* runMigrations;

    // Read and parse contracts configuration
    const config = yield* readConfig(options.config || './contracts.yaml');
    // Calculate date range from options or default to current month
    // Ensure config directory exists

    const configDir = options.output || './invoices';
    yield* createDir(configDir);

    // Fetch time entries from Toggl API
    const targetDate = options.month
      ? parse(options.month, 'yyyy-MM', new Date())
      : new Date();
    const startDate = format(startOfMonth(targetDate), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(targetDate), 'yyyy-MM-dd');
    yield* Effect.log(
      `Generating invoices for period: ${startDate} to ${endDate}`
    );
    const data = yield* getEntries(startDate, endDate);

    // Group entries by client name
    const projectBasedEntries = data.reduce((acc, val) => {
      if (!acc[val.client_name]) {
        acc[val.client_name] = [];
      }
      acc[val.client_name].push(val);
      return acc;
    }, {} as GroupedProjectEntry);

    // Filter contracts by client if specified
    const contractsToProcess = options.client
      ? config.contracts.filter((contract) => contract.name === options.client)
      : config.contracts;

    if (contractsToProcess.length === 0) {
      if (options.client) {
        yield* Effect.fail(
          new Error(`No contract found for client: ${options.client}`)
        );
      }
      yield* Effect.log('No contracts found to process');
      return 'No invoices to generate';
    }

    // Generate invoices for each contract
    for (const contract of contractsToProcess) {
      const dueDate = format(
        addDays(endOfMonth(new Date()), contract.notice),
        'yyyy-MM-dd'
      );

      // Build invoice data
      const invoiceData: InvoiceData = {
        invoiceNumber: 'INV-temp',
        issueDate: endDate,
        dueDate: dueDate,
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
        items: [
          ...contract.services
            .filter((x) => x.type === 'fixed')
            .map((x) => ({
              description: x.name,
              period: `${startDate} - ${endDate}`,
              qty: 1,
              unitPrice: x.price,
            })),
        ],
        taxRate: contract.tax,
        timesheets: [],
      };

      // Process time entries for this contract
      const entries = projectBasedEntries[contract.name];
      if (entries?.length > 0) {
        const times = entries.reduce((acc, val) => {
          if (!acc[val.project_name]) {
            acc[val.project_name] = [];
          }
          acc[val.project_name].push(val);
          return acc;
        }, {} as GroupedProjectEntry);

        // Create timesheets data
        const timesheets = entries.map((x) => ({
          seconds: (x.duration / 3600).toFixed(2),
          name: x.description,
          start: format(x.start, 'yyyy-MM-dd HH:mm:ss'),
          end: format(x.stop, 'HH:mm:ss'),
        }));
        timesheets.sort((a, b) => (isBefore(a.start, b.start) ? -1 : 1));
        invoiceData.timesheets.push(...timesheets);

        // Add hourly services to invoice items
        for (const serviceName in times) {
          const service = contract.services.find((x) => x.name === serviceName);
          if (!service) {
            yield* Effect.fail(
              new Error(
                `Service ${serviceName} is not available for client ${contract.name}`
              )
            );
            return; // This will never be reached but satisfies TypeScript
          }

          invoiceData.items.push({
            description: service.name,
            period: `${startDate} - ${endDate}`,
            qty:
              times[serviceName].reduce((acc, val) => acc + val.duration, 0) /
              3600,
            unitPrice: service.price,
          });
        }
      }

      // Insert invoice into database and get ID
      const id = yield* insertInvoice(invoiceData);
      invoiceData.invoiceNumber = `${config.owner.invoice.prefix}${format(
        new Date(),
        'yyMMdd'
      )}${id}`;

      // Generate PDF
      const fileName = `invoice_${contract.name}_${format(
        targetDate,
        'yyyy-MM'
      )}.pdf`;
      const outputPath = path.join(configDir, fileName);
      yield* generateInvoicePDF(invoiceData, outputPath);

      yield* Effect.log(
        `Generated invoice for ${contract.name}: ${outputPath}`
      );
    }

    return `Generated ${contractsToProcess.length} invoice(s) successfully`;
  }).pipe(
    Effect.catchAll((error) => {
      console.error('Error generating invoices:', error);
      return Effect.fail(error);
    })
  );
