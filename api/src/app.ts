import express, { type Express } from 'express';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod';
import { ExtractedFieldsSchema, type FeedbackRecord } from './contract.js';
import type { ExtractionClient } from './extraction/index.js';
import { createStore } from './store.js';

const SubmissionSchema = z.object({
  text: z.string().trim().min(1).max(5000),
});

// Errors thrown by middleware carry the status they mean — body-parser sets 400
// on a malformed body. Answering 500 would tell the caller to retry something
// that will fail identically every time.
function statusOf(error: unknown): number {
  return typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
    ? error.status
    : 500;
}

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

    // A call that throws and an answer that fails the contract are the same
    // outcome for the caller: no valid record, so neither is allowed to escape
    // as a 500 carrying a stack trace.
    let answer: unknown;
    try {
      answer = await deps.extraction.extract(text);
    } catch {
      res.status(422).json({ error: 'Extraction did not satisfy the contract' });
      return;
    }

    // The model's answer is untrusted input: it is validated before any of it
    // reaches the record, and a failure stores nothing.
    const extracted = ExtractedFieldsSchema.safeParse(answer);
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

  // Express treats a four-argument middleware as the error handler. Without one
  // it answers with its own HTML page containing the stack trace and absolute
  // file paths. This replies with the same shape as every other error and logs
  // the detail server-side instead. Not conditioned on NODE_ENV: a response
  // that leaks internals should not be one environment variable away.
  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(error);
      const status = statusOf(error);
      res
        .status(status)
        .json({ error: status < 500 ? 'Invalid request' : 'Internal error' });
    },
  );

  return app;
}
