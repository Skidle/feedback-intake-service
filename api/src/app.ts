import express, { type Express } from 'express';
import type { ExtractionClient } from './extraction.js';

export function createApp(deps: { extraction: ExtractionClient }): Express {
  // Injected so tests can supply a fake client instead of calling the model.
  void deps;

  const app = express();

  app.use(express.json());

  app.post('/feedback', (_req, _res) => {
    throw new Error('not implemented');
  });

  app.get('/feedback', (_req, _res) => {
    throw new Error('not implemented');
  });

  app.get('/feedback/:id', (_req, _res) => {
    throw new Error('not implemented');
  });

  return app;
}
