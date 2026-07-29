import { createApp } from './app.js';
import { createMockClient } from './extraction/mock.js';
import { createAnthropicClient } from './extraction/anthropic.js';

try {
  process.loadEnvFile();
} catch {
  // no .env is fine when AI_PROVIDER=mock 
}

const port = Number(process.env.PORT ?? 3000);

const createExtractionClient = process.env.AI_PROVIDER === 'mock' ? createMockClient : createAnthropicClient;

createApp({ extraction: createExtractionClient() }).listen(port, () => {
  console.log(`api listening on http://localhost:${port}`);
});
