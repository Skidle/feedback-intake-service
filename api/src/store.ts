import type { FeedbackRecord } from "./contract.js";

export interface Store {
  save(record: FeedbackRecord): void;
  list(): FeedbackRecord[];
  get(id: string): FeedbackRecord | undefined;
}

export function createStore(): Store {
  const records = new Map<string, FeedbackRecord>();

  return {
    save(_record) {
      void records;
      throw new Error('not implemented');
    },
    list() {
      throw new Error('not implemented');
    },
    get(_id) {
      throw new Error('not implemented');
    },
  };
}
