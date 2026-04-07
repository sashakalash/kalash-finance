import { z } from 'zod';

export const TransactionTypeSchema = z.enum(['expense', 'income']);
export const TransactionSourceSchema = z.enum(['csv', 'telegram', 'manual']);
export const BankFormatSchema = z.enum(['bog', 'custom']);

export const CreateTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).default('GEL'),
  type: TransactionTypeSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  description: z.string().min(1).max(255).nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  source: TransactionSourceSchema.default('manual'),
});

export const UpdateTransactionSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  type: TransactionTypeSchema.optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  description: z.string().min(1).max(255).nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().max(10).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be hex color')
    .nullable()
    .optional(),
});

export const ImportTransactionsSchema = z.object({
  transactions: z.array(
    z.object({
      amount: z.number().positive(),
      currency: z.string().length(3),
      type: TransactionTypeSchema,
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      description: z.string().max(255),
      category_id: z.string().uuid().nullable().optional(),
      hash: z.string(),
    }),
  ),
  bank_format: BankFormatSchema,
  filename: z.string(),
});

/** Vision API response from Claude for receipt OCR */
export const ReceiptOcrSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).default('GEL'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  merchant: z.string().max(100).nullable().optional(),
  category: z.string().max(50).nullable().optional(),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type ImportTransactionsInput = z.infer<typeof ImportTransactionsSchema>;
export type ReceiptOcrResult = z.infer<typeof ReceiptOcrSchema>;
