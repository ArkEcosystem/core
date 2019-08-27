/**
 * @todo: remove the generic defaults
 *
 * @export
 * @interface CacheStore
 * @template K
 * @template T
 */
export interface CacheStore<K = string, T = any> {
    /**
     * Create a new instance of the cache store.
     *
     * @returns {CacheStore<K, T>}
     * @memberof CacheStore
     */
    make(): Promise<CacheStore<K, T>>;

    /**
     * Get all of the items in the cache.
     *
     * @returns {Array<[K, T]>}
     * @memberof CacheStore
     */
    all(): Promise<Array<[K, T]>>;

    /**
     * Get the keys of the cache items.
     *
     * @returns {K[]}
     * @memberof CacheStore
     */
    keys(): Promise<K[]>;

    /**
     * Get the values of the cache items.
     *
     * @returns {T[]}
     * @memberof CacheStore
     */
    values(): Promise<T[]>;

    /**
     * Retrieve an item from the cache by key.
     *
     * @param {K} key
     * @returns {(T | undefined)}
     * @memberof CacheStore
     */
    get(key: K): Promise<T | undefined>;

    /**
     * Retrieve multiple items from the cache by key.
     *
     * @param {K[]} keys
     * @returns {(Array<T | undefined>)}
     * @memberof CacheStore
     */
    getMany(keys: K[]): Promise<Array<T | undefined>>;

    /**
     * Store an item in the cache for a given number of seconds.
     *
     * @param {K} key
     * @param {T} value
     * @param {number} seconds
     * @returns {boolean}
     * @memberof CacheStore
     */
    put(key: K, value: T, seconds: number): Promise<boolean>;

    /**
     * Store multiple items in the cache for a given number of seconds.
     *
     * @param {Array<[K, T]>} values
     * @param {number} seconds
     * @returns {boolean[]}
     * @memberof CacheStore
     */
    putMany(values: Array<[K, T]>, seconds: number): Promise<boolean[]>;

    /**
     * Determine if an item exists in the cache.
     *
     * @param {K} key
     * @returns {boolean}
     * @memberof CacheStore
     */
    has(key: K): Promise<boolean>;

    /**
     * Determine multiple items exist in the cache.
     *
     * @param {K[]} keys
     * @returns {boolean[]}
     * @memberof CacheStore
     */
    hasMany(keys: K[]): Promise<boolean[]>;

    /**
     * Determine if an item doesn't exist in the cache.
     *
     * @param {K} key
     * @returns {boolean}
     * @memberof CacheStore
     */
    missing(key: K): Promise<boolean>;

    /**
     * Determine multiple items don't exist in the cache.
     *
     * @param {K[]} keys
     * @returns {boolean[]}
     * @memberof CacheStore
     */
    missingMany(keys: K[]): Promise<boolean[]>;

    /**
     * Store an item in the cache indefinitely.
     *
     * @param {K} key
     * @param {T} value
     * @returns {boolean}
     * @memberof CacheStore
     */
    forever(key: K, value: T): Promise<boolean>;

    /**
     * Store multiple items in the cache indefinitely.
     *
     * @param {Array<[K, T]>} values
     * @param {T} value
     * @returns {boolean[]}
     * @memberof CacheStore
     */
    foreverMany(values: Array<[K, T]>, value: T): Promise<boolean[]>;

    /**
     * Remove an item from the cache.
     *
     * @param {K} key
     * @returns {boolean}
     * @memberof CacheStore
     */
    forget(key: K): Promise<boolean>;

    /**
     * Remove multiple items from the cache.
     *
     * @param {K[]} keys
     * @returns {boolean[]}
     * @memberof CacheStore
     */
    forgetMany(keys: K[]): Promise<boolean[]>;

    /**
     * Remove all items from the cache.
     *
     * @returns {boolean}
     * @memberof CacheStore
     */
    flush(): Promise<boolean>;

    /**
     * Get the cache key prefix.
     *
     * @returns {string}
     * @memberof CacheStore
     */
    getPrefix(): Promise<string>;
}
