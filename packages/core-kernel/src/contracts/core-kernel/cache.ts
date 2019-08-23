// @TODO: remove the defaults
export interface ICacheStore<K = string, T = any> {
    /**
     * Create a new instance of the cache store.
     *
     * @returns {ICacheStore<K, T>}
     * @memberof ICacheStore
     */
    make(): Promise<ICacheStore<K, T>>;

    /**
     * Get all of the items in the cache.
     *
     * @returns {Array<[K, T]>}
     * @memberof ICacheStore
     */
    all(): Promise<Array<[K, T]>>;

    /**
     * Get the keys of the cache items.
     *
     * @returns {K[]}
     * @memberof ICacheStore
     */
    keys(): Promise<K[]>;

    /**
     * Get the values of the cache items.
     *
     * @returns {T[]}
     * @memberof ICacheStore
     */
    values(): Promise<T[]>;

    /**
     * Retrieve an item from the cache by key.
     *
     * @param {K} key
     * @returns {(T | undefined)}
     * @memberof ICacheStore
     */
    get(key: K): Promise<T | undefined>;

    /**
     * Retrieve multiple items from the cache by key.
     *
     * @param {K[]} keys
     * @returns {(Array<T | undefined>)}
     * @memberof ICacheStore
     */
    getMany(keys: K[]): Promise<Array<T | undefined>>;

    /**
     * Store an item in the cache for a given number of seconds.
     *
     * @param {K} key
     * @param {T} value
     * @param {number} seconds
     * @returns {boolean}
     * @memberof ICacheStore
     */
    put(key: K, value: T, seconds: number): Promise<boolean>;

    /**
     * Store multiple items in the cache for a given number of seconds.
     *
     * @param {Array<[K, T]>} values
     * @param {number} seconds
     * @returns {boolean[]}
     * @memberof ICacheStore
     */
    putMany(values: Array<[K, T]>, seconds: number): Promise<boolean[]>;

    /**
     * Determine if an item exists in the cache.
     *
     * @param {K} key
     * @returns {boolean}
     * @memberof ICacheStore
     */
    has(key: K): Promise<boolean>;

    /**
     * Determine multiple items exist in the cache.
     *
     * @param {K[]} keys
     * @returns {boolean[]}
     * @memberof ICacheStore
     */
    hasMany(keys: K[]): Promise<boolean[]>;

    /**
     * Determine if an item doesn't exist in the cache.
     *
     * @param {K} key
     * @returns {boolean}
     * @memberof ICacheStore
     */
    missing(key: K): Promise<boolean>;

    /**
     * Determine multiple items don't exist in the cache.
     *
     * @param {K[]} keys
     * @returns {boolean[]}
     * @memberof ICacheStore
     */
    missingMany(keys: K[]): Promise<boolean[]>;

    /**
     * Store an item in the cache indefinitely.
     *
     * @param {K} key
     * @param {T} value
     * @returns {boolean}
     * @memberof ICacheStore
     */
    forever(key: K, value: T): Promise<boolean>;

    /**
     * Store multiple items in the cache indefinitely.
     *
     * @param {Array<[K, T]>} values
     * @param {T} value
     * @returns {boolean[]}
     * @memberof ICacheStore
     */
    foreverMany(values: Array<[K, T]>, value: T): Promise<boolean[]>;

    /**
     * Remove an item from the cache.
     *
     * @param {K} key
     * @returns {boolean}
     * @memberof ICacheStore
     */
    forget(key: K): Promise<boolean>;

    /**
     * Remove multiple items from the cache.
     *
     * @param {K[]} keys
     * @returns {boolean[]}
     * @memberof ICacheStore
     */
    forgetMany(keys: K[]): Promise<boolean[]>;

    /**
     * Remove all items from the cache.
     *
     * @returns {boolean}
     * @memberof ICacheStore
     */
    flush(): Promise<boolean>;

    /**
     * Get the cache key prefix.
     *
     * @returns {string}
     * @memberof ICacheStore
     */
    getPrefix(): Promise<string>;
}
