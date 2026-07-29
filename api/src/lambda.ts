import serverless from 'serverless-http';
import { createApp } from './app.js';
import { createAnthropicClient } from './extraction/anthropic.js';
import { createMockClient } from './extraction/mock.js';

// Same createApp() that index.ts serves locally; only the entry differs — a
// listening port there, an invocation here. No loadEnvFile() because Lambda
// supplies environment variables directly.
const createExtractionClient =
  process.env.AI_PROVIDER === 'mock' ? createMockClient : createAnthropicClient;

export const handler = serverless(
  createApp({ extraction: createExtractionClient() }),
);
