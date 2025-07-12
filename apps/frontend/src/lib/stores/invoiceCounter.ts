import { writable } from 'svelte/store';

interface DailyCounter {
  date: string; // YYYY-MM-DD format
  counter: number;
}

interface InvoiceTemplate {
  template: string; // e.g., "INV-{{ inc }}" or "PROJ-2025-{{ inc }}"
  lastUsed: string; // ISO date string
}

const STORAGE_KEY = 'invoice-daily-counter';
const TEMPLATE_STORAGE_KEY = 'invoice-number-template';
const DEFAULT_TEMPLATE = 'INV-{{YEAR}}-{{MONTH}}-{{DAY}}-{{ inc }}';

// Get today's date in YYYY-MM-DD format
function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Load counter from localStorage
function loadDailyCounter(): DailyCounter {
  if (typeof window === 'undefined') {
    return { date: getTodayString(), counter: 0 };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as DailyCounter;
      const today = getTodayString();
      
      // If it's a new day, reset the counter
      if (parsed.date !== today) {
        return { date: today, counter: 0 };
      }
      
      return parsed;
    }
  } catch (error) {
    console.error('Error loading daily counter:', error);
  }
  
  return { date: getTodayString(), counter: 0 };
}

// Save counter to localStorage
function saveDailyCounter(counter: DailyCounter): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counter));
  } catch (error) {
    console.error('Error saving daily counter:', error);
  }
}

// Load template from localStorage
function loadInvoiceTemplate(): InvoiceTemplate {
  if (typeof window === 'undefined') {
    return { template: DEFAULT_TEMPLATE, lastUsed: new Date().toISOString() };
  }

  try {
    const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as InvoiceTemplate;
    }
  } catch (error) {
    console.error('Error loading invoice template:', error);
  }
  
  return { template: DEFAULT_TEMPLATE, lastUsed: new Date().toISOString() };
}

// Save template to localStorage
function saveInvoiceTemplate(template: InvoiceTemplate): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(template));
  } catch (error) {
    console.error('Error saving invoice template:', error);
  }
}

// Replace template variables with actual values
function processTemplate(template: string, increment: number): string {
  const today = new Date();
  const year = today.getFullYear().toString();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const paddedIncrement = increment.toString().padStart(3, '0');
  
  return template
    .replace(/\{\{\s*YEAR\s*\}\}/g, year)
    .replace(/\{\{\s*MM\s*\}\}/g, month)
    .replace(/\{\{\s*MONTH\s*\}\}/g, month)
    .replace(/\{\{\s*DD\s*\}\}/g, day)
    .replace(/\{\{\s*DAY\s*\}\}/g, day)
    .replace(/\{\{\s*inc\s*\}\}/g, paddedIncrement);
}

// Check if template contains increment placeholder
function hasIncrementPlaceholder(template: string): boolean {
  return /\{\{\s*inc\s*\}\}/i.test(template);
}

// Create the stores
export const dailyCounter = writable<DailyCounter>(loadDailyCounter());
export const invoiceTemplate = writable<InvoiceTemplate>(loadInvoiceTemplate());

// Subscribe to store changes and save to localStorage
dailyCounter.subscribe((counter) => {
  saveDailyCounter(counter);
});

invoiceTemplate.subscribe((template) => {
  saveInvoiceTemplate(template);
});

// Generate next invoice number for today using current template
export function generateNextInvoiceNumber(): string {
  const today = getTodayString();
  let currentCounter = loadDailyCounter();
  const currentTemplate = loadInvoiceTemplate();
  
  // If it's a new day, reset counter
  if (currentCounter.date !== today) {
    currentCounter = { date: today, counter: 0 };
  }
  
  // Increment counter
  currentCounter.counter += 1;
  
  // Update the store
  dailyCounter.set(currentCounter);
  
  // Process template with new counter
  return processTemplate(currentTemplate.template, currentCounter.counter);
}

// Get current day's counter without incrementing
export function getCurrentDayCounter(): number {
  const currentCounter = loadDailyCounter();
  const today = getTodayString();
  
  // If it's a new day, counter should be 0
  if (currentCounter.date !== today) {
    return 0;
  }
  
  return currentCounter.counter;
}

// Preview what the next invoice number would be (without incrementing)
export function previewNextInvoiceNumber(): string {
  const today = getTodayString();
  let currentCounter = loadDailyCounter();
  const currentTemplate = loadInvoiceTemplate();
  
  // If it's a new day, reset counter
  if (currentCounter.date !== today) {
    currentCounter = { date: today, counter: 0 };
  }
  
  // Preview the next number (without incrementing)
  const nextCounter = currentCounter.counter + 1;
  
  // Process template with preview counter
  return processTemplate(currentTemplate.template, nextCounter);
}

// Generate invoice number from custom template
export function generateFromTemplate(template: string): string {
  const today = getTodayString();
  let currentCounter = loadDailyCounter();
  
  // If it's a new day, reset counter
  if (currentCounter.date !== today) {
    currentCounter = { date: today, counter: 0 };
  }
  
  // If template has increment placeholder, use and increment counter
  if (hasIncrementPlaceholder(template)) {
    currentCounter.counter += 1;
    dailyCounter.set(currentCounter);
    
    // Save this template as the new template
    const newTemplate: InvoiceTemplate = {
      template: template,
      lastUsed: new Date().toISOString()
    };
    invoiceTemplate.set(newTemplate);
    
    return processTemplate(template, currentCounter.counter);
  } else {
    // If no increment placeholder, just process template as-is
    return processTemplate(template, 0);
  }
}

// Preview what a custom template would generate (without incrementing)
export function previewTemplate(template: string): string {
  const today = getTodayString();
  let currentCounter = loadDailyCounter();
  
  // If it's a new day, reset counter
  if (currentCounter.date !== today) {
    currentCounter = { date: today, counter: 0 };
  }
  
  // Preview with next counter if template has increment
  const previewCounter = hasIncrementPlaceholder(template) ? 
    currentCounter.counter + 1 : 0;
  
  return processTemplate(template, previewCounter);
}

// Update template without generating an invoice
export function updateTemplate(template: string): void {
  const newTemplate: InvoiceTemplate = {
    template: template,
    lastUsed: new Date().toISOString()
  };
  invoiceTemplate.set(newTemplate);
}

// Get current template
export function getCurrentTemplate(): string {
  return loadInvoiceTemplate().template;
}