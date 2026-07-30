// Untrusted until the route validates it against the contract.
type ExtractionResult = unknown;

export interface ExtractionClient {
    /** `previousFailure` is advisory — a client may ignore it. */
    extract(text: string, previousFailure?: string): Promise<ExtractionResult>;
}
