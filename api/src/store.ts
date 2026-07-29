import type { FeedbackRecord } from "./contract.js";

export interface Store {
  save(record: FeedbackRecord): void;
  list(): FeedbackRecord[];
  get(id: string): FeedbackRecord | undefined;
}

export function createStore(): Store {
  const records = new Map<string, FeedbackRecord>();

  return {
    save(record) {
      records.set(record.id, record);
    },
    list() {
      return [...records.values()];
    },
    get(id) {
      return records.get(id);
    },
  };
}
