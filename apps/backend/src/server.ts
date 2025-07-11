import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { InvoiceGenerator } from './invoiceGenerator.js';
import { InvoiceData } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// API endpoint to generate invoice
app.post('/api/generate-invoice', async (req, res) => {
  try {
    const invoiceData: InvoiceData = req.body;

    // Validate required fields
    if (!invoiceData.sender || !invoiceData.billTo || !invoiceData.items) {
      return res.status(400).json({ error: 'Missing required invoice data' });
    }

    // Set response headers for PDF streaming
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="invoice_${
        invoiceData.invoiceNumber || 'generated'
      }.pdf"`
    );

    // Create invoice generator and stream PDF directly to response
    const generator = new InvoiceGenerator();
    await generator.generateInvoiceStream(invoiceData, res);
  } catch (error) {
    console.error('Error generating invoice:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to generate invoice' });
    }
  }
  return;
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the UI - catch all routes and serve SvelteKit app
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  return res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

app.listen(port, () => {
  console.log(`Invoice generator server running on http://localhost:${port}`);
});
