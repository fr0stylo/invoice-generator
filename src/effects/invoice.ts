import { Effect } from 'effect';
import { InvoiceGenerator } from '../invoiceGenerator.js';
import { InvoiceData } from '../types.js';

export const generateInvoicePDF = (invoiceData: InvoiceData, outputPath: string) =>
  Effect.gen(function* () {
    const generator = new InvoiceGenerator();
    yield* Effect.promise(() => generator.generateInvoice(invoiceData, outputPath));
    return outputPath;
  }).pipe(
    Effect.catchAll((error) =>
      Effect.fail(new Error(`Failed to generate invoice PDF: ${error}`))
    )
  );