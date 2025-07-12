import { writable } from 'svelte/store';
import { 
  senderSchema, 
  billToSchema, 
  invoiceDetailsSchema, 
  lineItemSchema,
  validateSection 
} from '$lib/validation';

// Validation store
export const validationErrors = writable<Record<string, string>>({});
export const showValidationErrors = writable(false);

// Helper function to update errors for a specific field
export function setFieldError(fieldPath: string, error: string) {
  validationErrors.update(errors => ({
    ...errors,
    [fieldPath]: error
  }));
}

// Helper function to clear error for a specific field
export function clearFieldError(fieldPath: string) {
  validationErrors.update(errors => {
    const newErrors = { ...errors };
    delete newErrors[fieldPath];
    return newErrors;
  });
}

// Helper function to clear all errors
export function clearAllErrors() {
  validationErrors.set({});
}

// Validate form data and return errors
export function validateFormData(formData: any): string[] {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  // Validate sender using Zod
  const senderErrors = validateSection(senderSchema, formData.sender);
  senderErrors.forEach((error, field) => {
    fieldErrors[`sender.${field}`] = error;
    errors.push(`Sender ${field}: ${error}`);
  });

  // Validate billTo using Zod
  const billToData = {
    name: formData.billTo.name,
    entityNumber: formData.billTo.companyNumber,
    address: formData.billTo.address,
    city: formData.billTo.city,
    country: formData.billTo.country,
  };
  const billToErrors = validateSection(billToSchema, billToData);
  billToErrors.forEach((error, field) => {
    const mappedField = field === 'entityNumber' ? 'companyNumber' : field;
    fieldErrors[`billTo.${mappedField}`] = error;
    errors.push(`Bill-to ${field}: ${error}`);
  });

  // Validate invoice details using Zod
  const detailsData = {
    invoiceNumber: formData.invoiceNumber,
    issueDate: formData.issueDate,
    dueDate: formData.dueDate,
    taxRate: formData.taxRate,
  };
  const detailsErrors = validateSection(invoiceDetailsSchema, detailsData);
  detailsErrors.forEach((error, field) => {
    fieldErrors[field] = error;
    errors.push(`Invoice ${field}: ${error}`);
  });

  // Items validation using Zod
  formData.items.forEach((item: any, index: number) => {
    const itemData = {
      description: item.description,
      quantity: item.qty,
      price: item.unitPrice,
    };
    const itemErrors = validateSection(lineItemSchema, itemData);
    itemErrors.forEach((error, field) => {
      fieldErrors[`items.${index}.${field}`] = error;
      errors.push(`Item ${index + 1} ${field}: ${error}`);
    });
  });

  // Check if at least one valid item exists
  const validItems = formData.items.filter(
    (item: any) =>
      item.description &&
      !isNaN(item.qty) &&
      !isNaN(item.unitPrice) &&
      item.qty > 0 &&
      item.unitPrice > 0
  );
  if (validItems.length === 0) {
    errors.push('At least one valid item is required');
    fieldErrors['items'] = 'At least one item with description, quantity > 0, and price > 0 is required';
  }

  // Update the store with all errors
  validationErrors.set(fieldErrors);
  
  return errors;
}

// Real-time field validation
export function validateSingleField(fieldPath: string, formData: any) {
  if (fieldPath.startsWith('sender.')) {
    const field = fieldPath.replace('sender.', '');
    const senderErrors = validateSection(senderSchema, formData.sender);
    if (senderErrors.has(field)) {
      setFieldError(fieldPath, senderErrors.get(field)!);
    } else {
      clearFieldError(fieldPath);
    }
  } else if (fieldPath.startsWith('billTo.')) {
    const field = fieldPath.replace('billTo.', '');
    const billToData = {
      name: formData.billTo.name,
      entityNumber: formData.billTo.companyNumber,
      address: formData.billTo.address,
      city: formData.billTo.city,
      country: formData.billTo.country,
    };
    const billToErrors = validateSection(billToSchema, billToData);
    const mappedField = field === 'companyNumber' ? 'entityNumber' : field;
    if (billToErrors.has(mappedField)) {
      setFieldError(fieldPath, billToErrors.get(mappedField)!);
    } else {
      clearFieldError(fieldPath);
    }
  } else {
    const detailsData = {
      invoiceNumber: formData.invoiceNumber,
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      taxRate: formData.taxRate,
    };
    const detailsErrors = validateSection(invoiceDetailsSchema, detailsData);
    if (detailsErrors.has(fieldPath)) {
      setFieldError(fieldPath, detailsErrors.get(fieldPath)!);
    } else {
      clearFieldError(fieldPath);
    }
  }
}