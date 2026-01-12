export type LruCacheOptions = {
  max: number;
};

type CacheEntry<V> = {
  value: V;
  expiresAt: number;
};

export class LruCache<K, V> {
  private max: number;
  private map = new Map<K, CacheEntry<V>>();

  constructor(options: LruCacheOptions) {
    this.max = options.max;
  }

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;

    if (Date.now() >= entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }

    // Refresh key ordering for LRU behavior.
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V, ttlMs: number): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    }

    this.map.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });

    if (this.map.size > this.max) {
      const oldestKey = this.map.keys().next().value as K | undefined;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }
  }
}
