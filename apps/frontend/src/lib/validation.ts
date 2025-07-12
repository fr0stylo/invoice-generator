import { z } from 'zod';

export const senderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  entityNumber: z.string().min(1, 'Entity number is required'),
  entityType: z.enum(['entrepreneurship', 'company']),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().optional(),
  iban: z.string().optional(),
});

export const billToSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  entityNumber: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
});

export const invoiceDetailsSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  taxRate: z
    .number()
    .min(0, 'Tax rate must be 0 or greater')
    .max(100, 'Tax rate cannot exceed 100%'),
});

export const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
});

export const invoiceFormSchema = z.object({
  sender: senderSchema,
  billTo: billToSchema,
  details: invoiceDetailsSchema,
  items: z.array(lineItemSchema).min(1, 'At least one line item is required'),
});

export type SenderData = z.infer<typeof senderSchema>;
export type BillToData = z.infer<typeof billToSchema>;
export type InvoiceDetailsData = z.infer<typeof invoiceDetailsSchema>;
export type LineItemData = z.infer<typeof lineItemSchema>;
export type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

export function validateField<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  path: string
): string | null {
  try {
    schema.parse(data);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.issues.find(
        (err) => err.path.join('.') === path
      );
      return fieldError?.message || null;
    }
    return null;
  }
}

export function validateSection<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Map<string, string> {
  const errors = new Map<string, string>();

  try {
    schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach((err) => {
        const fieldPath = err.path.join('.');
        errors.set(fieldPath, err.message);
      });
    }
  }

  return errors;
}
