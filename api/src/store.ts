// The stored record type arrives with the contract. Until then the store is
// deliberately untyped in its payload — only the shape of the interface is fixed.
type StoredRecord = unknown;

export interface Store {
  save(record: StoredRecord): void;
  list(): StoredRecord[];
  get(id: string): StoredRecord | undefined;
}

export function createStore(): Store {
  const records = new Map<string, StoredRecord>();

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
