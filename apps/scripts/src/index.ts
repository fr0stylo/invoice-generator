import fs from 'fs';
import yaml from 'yaml';

import { getEntries } from './toggleTrackApi.js';
import { InvoiceGenerator } from './invoiceGenerator.js';
import { startOfMonth, endOfMonth, format, addDays, isBefore } from 'date-fns';
import { ContractsData, InvoiceData, ProjectEntry } from './types.js';
import { insertInvoice, migrations } from './database.js';

type GroupedProjectEntry = Record<string, Array<ProjectEntry>>;

(async () => {
  await migrations();
  const file = fs.readFileSync('./contracts.yaml', 'utf8');
  const output = yaml.parse(file) as ContractsData;
  const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const data = await getEntries(startDate, endDate);

  const projectBasedEntries = data.reduce((acc, val, _) => {
    if (!acc[val.client_name]) {
      acc[val.client_name] = [];
    }
    acc[val.client_name].push(val);

    return acc;
  }, {} as GroupedProjectEntry);

  for (const contract of output.contracts) {
    const dueDate = format(
      addDays(endOfMonth(new Date()), contract.notice),
      'yyyy-MM-dd'
    );
    const invoiceData: InvoiceData = {
      invoiceNumber: 'INV-2025-06-11-001',
      issueDate: endDate,
      dueDate: dueDate,
      sender: {
        name: output.owner.name,
        entityNumber: output.owner.entityNumber,
        address: output.owner.address,
        city: output.owner.city,
        country: output.owner.country,
        phone: output.owner.phone,
        iban: output.owner.iban,
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
      taxRate: contract.tax, // 0% tax
      timesheets: [],
    };

    const entries = projectBasedEntries[contract.name];
    if (entries?.length > 0) {
      const times = entries.reduce((acc, val) => {
        if (!acc[val.project_name]) {
          acc[val.project_name] = [];
        }
        acc[val.project_name].push(val);
        return acc;
      }, {} as GroupedProjectEntry);
      const timesheets = entries.map((x) => ({
        seconds: (x.duration / 3600).toFixed(2),
        name: x.description,
        start: format(x.start, 'yyyy-MM-dd HH:mm:ss'),
        end: format(x.stop, 'HH:mm:ss'),
      }));
      timesheets.sort((a, b) => (isBefore(a.start, b.start) ? -1 : 1));
      invoiceData.timesheets.push(...timesheets);

      for (const serviceName in times) {
        const service = contract.services.find((x) => x.name === serviceName);
        if (!service) {
          throw Error(
            `Service ${serviceName} is not available for client ${contract.name}`
          );
        }

        invoiceData.items.push({
          description: service.name,
          period: `${startDate} - ${endDate}`,
          qty:
            times[serviceName].reduce((acc, val) => {
              return acc + val.duration;
            }, 0) / 3600,
          unitPrice: service.price,
        });
      }
    }

    const id = await insertInvoice(invoiceData);
    invoiceData.invoiceNumber = `${output.owner.invoice.prefix}${id}`;

    const generator = new InvoiceGenerator();
    generator.generateInvoice(invoiceData, `invoice_${contract.name}.pdf`);
    console.log('Generated invoice data:', invoiceData);
  }
})().catch((error) => {
  console.error('Error in main execution:', error);
});
