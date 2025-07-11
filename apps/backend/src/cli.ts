#!/usr/bin/env node

import { Effect } from 'effect/index';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { generateInvoices } from './commands/generate';
import { createCustomInvoice, createInteractiveCustomInvoice } from './commands/custom';

const cli = yargs(hideBin(process.argv))
  .scriptName('invoice-cli')
  .usage('Usage: $0 <command> [options]')
  .command(
    'generate',
    'Generate invoices for all contracts',
    (yargs) => {
      return yargs
        .option('month', {
          alias: 'm',
          type: 'string',
          description: 'Month to generate invoices for (YYYY-MM)',
          default: new Date().toISOString().slice(0, 7),
        })
        .option('client', {
          alias: 'c',
          type: 'string',
          description: 'Generate invoice for specific client only',
        })
        .option('config', {
          type: 'string',
          description: 'Path to contracts.yaml file',
          default: './contracts.yaml',
        })
        .option('output', {
          alias: 'o',
          type: 'string',
          description: 'Output directory for PDF files',
          default: './invoices',
        });
    },
    async (args) => {
      const effect = generateInvoices({
        month: args.month,
        client: args.client,
        config: args.config,
        output: args.output,
      });

      await Effect.runPromise(effect);
    }
  )
  .command(
    'list',
    'List all generated invoices',
    (yargs) => {
      return yargs
        .option('limit', {
          alias: 'l',
          type: 'number',
          description: 'Number of invoices to show',
          default: 10,
        })
        .option('client', {
          alias: 'c',
          type: 'string',
          description: 'Filter by client name',
        });
    },
    () => {}
    // listInvoices
  )
  .command(
    'view <id>',
    'View invoice details by ID',
    (yargs) => {
      return yargs.positional('id', {
        describe: 'Invoice ID',
        type: 'number',
      });
    },
    () => {}
  )
  .command(
    'custom',
    'Create custom invoice for a client',
    (yargs) => {
      return yargs
        .option('client', {
          alias: 'c',
          type: 'string',
          description: 'Client name',
          demandOption: true,
        })
        .option('items', {
          alias: 'i',
          type: 'string',
          description: 'Invoice items as JSON string',
          default: '[]',
        })
        .option('issue-date', {
          type: 'string',
          description: 'Issue date (YYYY-MM-DD)',
        })
        .option('due-date', {
          type: 'string',
          description: 'Due date (YYYY-MM-DD)',
        })
        .option('config', {
          type: 'string',
          description: 'Path to contracts.yaml file',
          default: './contracts.yaml',
        })
        .option('output', {
          alias: 'o',
          type: 'string',
          description: 'Output directory for PDF files',
          default: './invoices',
        })
        .option('interactive', {
          type: 'boolean',
          description: 'Interactive mode for creating custom invoice',
          default: false,
        });
    },
    async (args) => {
      if (args.interactive) {
        const effect = createInteractiveCustomInvoice({
          client: args.client,
          config: args.config,
          output: args.output,
        });
        await Effect.runPromise(effect);
      } else {
        let items = [];
        try {
          items = JSON.parse(args.items);
        } catch (error) {
          console.error('Invalid JSON format for items');
          return;
        }

        const effect = createCustomInvoice({
          client: args.client,
          items,
          issueDate: args.issueDate,
          dueDate: args.dueDate,
          config: args.config,
          output: args.output,
        });
        await Effect.runPromise(effect);
      }
    }
  )
  .demandCommand(1, 'You need to specify a command')
  .help()
  .alias('help', 'h')
  .version()
  .alias('version', 'v');

cli.parse();
