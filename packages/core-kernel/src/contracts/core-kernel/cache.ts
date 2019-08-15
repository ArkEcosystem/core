export interface ICacheStore {
    /**
     * Retrieve an item from the cache by key.
     */
    get(key: string): Promise<any>;

    /**
     * Retrieve multiple items from the cache by key.
     */
    many(keys: string[]): Promise<Record<string, any>>;

    /**
     * Store an item in the cache for a given number of milliseconds.
     */
    put(key: string, value: any, ttl?: number): Promise<void>;

    /**
     * Store multiple items in the cache for a given number of milliseconds.
     */
    putMany(values: string[], ttl?: number): Promise<void>;

    /**
     * Increment the value of an item in the cache.
     */
    increment(key: string, value: number): Promise<void>;

    /**
     * Decrement the value of an item in the cache.
     */
    decrement(key: string, value: number): Promise<void>;

    /**
     * Check if an item exists in the cache by key.
     */
    has(key: string): Promise<boolean>;

    /**
     * Store an item in the cache indefinitely.
     */
    forever(key: string, value: string): Promise<void>;

    /**
     * Remove an item from the cache.
     */
    forget(key: string): Promise<void>;

    /**
     * Remove all items from the cache.
     */
    flush(): Promise<void>;
}
