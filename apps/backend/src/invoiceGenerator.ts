import fs from 'fs';
import PDFDocument from 'pdfkit'; // Import pdfkit-table for table support
import { TimeSheetEntry } from './types';

const regular = fs.readFileSync('fonts/Roboto-Regular.ttf');
const semiBold = fs.readFileSync('fonts/Roboto-SemiBold.ttf');

class InvoiceGenerator {
  pageSize: string;
  margins: { top: number; bottom: number; left: number; right: number };
  colors: { [key: string]: string };

  constructor(
    options: {
      pageSize?: string;
      margins?: { top: number; bottom: number; left: number; right: number };
    } = {}
  ) {
    this.pageSize = options.pageSize || 'A4';
    this.margins = options.margins || {
      top: 72,
      bottom: 72,
      left: 72,
      right: 72,
    };
    this.colors = {
      primary: '#E33939',
      secondary: '#972A2A',
      black: '#000000',
      gray: '#BCBABA',
      lightGray: '#f0f0f0',
      white: '#ffffff',
      tableHeader: '#D3D1D1',
    };
  }

  /**
   * Generate invoice PDF and stream to response
   * @param {Object} invoiceData - Invoice data object
   * @param {Object} res - Express response object
   */
  async generateInvoiceStream(invoiceData, res) {
    const processedData = this.processInvoiceData(invoiceData);

    const doc = new PDFDocument({
      size: this.pageSize,
      margins: this.margins,
      lang: 'lt-LT',
      info: {
        Title: `Invoice #${processedData.invoiceNumber}`,
      },
      pdfVersion: '1.7',
      compress: true,
    });

    doc.registerFont('Roboto-Regular', regular);
    doc.registerFont('Roboto-SemiBold', semiBold);

    const g = doc.linearGradient(0, 0, doc.page.width, doc.page.height);
    g.stop(0, this.colors.white);
    g.stop(1, this.colors.lightGray);

    // Pipe PDF directly to response
    doc.pipe(res);
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(g);

    this.addHeader(doc);
    this.addInvoiceDetails(doc, processedData);
    this.addParties(doc, processedData);
    this.addItemsTable(doc, processedData);

    this.addTimesheetSummary(doc, processedData.timesheets);

    doc.end();

    console.log('Invoice PDF streamed successfully');
  }

  /**
   * Generate invoice PDF
   * @param {Object} invoiceData - Invoice data object
   * @param {string} outputPath - Output file path
   */
  async generateInvoice(invoiceData, outputPath = 'invoice.pdf') {
    const processedData = this.processInvoiceData(invoiceData);

    const doc = new PDFDocument({
      size: this.pageSize,
      margins: this.margins,
      lang: 'lt-LT',
      info: {
        Title: `Invoice #${processedData.invoiceNumber}`,
      },
      pdfVersion: '1.7',
      compress: true,
    });

    doc.registerFont('Roboto-Regular', regular);
    doc.registerFont('Roboto-SemiBold', semiBold);

    const g = doc.linearGradient(0, 0, doc.page.width, doc.page.height);
    g.stop(0, this.colors.white);
    g.stop(1, this.colors.lightGray);

    doc.pipe(fs.createWriteStream(outputPath));
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(g);

    this.addHeader(doc);
    this.addInvoiceDetails(doc, processedData);
    this.addParties(doc, processedData);
    this.addItemsTable(doc, processedData);

    this.addTimesheetSummary(doc, processedData.timesheets);

    doc.end();

    console.log(`Invoice PDF generated: ${outputPath}`);
    return outputPath;
  }

  addTimesheetSummary(doc, timesheets) {
    if (!timesheets || timesheets.length === 0) {
      console.log('No timesheets to summarize.');
      return;
    }

    const page = doc.addPage();
    this.addHeader(page, { title: 'Time Entries Summary' });
    page.moveDown(2);
    doc.fontSize(10);
    const collWidth = [
      100,
      50,
      50,
      page.page.width -
        page.page.margins.left -
        page.page.margins.right -
        100 -
        50 -
        50,
    ];
    const table = page.table({
      columnStyles: (i) => ({
        align: 'left',
        width: collWidth[i], // Adjust widths for better layout
      }),
      defaultStyle: {
        font: 'Roboto-SemiBold',
        border: { bottom: 0.5, right: 0, left: 0, top: 0 },
        // padding: '0.1em',
        align: { y: 'bottom' },
        padding: { x: '0.5em', y: '0.2em' },
      },
      position: { x: page.page.margins.left, y: page.y },
    });
    table.row(['Start', 'End', 'Duration', 'Description']);
    timesheets.forEach((entry: TimeSheetEntry) => {
      table.row([entry.start, entry.end, entry.seconds, entry.name]);
    });
    table.end();
    page.moveDown(2);
  }

  /**
   * Process and validate invoice data, calculate totals
   * @param {Object} data - Raw invoice data
   * @returns {Object} Processed invoice data
   */
  processInvoiceData(data) {
    const processed = { ...data };

    // Calculate item amounts and totals
    processed.subtotal = 0;

    processed.items.forEach((item) => {
      item.amount = item.qty * item.unitPrice;
      processed.subtotal += item.amount;
    });

    processed.tax = processed.subtotal * (processed.taxRate / 100);
    processed.total = processed.subtotal + processed.tax;
    processed.amountDue = processed.total;

    return processed;
  }

  /**
   * Add header with gradient line and title
   * @param {PDFDocument} doc - PDF document instance
   */
  addHeader(doc, { title }: { title: string } = { title: 'Invoice' }) {
    // Header gradient line
    const gradient = doc
      .linearGradient(0, 0, doc.page.width, 5)
      .stop(0, this.colors.primary)
      .stop(5, this.colors.secondary);

    doc.fill(gradient);
    doc.rect(0, 0, doc.page.width, 5).fill();
    doc.rect(0, 5, doc.page.width, 0.1).fill(this.colors.black);

    // Reset styling
    doc.font('Roboto-SemiBold');
    doc.fillColor(this.colors.black);

    // Invoice title
    doc.fontSize(24).text(title, { align: 'center' });
    doc.font('Roboto-Regular');
    doc.fontSize(10);
    doc.moveDown();
  }

  /**
   * Add invoice details (number, dates)
   * @param {PDFDocument} doc - PDF document instance
   * @param {Object} data - Invoice data
   */
  addInvoiceDetails(doc, data) {
    doc.fontSize(10);

    const detailsTable = doc.table({
      columnStyles: (i) => ({
        align: i === 0 ? 'left' : 'right',
      }),
      defaultStyle: {
        font: 'Roboto-SemiBold',
        border: 0,
        padding: '0.1em',
        align: { y: 'bottom' },
      },
      position: { x: doc.page.margins.left, y: doc.y },
      maxWidth: 200,
    });

    detailsTable
      .row(['Invoice Number:', `${data.invoiceNumber}`])
      .row(['Date of Issue:', data.issueDate])
      .row(['Date Due:', data.dueDate])
      .end();

    doc.moveDown(2);
  }

  /**
   * Add sender and bill-to information
   * @param {PDFDocument} doc - PDF document instance
   * @param {Object} data - Invoice data
   */
  addParties(doc, data) {
    const columnGap = 50;
    const senderWidth =
      (doc.page.width -
        doc.page.margins.left -
        doc.page.margins.right -
        columnGap) /
      2;
    const billToX = doc.page.margins.left + senderWidth + columnGap;
    const currentY = doc.y;

    // Bill To (Left Column)
    this.addBillToSection(doc, data.billTo, doc.page.margins.left, currentY);

    // Sender (Right Column)
    this.addSenderSection(doc, data.sender, billToX, currentY);

    // Ensure next content starts below both columns
    doc.y = Math.max(doc.y, currentY + 80) + 30;
  }

  /**
   * Add bill-to section
   * @param {PDFDocument} doc - PDF document instance
   * @param {Object} billTo - Bill-to data
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  addBillToSection(doc, billTo, x, y) {
    doc.fontSize(12).font('Roboto-SemiBold').text('Issued To:', x, y);
    doc.font('Roboto-Regular').fontSize(10);
    doc.text(billTo.name, x);
    doc.text(`Company number: ${billTo.companyNumber}`, x);
    doc.text(billTo.address, x);
    const state = billTo.state ? `${billTo.state}, ` : '';
    doc.text(`${billTo.city}, ${state}${billTo.zip}`, x);
    doc.text(billTo.country, x);
  }

  /**
   * Add sender section
   * @param {PDFDocument} doc - PDF document instance
   * @param {Object} sender - Sender data
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  addSenderSection(doc, sender, x, y) {
    doc.fontSize(12).font('Roboto-SemiBold').text('From:', x, y);
    doc.font('Roboto-Regular').fontSize(10);
    doc.text(sender.name, x);
    doc.text(`Individual entrepreneurship number: ${sender.entityNumber}`, x);
    doc.text(`${sender.address}, ${sender.city}`, x);
    doc.text(sender.country, x);
    doc.text(`Phone: ${sender.phone}`, x);
    doc.text(`IBAN: ${sender.iban}`, x);
  }

  /**
   * Add items table with totals
   * @param {PDFDocument} doc - PDF document instance
   * @param {Object} data - Invoice data
   */
  addItemsTable(doc, data) {
    const table = doc.table({
      columnStyles: this.getTableColumnStyles(),
      defaultStyle: this.getTableDefaultStyle(),
      rowStyles: this.getTableRowStyles(),
      position: { x: doc.page.margins.left, y: doc.y },
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      prepareHeader: () => {
        console.log('Preparing table header');
        return doc.font('Helvetica-Bold').fontSize(10);
      },
    });

    doc.font('Roboto-SemiBold');
    // Header row
    table.row([
      { text: 'Description', font: 'Helvetica-Bold' },
      { text: 'Qty', font: 'Roboto-SemiBold' },
      { text: 'Unit Price', font: 'Roboto-SemiBold' },
      { text: 'Amount', font: 'Roboto-SemiBold' },
    ]);
    doc.font('Roboto-Regular');

    // Item rows
    data.items.forEach((item) => {
      table.row([
        {
          text: `${item.description}${item.period ? `\n(${item.period})` : ''}`,
        },
        { text: item.qty.toString(), align: { x: 'right', y: 'top' } },
        `€ ${item.unitPrice.toFixed(2)}`,
        `€ ${item.amount.toFixed(2)}`,
      ]);
    });

    // Summary rows
    this.addSummaryRows(table, data);
    table.end();
  }

  /**
   * Get table column styles
   * @returns {Function} Column styles function
   */
  getTableColumnStyles() {
    return (i) => {
      switch (i) {
        case 0:
          return { width: 250 }; // Description
        case 1:
          return { width: 70, align: { x: 'right', y: 'bottom' } }; // Qty
        case 2:
          return { width: 70, align: 'right' }; // Unit Price
        case 3:
          return { width: 70, align: 'right' }; // Amount
        default:
          return {};
      }
    };
  }

  /**
   * Get table default styles
   * @returns {Object} Default style object
   */
  getTableDefaultStyle() {
    return {
      font: 'Roboto-Regular',
      fontSize: 10,
      fillColor: this.colors.lightGray,
      strokeColor: '#aaaaaa',
      lineWidth: 0.5,
      padding: '0.5em',
      border: { bottom: 0.5, right: 0, left: 0, top: 0.5 },
      borderColor: this.colors.black,
      align: { y: 'bottom' },
      minHeight: '2em',
    };
  }

  /**
   * Get table row styles
   * @returns {Function} Row styles function
   */
  getTableRowStyles() {
    return (i) => {
      if (i === 0) {
        return {
          backgroundColor: this.colors.tableHeader,
          font: 'Roboto-SemiBold',
          fontSize: 10,
          fillColor: this.colors.tableHeader,
        };
      }
      return {};
    };
  }

  /**
   * Add summary rows to table
   * @param {Object} table - Table instance
   * @param {Object} data - Invoice data
   */
  addSummaryRows(table, data) {
    const summaryBorder = { bottom: 0.5, left: 0, right: 0 };

    table
      .row([
        { colSpan: 2, border: { top: 0.5, bottom: 0 } },
        {
          text: 'Subtotal',
          align: 'right',
        },
        {
          text: `€ ${data.subtotal.toFixed(2)}`,
          align: 'right',
        },
      ])
      .row([
        { colSpan: 2, border: 0 },
        { text: `Tax (${data.taxRate}%)`, align: 'right', ...summaryBorder },
        {
          text: data.taxRate === 0 ? '0.00' : `€ ${data.tax.toFixed(2)}`,
          align: 'right',
          ...summaryBorder,
        },
      ])
      .row([
        { colSpan: 2, border: 0 },
        { text: 'Total', align: 'right', ...summaryBorder },
        {
          text: `€ ${data.total.toFixed(2)}`,
          align: 'right',
          ...summaryBorder,
        },
      ])
      .row([
        { colSpan: 2, border: 0 },
        { text: 'Amount Due', align: 'right', ...summaryBorder },
        {
          text: `€ ${data.amountDue.toFixed(2)}`,
          align: 'right',
          ...summaryBorder,
        },
      ]);
  }
}

export { InvoiceGenerator };
