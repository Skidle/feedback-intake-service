import express, { type Express } from 'express';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod';
import { ExtractedFieldsSchema, type FeedbackRecord } from './contract.js';
import type { ExtractionClient } from './extraction/index.js';
import { createStore } from './store.js';

const SubmissionSchema = z.object({
  text: z.string().trim().min(1).max(5000),
});

export function createApp(deps: { extraction: ExtractionClient }): Express {
  const app = express();
  const store = createStore();

  app.use(express.json());

  app.post('/feedback', async (req, res) => {
    const submission = SubmissionSchema.safeParse(req.body);
    if (!submission.success) {
      res.status(400).json({
        error: 'Invalid submission',
        details: z.treeifyError(submission.error),
      });
      return;
    }

    const { text } = submission.data;

    // The model's answer is untrusted input: it is validated before any of it
    // reaches the record, and a failure stores nothing.
    const extracted = ExtractedFieldsSchema.safeParse(
      await deps.extraction.extract(text),
    );
    if (!extracted.success) {
      res.status(422).json({
        error: 'Extraction did not satisfy the contract',
        details: z.treeifyError(extracted.error),
      });
      return;
    }

    const record: FeedbackRecord = {
      ...extracted.data,
      id: `fb_${uuidv7()}`,
      submittedAt: new Date().toISOString(),
      status: 'new',
      text,
    };

    store.save(record);
    res.status(201).json(record);
  });

  app.get('/feedback', (_req, res) => {
    res.status(200).json(store.list());
  });

  app.get('/feedback/:id', (req, res) => {
    const record = store.get(req.params.id);
    if (!record) {
      res.status(404).json({ error: 'No such record' });
      return;
    }

    res.status(200).json(record);
  });

  return app;
}
