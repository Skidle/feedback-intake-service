// Untrusted until the route validates it against the contract.
type ExtractionResult = unknown;

export interface ExtractionClient {
  extract(text: string): Promise<ExtractionResult>;
}

export function createExtractionClient(): ExtractionClient {
  return {
    async extract(_text) {
      throw new Error('not implemented');
    },
  };
}
