// What the model returns is validated against the contract before it is trusted,
// so the client's return type stays unknown until the contract exists.
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
