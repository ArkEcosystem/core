import { IApplication } from "../../../contracts/core-kernel";
import { ICacheStore } from "../../../contracts/core-kernel/cache";
import { NotImplementedError } from "../../../errors";

/**
 * @export
 * @class MemoryStore
 * @implements {ICacheStore}
 */
export class MemoryStore<K, T> implements ICacheStore<K, T> {
    /**
     * @private
     * @type {Map<K, T>}
     * @memberof MemoryStore
     */
    private readonly store: Map<K, T> = new Map<K, T>();

    /**
     * Create a new instance of the cache store.
     *
     * @param {IApplication} app
     * @returns {ICacheStore<K, T>}
     * @memberof ICacheStore
     */
    public async make(app: IApplication): Promise<ICacheStore<K, T>> {
        return this;
    }

    /**
     * Get all of the items in the cache.
     *
     * @returns {Array<[K, T]>}
     * @memberof MemoryStore
     */
    public async all(): Promise<Array<[K, T]>> {
        return Array.from(this.store.entries());
    }

    /**
     * Get the keys of the cache items.
     *
     * @returns {K[]}
     * @memberof MemoryStore
     */
    public async keys(): Promise<K[]> {
        return Array.from(this.store.keys());
    }

    /**
     * Get the values of the cache items.
     *
     * @returns {T[]}
     * @memberof MemoryStore
     */
    public async values(): Promise<T[]> {
        return Array.from(this.store.values());
    }

    /**
     * Retrieve an item from the cache by key.
     *
     * @param {K} key
     * @returns {(T | undefined)}
     * @memberof MemoryStore
     */
    public async get(key: K): Promise<T | undefined> {
        return this.store.get(key);
    }

    /**
     * Retrieve multiple items from the cache by key.
     *
     * @param {K[]} keys
     * @returns {(Array<T | undefined>)}
     * @memberof MemoryStore
     */
    public async getMany(keys: K[]): Promise<Array<T | undefined>> {
        return keys.map((key: K) => this.store.get(key));
    }

    /**
     * Store an item in the cache for a given number of seconds.
     *
     * @param {K} key
     * @param {T} value
     * @param {number} seconds
     * @returns {boolean}
     * @memberof MemoryStore
     */
    public async put(key: K, value: T, seconds: number): Promise<boolean> {
        this.store.set(key, value);

        return this.has(key);
    }

    /**
     * Store multiple items in the cache for a given number of seconds.
     *
     * @param {Array<[K, T]>} values
     * @param {number} seconds
     * @returns {boolean[]}
     * @memberof MemoryStore
     */
    public async putMany(values: Array<[K, T]>, seconds: number): Promise<boolean[]> {
        return values.map((value: [K, T]) => {
            this.store.set(value[0], value[1]);

            return this.has(value[0]);
        });
    }

    /**
     * Determine if an item exists in the cache.
     *
     * @param {K} key
     * @returns {boolean}
     * @memberof MemoryStore
     */
    public async has(key: K): Promise<boolean> {
        return this.store.has(key);
    }

    /**
     * Determine multiple items exist in the cache.
     *
     * @param {K[]} keys
     * @returns {boolean[]}
     * @memberof MemoryStore
     */
    public async hasMany(keys: K[]): Promise<boolean[]> {
        return keys.map((key: K) => this.has(key));
    }

    /**
     * Determine if an item doesn't exist in the cache.
     *
     * @param {K} key
     * @returns {boolean}
     * @memberof MemoryStore
     */
    public async missing(key: K): Promise<boolean> {
        return !this.has(key);
    }

    /**
     * Determine multiple items don't exist in the cache.
     *
     * @param {K[]} keys
     * @returns {boolean[]}
     * @memberof MemoryStore
     */
    public async missingMany(keys: K[]): Promise<boolean[]> {
        return keys.map((key: K) => this.missing(key));
    }

    /**
     * Store an item in the cache indefinitely.
     *
     * @param {K} key
     * @param {T} value
     * @returns {boolean}
     * @memberof MemoryStore
     */
    public async forever(key: K, value: T): Promise<boolean> {
        throw new NotImplementedError(this.constructor.name, "forever");
    }

    /**
     * Store multiple items in the cache indefinitely.
     *
     * @param {Array<[K, T]>} values
     * @param {T} value
     * @returns {boolean[]}
     * @memberof MemoryStore
     */
    public async foreverMany(values: Array<[K, T]>, value: T): Promise<boolean[]> {
        throw new NotImplementedError(this.constructor.name, "foreverMany");
    }

    /**
     * Remove an item from the cache.
     *
     * @param {K} key
     * @returns {boolean}
     * @memberof MemoryStore
     */
    public async forget(key: K): Promise<boolean> {
        this.store.delete(key);

        return this.missing(key);
    }

    /**
     * Remove multiple items from the cache.
     *
     * @param {K[]} keys
     * @returns {boolean[]}
     * @memberof MemoryStore
     */
    public async forgetMany(keys: K[]): Promise<boolean[]> {
        return keys.map((key: K) => this.missing(key));
    }

    /**
     * Remove all items from the cache.
     *
     * @returns {boolean}
     * @memberof MemoryStore
     */
    public async flush(): Promise<boolean> {
        this.store.clear();

        return this.store.size === 0;
    }

    /**
     * Get the cache key prefix.
     *
     * @returns {string}
     * @memberof MemoryStore
     */
    public async getPrefix(): Promise<string> {
        throw new NotImplementedError(this.constructor.name, "getPrefix");
    }
}
