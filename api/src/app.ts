import express, { type Express } from 'express';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod';
import { ExtractedFieldsSchema, type FeedbackRecord } from './contract.js';
import type { ExtractionClient } from './extraction/index.js';
import { createStore } from './store.js';

const SubmissionSchema = z.object({
  text: z.string().trim().min(1).max(5000),
});

// Preserve the status middleware set on the error: a malformed body is a 400,
// and answering 500 would tell the caller to retry something that cannot work.
function statusOf(error: unknown): number {
  return typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
    ? error.status
    : 500;
}

type Attempt =
  | { ok: true; fields: z.infer<typeof ExtractedFieldsSchema> }
  | { ok: false; kind: 'threw' }
  | { ok: false; kind: 'invalid'; failure: string; details: unknown };

export function createApp(deps: { extraction: ExtractionClient }): Express {
  const app = express();
  const store = createStore();

  async function attempt(
    text: string,
    previousFailure?: string,
  ): Promise<Attempt> {
    let answer: unknown;
    try {
      answer = await deps.extraction.extract(text, previousFailure);
    } catch {
      return { ok: false, kind: 'threw' };
    }

    const parsed = ExtractedFieldsSchema.safeParse(answer);
    if (parsed.success) return { ok: true, fields: parsed.data };

    return {
      ok: false,
      kind: 'invalid',
      failure: z.prettifyError(parsed.error),
      details: z.treeifyError(parsed.error),
    };
  }

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

    // Exactly one repair attempt, and only for output that failed the contract —
    // which includes the model returning no tool call at all. A throw is not
    // retried: a correction cannot fix a provider that is down. Both failures
    // answer 422.
    let result = await attempt(text);
    if (!result.ok && result.kind === 'invalid') {
      result = await attempt(text, result.failure);
    }

    if (!result.ok) {
      res.status(422).json({
        error: 'Extraction did not satisfy the contract',
        details: result.kind === 'invalid' ? result.details : undefined,
      });
      return;
    }

    const record: FeedbackRecord = {
      ...result.fields,
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

  // Not conditioned on NODE_ENV: a response that leaks internals should not be
  // one environment variable away.
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
