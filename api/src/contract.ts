import { z } from 'zod';

export const ExtractedFieldsSchema = z.object({
    category: z.enum(['bug', 'feature_request', 'praise', 'other']),
    sentiment: z.enum(['positive', 'neutral', 'negative']),
    severity: z.enum(['low', 'medium', 'high']),
    summary: z.string().min(1).max(200),
    suggestedAction: z.string().min(1).max(200),
});

export const FeedbackRecordSchema = ExtractedFieldsSchema.extend({
    id: z.string(),
    submittedAt: z.iso.datetime(),
    status: z.enum(['new', 'triaged', 'resolved']),
    text: z.string().min(1).max(5000),
})

export type ExtractedFields = z.infer<typeof ExtractedFieldsSchema>;
export type FeedbackRecord = z.infer<typeof FeedbackRecordSchema>;
