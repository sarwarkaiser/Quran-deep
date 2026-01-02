/**
 * Validation utilities using Zod
 */

import { z } from 'zod';

// Ayah reference validation
export const ayahReferenceSchema = z.string().regex(/^\d{1,3}:\d{1,3}$/);

// Surah ID validation (1-114)
export const surahIdSchema = z.number().int().min(1).max(114);

// Ayah number validation (depends on surah, but max is 286)
export const ayahNumberSchema = z.number().int().min(1).max(286);

// Email validation
export const emailSchema = z.string().email();

// Password validation (min 8 chars, at least one letter and one number)
export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number');

// User registration schema
export const userRegistrationSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    name: z.string().min(2).max(100),
});

// Annotation schema
export const annotationSchema = z.object({
    projectId: z.string().uuid(),
    ayahId: z.string(),
    noteText: z.string().min(1).max(10000),
    noteHtml: z.string().optional(),
    tags: z.array(z.string()).max(20),
    isPrivate: z.boolean().default(true),
});

// Search params schema
export const searchParamsSchema = z.object({
    q: z.string().min(1),
    type: z.enum(['translation', 'phonetic', 'semantic', 'all']).default('translation'),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    surahId: surahIdSchema.optional(),
    ayahStart: ayahNumberSchema.optional(),
    ayahEnd: ayahNumberSchema.optional(),
});

// Project schema
export const projectSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    isPublic: z.boolean().default(false),
    tags: z.array(z.string()).max(20),
});

/**
 * Validate data against schema
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    return schema.parse(data);
}

/**
 * Safe validation that returns result object
 */
export function safeValidate<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, errors: result.error };
}
