import { CacheStore } from "../../../contracts/kernel/cache";
import { injectable } from "../../../ioc";

/**
 * @export
 * @class MemoryCacheStore
 * @implements {CacheStore}
 */
@injectable()
export class NullCacheStore<K, T> implements CacheStore<K, T> {
    /**
     * Create a new instance of the cache store.
     *
     * @param {Application} app
     * @returns {CacheStore<K, T>}
     * @memberof CacheStore
     */
    public async make(): Promise<CacheStore<K, T>> {
        return this;
    }

    /**
     * Get all of the items in the cache.
     *
     * @returns {Array<[K, T]>}
     * @memberof MemoryCacheStore
     */
    public async all(): Promise<Array<[K, T]>> {
        return [];
    }

    /**
     * Get the keys of the cache items.
     *
     * @returns {K[]}
     * @memberof MemoryCacheStore
     */
    public async keys(): Promise<K[]> {
        return [];
    }

    /**
     * Get the values of the cache items.
     *
     * @returns {T[]}
     * @memberof MemoryCacheStore
     */
    public async values(): Promise<T[]> {
        return [];
    }

    /**
     * Retrieve an item from the cache by key.
     *
     * @param {K} key
     * @returns {(T | undefined)}
     * @memberof MemoryCacheStore
     */
    public async get(key: K): Promise<T | undefined> {
        return undefined;
    }

    /**
     * Retrieve multiple items from the cache by key.
     *
     * @param {K[]} keys
     * @returns {(Array<T | undefined>)}
     * @memberof MemoryCacheStore
     */
    public async getMany(keys: K[]): Promise<Array<T | undefined>> {
        return new Array(keys.length).fill(undefined);
    }

    /**
     * Store an item in the cache for a given number of seconds.
     *
     * @param {K} key
     * @param {T} value
     * @param {number} seconds
     * @returns {boolean}
     * @memberof MemoryCacheStore
     */
    public async put(key: K, value: T, seconds?: number): Promise<boolean> {
        return false;
    }

    /**
     * Store multiple items in the cache for a given number of seconds.
     *
     * @param {Array<[K, T]>} values
     * @param {number} seconds
     * @returns {boolean[]}
     * @memberof MemoryCacheStore
     */
    public async putMany(values: Array<[K, T]>, seconds?: number): Promise<boolean[]> {
        return new Array(values.length).fill(false);
    }

    /**
     * Determine if an item exists in the cache.
     *
     * @param {K} key
     * @returns {boolean}
     * @memberof MemoryCacheStore
     */
    public async has(key: K): Promise<boolean> {
        return false;
    }

    /**
     * Determine multiple items exist in the cache.
     *
     * @param {K[]} keys
     * @returns {boolean[]}
     * @memberof MemoryCacheStore
     */
    public async hasMany(keys: K[]): Promise<boolean[]> {
        return new Array(keys.length).fill(false);
    }

    /**
     * Determine if an item doesn't exist in the cache.
     *
     * @param {K} key
     * @returns {boolean}
     * @memberof MemoryCacheStore
     */
    public async missing(key: K): Promise<boolean> {
        return true;
    }

    /**
     * Determine multiple items don't exist in the cache.
     *
     * @param {K[]} keys
     * @returns {boolean[]}
     * @memberof MemoryCacheStore
     */
    public async missingMany(keys: K[]): Promise<boolean[]> {
        return new Array(keys.length).fill(true);
    }

    /**
     * Store an item in the cache indefinitely.
     *
     * @param {K} key
     * @param {T} value
     * @returns {boolean}
     * @memberof MemoryCacheStore
     */
    public async forever(key: K, value: T): Promise<boolean> {
        return false;
    }

    /**
     * Store multiple items in the cache indefinitely.
     *
     * @param {Array<[K, T]>} values
     * @returns {boolean[]}
     * @memberof MemoryCacheStore
     */
    public async foreverMany(values: Array<[K, T]>): Promise<boolean[]> {
        return new Array(values.length).fill(false);
    }

    /**
     * Remove an item from the cache.
     *
     * @param {K} key
     * @returns {boolean}
     * @memberof MemoryCacheStore
     */
    public async forget(key: K): Promise<boolean> {
        return false;
    }

    /**
     * Remove multiple items from the cache.
     *
     * @param {K[]} keys
     * @returns {boolean[]}
     * @memberof MemoryCacheStore
     */
    public async forgetMany(keys: K[]): Promise<boolean[]> {
        return new Array(keys.length).fill(false);
    }

    /**
     * Remove all items from the cache.
     *
     * @returns {boolean}
     * @memberof MemoryCacheStore
     */
    public async flush(): Promise<boolean> {
        return false;
    }

    /**
     * Get the cache key prefix.
     *
     * @returns {string}
     * @memberof MemoryCacheStore
     */
    public async getPrefix(): Promise<string> {
        return "";
    }
}
