import { createApp } from './app.js';
import { createExtractionClient } from './extraction.js';

const port = Number(process.env.PORT ?? 3000);

createApp({ extraction: createExtractionClient() }).listen(port, () => {
  console.log(`api listening on http://localhost:${port}`);
});
