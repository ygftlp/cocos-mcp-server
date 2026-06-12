// Lightweight TTL cache used by tool wrappers to reduce repeated editor queries.
export class AsyncTTLCache<T> {
    private ttlMs: number;
    private entries: Map<string, { timestamp: number; data?: T; inFlight?: Promise<T> }>;

    constructor(ttlMs: number) {
        this.ttlMs = ttlMs;
        this.entries = new Map();
    }

    public async getOrLoad(key: string, loader: () => Promise<T>): Promise<T> {
        const now = Date.now();
        const existing = this.entries.get(key);

        if (existing) {
            if (existing.data && now - existing.timestamp < this.ttlMs) {
                return existing.data;
            }
            if (existing.inFlight) {
                return existing.inFlight;
            }
        }

        const inFlight = loader()
            .then((data) => {
                this.entries.set(key, { timestamp: Date.now(), data });
                return data;
            })
            .catch((error) => {
                this.entries.delete(key);
                throw error;
            });

        this.entries.set(key, { timestamp: now, inFlight });
        return inFlight;
    }

    public clear(): void {
        this.entries.clear();
    }

    public delete(key: string): void {
        this.entries.delete(key);
    }
}
